import { Article, ParsedPage, ParsedLine } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a hashed, locally-served worker asset (no CDN dependency).
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// Namespace import works with mammoth's `export =`; Vite applies its browser-field
// substitutions automatically when importing the package root.
import * as mammoth from 'mammoth';

// Configure the PDF.js worker once, from the bundled local asset.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Dynamically extract text from documents (PDF, DOCX, TXT) in the browser.
 * PDF.js and Mammoth are bundled locally via npm (no runtime CDN scripts).
 */

// Helper to calculate file size in readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Collapses single letters separated by spaces if they form running sequences, e.g. "S T R A T E G Y" -> "STRATEGY"
 */
export function collapseSpacedOutText(text: string): string {
  if (!text) return '';
  // Regex to match sequences of single characters separated by spaces (minimum 2 letters)
  const regex = /(?:^|(?<=\s))((?:[a-zA-ZÇĞİÖŞÜçğıöşü]\s)+[a-zA-ZÇĞİÖŞÜçğıöşü])(?=\s|$)/g;
  return text.replace(regex, (match) => {
    return match.replace(/\s+/g, '');
  });
}

/**
 * Reconstruct a single horizontal line of PDF items with appropriate spacing
 */
export function reconstructLineText(lineItems: any[]): string {
  if (!lineItems || lineItems.length === 0) return '';
  // Sort items horizontally
  const sorted = [...lineItems].sort((a, b) => a.transform[4] - b.transform[4]);
  
  let lineText = '';
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    if (i === 0) {
      lineText = item.str;
    } else {
      const prevItem = sorted[i - 1];
      const prevX = prevItem.transform[4];
      const currentX = item.transform[4];
      
      const fontScale = Math.abs(prevItem.transform[0]) || 12;
      const estimatedCharWidth = fontScale * 0.28;
      const textWidth = prevItem.width ? (prevItem.width * fontScale) / 1000 : (prevItem.str.length * estimatedCharWidth);
      
      const actualGap = currentX - (prevX + textWidth);
      
      const needsSpace = 
        prevItem.str.endsWith(' ') || 
        item.str.startsWith(' ') || 
        actualGap > Math.max(2.5, fontScale * 0.24);
      
      if (needsSpace && !prevItem.str.endsWith(' ') && !item.str.startsWith(' ')) {
        lineText += ' ' + item.str;
      } else {
        lineText += item.str;
      }
    }
  }
  
  return collapseSpacedOutText(lineText).replace(/\s+/g, ' ').trim();
}

/**
 * Identify headings from body text dynamically
 */
export function isLineHeading(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length > 85) return false; // Headings are usually short

  // Headings NEVER end in comma, semicolon, colon, or typical continuation hyphens
  if (/[,,;:–\-&]$/.test(trimmed)) return false;

  // Headings do not end in closing quotation marks or parentheses followed by lowercase
  if (/[)\]}"]/.test(trimmed) && trimmed.length > 30) return false;

  // Headings do not start with lowercase letters
  const firstChar = trimmed.charAt(0);
  if (firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase()) {
    return false; 
  }

  const endsWithSentencePeriod = /[.!?]$/.test(trimmed);
  const isNumberedSection = /^\d+(\.\d+)*\s+[A-ZÇĞİÖŞÜa-zçğıöşü]/.test(trimmed);
  const isUppercaseAll = trimmed.length > 3 && trimmed === trimmed.toUpperCase();

  // If a line starts with standard section numbering and is short without ending in standard punctuation
  if (isNumberedSection && !endsWithSentencePeriod) {
    return true;
  }

  // If the line is short, doesn't end with a sentence period, stands alone
  if (!endsWithSentencePeriod && trimmed.length < 65) {
    return true;
  }

  // If it is uppercase all and relatively short, and doesn't end with standard period
  if (isUppercaseAll && !endsWithSentencePeriod && trimmed.length < 55) {
    return true;
  }

  return false;
}

