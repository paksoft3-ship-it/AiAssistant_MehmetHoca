import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { UrlImportError } from './urlGuard';

export interface ExtractedArticle {
  title: string;
  byline?: string;
  /** Readable paragraphs in reading order. */
  paragraphs: string[];
}

const MIN_USEFUL_CHARS = 200;

/** The subset of Readability's parse result we rely on. */
interface ReadabilityResult {
  title: string | null;
  byline: string | null;
  content: string | null;
  textContent: string | null;
}

/** Collapse whitespace and drop empty paragraphs. */
function cleanParagraphs(parts: string[]): string[] {
  return parts
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/**
 * Extract the main article from an HTML page using Mozilla Readability (the same
 * engine Firefox Reader View uses). Scripts/ads/nav are stripped by Readability;
 * we then pull block-level text in reading order. Throws when no useful text is
 * found (e.g. paywalled or JS-only pages).
 */
export function extractHtmlArticle(html: string, url: string): ExtractedArticle {
  let article: ReadabilityResult | null;
  try {
    const dom = new JSDOM(html, { url });
    article = new Readability(dom.window.document).parse() as ReadabilityResult | null;
  } catch {
    throw new UrlImportError('Sayfa içeriği çözümlenemedi.', 'extract_failed');
  }
  if (!article || !article.content) {
    throw new UrlImportError('Bu sayfadan okunabilir metin çıkarılamadı.', 'extract_failed');
  }

  // Pull block-level text from the cleaned content for paragraph segmentation.
  const contentDom = new JSDOM(article.content);
  const elements = Array.from(
    contentDom.window.document.querySelectorAll('p, li, h1, h2, h3, h4, blockquote'),
  ) as Array<{ textContent: string | null }>;
  const blocks = elements.map((el) => el.textContent ?? '');
  let paragraphs = cleanParagraphs(blocks);

  // Fallback: if structure was thin, split the flat textContent.
  if (paragraphs.join(' ').length < MIN_USEFUL_CHARS && article.textContent) {
    paragraphs = cleanParagraphs(article.textContent.split(/\n{2,}/));
  }

  if (paragraphs.join(' ').length < MIN_USEFUL_CHARS) {
    throw new UrlImportError('Bu sayfadan yeterli metin çıkarılamadı.', 'extract_failed');
  }

  return {
    title: (article.title || '').trim() || 'Başlıksız Belge',
    byline: article.byline?.trim() || undefined,
    paragraphs,
  };
}

/** Turn a plain-text document into paragraphs (split on blank lines). */
export function extractPlainText(text: string): ExtractedArticle {
  const paragraphs = cleanParagraphs(text.split(/\n{2,}/));
  if (paragraphs.join(' ').length < 1) {
    throw new UrlImportError('Boş metin belgesi.', 'extract_failed');
  }
  const title = paragraphs[0].slice(0, 80) || 'Metin Belgesi';
  return { title, paragraphs };
}