/**
 * Check if the text matches common academic/journal legal disclaimers and warnings to exclude them
 */
export function isAcademicDisclaimerNoise(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  
  const disclaimerPhrases = [
    'users may print',
    'download, or email',
    'individual use only',
    'for individual use',
    'strictly for personal',
    'personal use only',
    'non-commercial use',
    'protected by copyright',
    'all rights reserved',
    'unauthorized distribution',
    'prohibited from copying',
    'this article is protected',
    'downloaded from',
    'reproduced with permission',
    'tüm hakları saklıdır',
    'bireysel kullanım için',
    'izinsiz kopyalanamaz',
    'ticari amaçla',
    'kopya edilmesi yasaktır',
    'distribution of this material',
    'download, or email articles',
    'academic use only'
  ];

  for (const phrase of disclaimerPhrases) {
    if (lower.includes(phrase)) {
      return true;
    }
  }
  return false;
}

/**
 * Filter out academic and layout running items from pages (footers, page numbers, publishers, years)
 */
export function isHeaderFooterNoise(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  // Single letter/character lines are layout noise
  if (trimmed.length < 2) return true;

  // Filter out any academic disclaimers or legal noise
  if (isAcademicDisclaimerNoise(trimmed)) return true;
  
  // 1. Pure page number or number inside punctuation limits
  if (/^\s*\d+\s*$/.test(trimmed)) return true;
  if (/^[\[\(\{-]\s*\d+\s*[\]\)\}-]$/.test(trimmed)) return true; // e.g., - 12 - or (12)
  
  // 2. Page number variations: "Page X", "Sayfa X", "X / Y", "X of Y"
  if (/^(sayfa|page|pg\.?|p\.)\s*\d+$/i.test(trimmed)) return true;
  if (/^\d+\s*[\/\-of]\s*\d+$/i.test(trimmed)) return true;
  
  // 3. Academic indexing items like DOI
  if (/doi\s*:|doi\.org/i.test(trimmed)) return true;
  
  // 4. Academic journal volume/issue tags or copyright markers
  if (/\bvol(ume)?\.?\s*\d+/i.test(trimmed)) return true;
  if (/\bcilt\.?\s*\d+/i.test(trimmed)) return true;
  if (/\bsayı\.?\s*\d+/i.test(trimmed)) return true;
  if (/\bno\.?\s*\d+/i.test(trimmed)) return true;
  if (/\bissn\s*[0-9-]+/i.test(trimmed)) return true;
  if (/\be-issn\s*[0-9-]+/i.test(trimmed)) return true;
  if (/©\s*\d{4}/.test(trimmed)) return true;
  if (/\b(all rights reserved|tüm hakları saklıdır|her hakkı saklıdır)\b/i.test(trimmed)) return true;
  
  // 5. Publisher/Journal/Conference headers noise (when line is relatively short as a running layout item)
  const noiseTerms = [
    'journal of', 'proceedings of', 'academic press', 'springer', 'wiley', 'elsevier', 
    'sciencedirect', 'researchgate', 'dergipark', 'dergi park', 'research article', 
    'original article', 'özgün araştırma', 'araştırma makalesi', 'review paper', 
    'conference paper', 'conference report', 'symposium', 'conference proceedings',
    'vol.', 'cilt', 'issn', 'e-issn', 'doi:', 'doi.org', 'http://', 'https://',
    'copyright ©', 'tüm hakları saklıdır', 'all rights reserved', 'research & conference',
    'at the leading edge', 'leading edge'
  ];
  
  const lower = trimmed.toLowerCase();
  for (const term of noiseTerms) {
    if (lower.includes(term) && trimmed.length < 130) {
      return true;
    }
  }
  
  return false;
}

/**
 * Clear header/footer/page limits noise on a given page text
 */
export function cleanPageHeadersFooters(pageText: string): string {
  if (!pageText) return '';
  const lines = pageText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  const total = lines.length;
  const indicesToRemove = new Set<number>();

  // Prune top 2 lines if they contain publication headers or page markers
  for (let i = 0; i < Math.min(2, total); i++) {
    if (isHeaderFooterNoise(lines[i])) {
      indicesToRemove.add(i);
    }
  }

  // Prune bottom 2 lines if they contain copyright metadata or running numbers
  for (let i = Math.max(0, total - 2); i < total; i++) {
    if (isHeaderFooterNoise(lines[i])) {
      indicesToRemove.add(i);
    }
  }

  const finalLines = lines.filter((_, idx) => !indicesToRemove.has(idx));
  return finalLines.join('\n');
}

/**
 * Reconstruct raw text lines into unified paragraph blocks
 */
export function reconstructParagraphs(text: string): string[] {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim());
  const paragraphs: string[] = [];
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      continue;
    }

    if (!currentParagraph) {
      currentParagraph = line;
    } else {
      const prevLine = currentParagraph;
      const prevTrimmed = prevLine.trim();
      const currentTrimmed = line.trim();

      // Check if we should join the current line to the current paragraph
      let shouldJoin = false;

      // 1. If current line starts with lowercase, it is always a continuation of the previous line
      const firstChar = currentTrimmed.charAt(0);
      const isStartLowercase = firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase();
      
      // 2. If the previous line ends with middle-sentence characters: comma, semicolon, colon, hyphen, or conjunctions
      const endsWithMidPunct = /[,,;:–\-\&]$/.test(prevTrimmed);

      // 3. Or if previous line does not end in a sentence delimiter (. ! ?) and is relatively long (meaning it's a wrapped line of body text)
      const endsWithSentenceDelimiter = /[.!?]$/.test(prevTrimmed);
      const isPrevLineLong = prevTrimmed.length > 45;

      // 4. Do not join if current line starts with a clear list bullet/number pattern
      const isCurrentList = /^([\*•\-\+]|\d+[\.\)]|\b[a-z]\))\s+/i.test(currentTrimmed);

      // 5. Do not join if previous line looks like a heading
      const isPrevHeading = isLineHeading(prevTrimmed);

      if (isStartLowercase && !isCurrentList) {
        shouldJoin = true;
      } else if (endsWithMidPunct && !isCurrentList) {
        shouldJoin = true;
      } else if (!endsWithSentenceDelimiter && isPrevLineLong && !isCurrentList && !isPrevHeading) {
        shouldJoin = true;
      }

      if (shouldJoin) {
        if (prevTrimmed.endsWith('-') || prevTrimmed.endsWith('‑')) {
          currentParagraph = currentParagraph.slice(0, -1) + line;
        } else {
          currentParagraph += ' ' + line;
        }
      } else {
        paragraphs.push(currentParagraph);
        currentParagraph = line;
      }
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs.map(p => p.trim()).filter(Boolean);
}

// Split text into meaningful sentences/lines for speech synthesis, preserving heading lines
export function segmentTextIntoLines(text: string): string[] {
  if (!text) return [];
  
  // Reconstruct paragraph blocks to group soft wraps and prevent false headings
  const blocks = reconstructParagraphs(text);
  const finalSentences: string[] = [];

  for (const block of blocks) {
    // Apply spaced-out text collapse on the block level
    const collapsedBlock = collapseSpacedOutText(block);
    const normalized = collapsedBlock.replace(/\s+/g, ' ').trim();
    if (!normalized) continue;

    // Check if block itself is a short, distinct layout Heading/Noise
    if (isLineHeading(normalized)) {
      if (isHeaderFooterNoise(normalized)) continue;
      finalSentences.push(normalized);
      continue;
    }

    // Split paragraphs into individual sentences
    const sentences: string[] = [];
    const regex = /[^.!?]+[.!?]+(\s+|$)/g;
    let match;
    let lastIndex = 0;
    
    while ((match = regex.exec(normalized)) !== null) {
      const sentence = match[0].trim();
      if (sentence.length > 0) {
        sentences.push(sentence);
      }
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < normalized.length) {
      const remaining = normalized.substring(lastIndex).trim();
      if (remaining.length > 0) {
        sentences.push(remaining);
      }
    }

    if (sentences.length === 0) {
      sentences.push(normalized);
    }

    // Subdivide excessively long body parts (easy breathing rate limits)
    for (const s of sentences) {
      if (isHeaderFooterNoise(s)) continue; // Filter out if a sentence itself is identified as noise
      
      if (s.length > 450) {
        const subParts = s.split(/([,;:]\s+)/);
        let currentPart = '';
        
        for (const p of subParts) {
          if (currentPart.length + p.length > 450) {
            if (currentPart.trim()) finalSentences.push(currentPart.trim());
            currentPart = p;
          } else {
            currentPart += p;
          }
        }
        if (currentPart.trim()) finalSentences.push(currentPart.trim());
      } else {
        finalSentences.push(s);
      }
    }
  }

  return finalSentences.filter(s => s.length > 1);
}

/**
 * Detect language of a given text using a lightweight stopword frequency table.
 * Supports: tr (Turkish), en (English), de (German), fr (French), es (Spanish), it (Italian)
 */
export function detectLanguage(text: string): string {
  if (!text) return 'tr';
  const sample = text.toLowerCase().substring(0, 5000);

  const stopwords: Record<string, string[]> = {
    tr: ['ve', 'bir', 'bu', 'da', 'de', 'için', 'ile', 'ne', 'çok', 'en', 'ama', 'her', 'gibi', 'daha', 'olarak', 'olan', 'veya', 'ise'],
    en: ['the', 'and', 'of', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or', 'by', 'an', 'not', 'but'],
    de: ['der', 'die', 'das', 'und', 'ist', 'in', 'zu', 'den', 'von', 'mit', 'dass', 'es', 'ein', 'eine', 'auf', 'für', 'an', 'er', 'als', 'sie', 'sind', 'oder', 'nicht', 'aus', 'bei'],
    fr: ['le', 'la', 'les', 'et', 'de', 'en', 'un', 'une', 'que', 'est', 'dans', 'pour', 'qui', 'ce', 'ses', 'des', 'sur', 'par', 'ou', 'pas', 'aux', 'avec'],
    es: ['el', 'la', 'los', 'las', 'y', 'de', 'en', 'un', 'una', 'que', 'es', 'con', 'para', 'por', 'al', 'lo', 'del', 'o', 'no', 'su', 'sus'],
    it: ['il', 'la', 'i', 'gli', 'le', 'e', 'di', 'in', 'un', 'una', 'che', 'è', 'con', 'per', 'da', 'si', 'del', 'dei', 'o', 'non', 'su']
  };

  const scores: Record<string, number> = {
    tr: 0,
    en: 0,
    de: 0,
    fr: 0,
    es: 0,
    it: 0
  };

  const words = sample.split(/[\s,.:;!?"'()\[\]]+/);
  for (const word of words) {
    if (word.length < 2) continue;
    for (const [lang, list] of Object.entries(stopwords)) {
      if (list.includes(word)) {
        scores[lang]++;
      }
    }
  }

  let bestLang = 'tr';
  let maxScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  }

  if (maxScore === 0) {
    return 'en'; // Safe default global language
  }

  return bestLang;
}

export function checkIfGraph(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  
  // Match terms like "Grafik 1", "Graph 2", "Şekil 3", "Figure 4", "Chart 5", "Diyagram X"
  // or simple starters like "Grafik :", "Şekil :", etc.
  const pattern = /^(grafik|graph|şekil|figure|chart|diyagram|tablo|table|görsel|gorsel)\s*(\d+|[i|v|x]+)?[:.\-\s]/i;
  const simpleMatch = /^(grafik|graph|şekil|figure|chart|diyagram|tablo|table)\b/i.test(lower);
  
  return (pattern.test(trimmed) || simpleMatch) && trimmed.length < 150;
}

// Map a list of sentences into Structured Pages and Lines
export function compilePagesAndLines(
  rawPagesText: string[],
  articleId: string
): { pages: ParsedPage[]; lines: ParsedLine[] } {
  const pages: ParsedPage[] = [];
  const lines: ParsedLine[] = [];
  let globalIndex = 0;

  rawPagesText.forEach((pageText, idx) => {
    const pageNum = idx + 1;
    const pageSentences = segmentTextIntoLines(pageText);

    pages.push({
      pageNumber: pageNum,
      text: pageText,
      lines: pageSentences,
    });

    pageSentences.forEach((sentenceText, lineIdx) => {
      lines.push({
        text: sentenceText,
        pageNumber: pageNum,
        lineNumber: lineIdx + 1,
        globalIndex: globalIndex++,
        isHeading: isLineHeading(sentenceText),
        isGraph: checkIfGraph(sentenceText),
      });
    });
  });

  return { pages, lines };
}

/**
 * Parse a TXT file
 */
export async function parseTxtFile(file: File): Promise<Partial<Article>> {
  const text = await file.text();
  
  // Synthesize pages for text files (approx 1200 characters or 12 sentences per page)
  const rawLines = segmentTextIntoLines(text);
  const rawPagesText: string[] = [];
  
  const sentencesPerPage = 12;
  for (let i = 0; i < rawLines.length; i += sentencesPerPage) {
    const pageChunk = rawLines.slice(i, i + sentencesPerPage).join(' ');
    rawPagesText.push(pageChunk);
  }

  const { pages, lines } = compilePagesAndLines(
    rawPagesText.length > 0 ? rawPagesText : [text],
    file.name
  );

  return {
    title: file.name.replace(/\.[^/.]+$/, ""),
    text,
    pages,
    lines,
  };
}

/**
 * Parse a DOCX file using Mammoth.js
 */
export async function parseDocxFile(file: File): Promise<Partial<Article>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;

        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        const warnings = result.messages;
        if (warnings && warnings.length > 0) {
          console.warn('Docx parsing warnings:', warnings);
        }

        // Synthesize pages for DOCX (approx 12-15 sentences per page)
        const rawLines = segmentTextIntoLines(text);
        const rawPagesText: string[] = [];
        
        const sentencesPerPage = 12;
        for (let i = 0; i < rawLines.length; i += sentencesPerPage) {
          const pageChunk = rawLines.slice(i, i + sentencesPerPage).join(' ');
          rawPagesText.push(pageChunk);
        }

        const { pages, lines } = compilePagesAndLines(
          rawPagesText.length > 0 ? rawPagesText : [text],
          file.name
        );

        resolve({
          title: file.name.replace(/\.[^/.]+$/, ""),
          text,
          pages,
          lines,
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a PDF file using PDF.js
 */
export async function parsePdfFile(file: File, onProgress?: (percent: number) => void): Promise<Partial<Article>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        
        // Progress hook up
        if (onProgress) {
          loadingTask.onProgress = (progressData: any) => {
            if (progressData.total > 0) {
              const percent = Math.round((progressData.loaded / progressData.total) * 100);
              onProgress(percent);
            }
          };
        }

        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const rawPagesText: string[] = [];
        let fullText = '';

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // pdfjs types items as (TextItem | TextMarkedContent)[]; we only keep
          // positioned text items (those exposing `str`) and treat them loosely.
          const items: any[] = [...textContent.items].filter(
            (item: any) => item && typeof item.str === 'string',
          );
          
          // Group items by their vertical coordinate (posY = transform[5])
          // We can use a tolerance of 5px to group items that are physically on the same text line.
          const tolerance = 5;
          const linesMap: { y: number; items: any[] }[] = [];
          
          for (const item of items) {
            const y = item.transform[5];
            
            // Look for an existing grouped line with similar Y vertical offset
            let group = linesMap.find(g => Math.abs(g.y - y) < tolerance);
            if (!group) {
              group = { y, items: [] };
              linesMap.push(group);
            }
            group.items.push(item);
          }
          
          // Sort the horizontal lines from top to bottom (posY is highest at top of page, so sort descending)
          linesMap.sort((a, b) => b.y - a.y);
          
          // Detect if this page is a high-confidence multi-column page
          const xCoords = items.map((item: any) => item.transform[4]).filter(x => typeof x === 'number');
          const minX = xCoords.length > 0 ? Math.min(...xCoords) : 0;
          const maxX = xCoords.length > 0 ? Math.max(...xCoords) : 612;
          const pageWidth = maxX - minX;

          // Look for a two-column layout split point (between 38% and 62% of page width)
          const startSearchX = minX + pageWidth * 0.38;
          const endSearchX = minX + pageWidth * 0.62;
          const numSteps = 15;
          const stepSize = (endSearchX - startSearchX) / numSteps;

          let bestSplitX = -1;
          let minOverlaps = Infinity;
          let bestSplitScore = 0;

          for (let i = 0; i <= numSteps; i++) {
            const splitX = startSearchX + i * stepSize;
            
            let overlaps = 0;
            let leftCount = 0;
            let rightCount = 0;
            
            for (const item of items) {
              const fontScale = Math.abs(item.transform[0]) || 12;
              const estimatedCharWidth = fontScale * 0.28;
              const itemWidth = item.width ? (item.width * fontScale) / 1000 : (item.str.length * estimatedCharWidth);
              const itemLeft = item.transform[4];
              const itemRight = itemLeft + itemWidth;
              
              if (itemLeft < splitX - 15 && itemRight > splitX + 15) {
                overlaps++;
              } else if (itemRight <= splitX) {
                leftCount++;
              } else if (itemLeft >= splitX) {
                rightCount++;
              }
            }
            
            const minSideDensity = Math.round(items.length * 0.12);
            if (leftCount >= minSideDensity && rightCount >= minSideDensity) {
              const balance = 1 - Math.abs(leftCount - rightCount) / (leftCount + rightCount || 1);
              const score = (items.length - overlaps) * balance;
              
              if (overlaps < minOverlaps || (overlaps === minOverlaps && score > bestSplitScore)) {
                minOverlaps = overlaps;
                bestSplitX = splitX;
                bestSplitScore = score;
              }
            }
          }

          const isPageTwoColumn = bestSplitX !== -1 && (minOverlaps / items.length) < 0.08;

          const reconstructedLines: string[] = [];

          if (isPageTwoColumn) {
            let leftAccumulator: string[] = [];
            let rightAccumulator: string[] = [];

            const flushColumns = () => {
              if (leftAccumulator.length > 0) {
                reconstructedLines.push(...leftAccumulator);
                leftAccumulator = [];
              }
              if (rightAccumulator.length > 0) {
                reconstructedLines.push(...rightAccumulator);
                rightAccumulator = [];
              }
            };

            for (const line of linesMap) {
              // Check if any item in this line crosses the splitter
              const hasCrossingItem = line.items.some((item: any) => {
                const fontScale = Math.abs(item.transform[0]) || 12;
                const estimatedCharWidth = fontScale * 0.28;
                const itemWidth = item.width ? (item.width * fontScale) / 1000 : (item.str.length * estimatedCharWidth);
                const itemLeft = item.transform[4];
                const itemRight = itemLeft + itemWidth;
                return itemLeft < bestSplitX - 15 && itemRight > bestSplitX + 15;
              });

              if (hasCrossingItem) {
                // Flush current column blocks first
                flushColumns();
                // Process as single-column full-width line
                const lineText = reconstructLineText(line.items);
                if (lineText) {
                  reconstructedLines.push(lineText);
                }
              } else {
                // Split line into Left column group and Right column group
                const leftItems: any[] = [];
                const rightItems: any[] = [];

                for (const item of line.items) {
                  const fontScale = Math.abs(item.transform[0]) || 12;
                  const estimatedCharWidth = fontScale * 0.28;
                  const itemWidth = item.width ? (item.width * fontScale) / 1000 : (item.str.length * estimatedCharWidth);
                  const itemLeft = item.transform[4];
                  const itemCenter = itemLeft + itemWidth / 2;

                  if (itemCenter < bestSplitX) {
                    leftItems.push(item);
                  } else {
                    rightItems.push(item);
                  }
                }

                const leftText = reconstructLineText(leftItems);
                const rightText = reconstructLineText(rightItems);

                if (leftText) leftAccumulator.push(leftText);
                if (rightText) rightAccumulator.push(rightText);
              }
            }

            // Flush remaining buffers at bottom
            flushColumns();

          } else {
            // Standard single-column horizontal grouping
            for (const line of linesMap) {
              const lineText = reconstructLineText(line.items);
              if (lineText) {
                reconstructedLines.push(lineText);
              }
            }
          }
          
          const rawPageText = reconstructedLines.join('\n');
          
          // Remove page numbers, header/footer noise from top 2/bottom 2 physical lines
          const pageText = cleanPageHeadersFooters(rawPageText);

          rawPagesText.push(pageText);
          fullText += (pageNum > 1 ? '\n\n' : '') + `--- Sayfa ${pageNum} ---\n` + pageText;
          
          if (onProgress) {
            // Emulate remaining parsing percentage
            onProgress(Math.round((pageNum / totalPages) * 100));
          }
        }

        // Detect scanned / image-only PDFs: pages exist but almost no extractable
        // text. We do not OCR in the MVP, so surface a clear, honest message
        // instead of silently returning an empty document (CLAUDE.md §7.3, §18).
        const extractedTextLength = rawPagesText.join('').replace(/\s/g, '').length;
        if (totalPages > 0 && extractedTextLength < Math.max(20, totalPages * 5)) {
          throw new Error(
            'Bu PDF taranmış görüntülerden oluşuyor olabilir; metin çıkarılamadı. OCR henüz desteklenmiyor.',
          );
        }

        const { pages, lines } = compilePagesAndLines(rawPagesText, file.name);

        resolve({
          title: file.name.replace(/\.[^/.]+$/, ""),
          text: fullText,
          pages,
          lines,
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Main switch-board function for document parsing
 */
export async function parseFile(
  file: File, 
  onProgress?: (percent: number) => void
): Promise<Article> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let result: Partial<Article>;

  if (extension === 'txt') {
    result = await parseTxtFile(file);
  } else if (extension === 'docx') {
    result = await parseDocxFile(file);
  } else if (extension === 'pdf') {
    result = await parsePdfFile(file, onProgress);
  } else if (extension === 'doc') {
    // Attempt standard file text fallback or warn user to convert to .docx
    throw new Error('Eski Microsoft Word (.doc) formatı tam olarak desteklenmiyor. Lütfen belgenizi .docx veya .pdf olarak kaydedip tekrar yükleyin.');
  } else {
    throw new Error(`Desteklenmeyen dosya formatı: .${extension}. Lütfen PDF, DOCX veya TXT dosyası yükleyin.`);
  }

  const detectedLang = detectLanguage(result.text || '');

  return {
    id: crypto.randomUUID(),
    title: result.title || file.name,
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileType: (extension as any) === 'doc' ? 'docx' : (extension as any),
    text: result.text || '',
    pages: result.pages || [],
    lines: result.lines || [],
    language: detectedLang,
  };
}
