import type { Article } from '../../../types';
import {
  compilePagesAndLines,
  detectLanguage,
  formatFileSize,
  parseFile,
} from '../../../utils/documentParser';
import { newId } from '../../../lib/ids';
import { apiPost } from '../../../lib/apiClient';

interface ImportTextResponse {
  contentKind: 'text';
  originalUrl: string;
  finalUrl: string;
  domain: string;
  title: string;
  byline?: string;
  paragraphs: string[];
}

interface ImportPdfResponse {
  contentKind: 'pdf';
  originalUrl: string;
  finalUrl: string;
  domain: string;
  fileName: string;
  base64: string;
}

type ImportResponse = ImportTextResponse | ImportPdfResponse;

/** Group paragraphs into pseudo-pages so the reader gets navigation + progress. */
function chunkIntoPages(paragraphs: string[], perPage = 6): string[] {
  const pages: string[] = [];
  for (let i = 0; i < paragraphs.length; i += perPage) {
    pages.push(paragraphs.slice(i, i + perPage).join('\n\n'));
  }
  return pages.length ? pages : [''];
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Import a document from a URL: calls the SSRF-guarded server route and turns
 * the result into an in-memory `Article`. HTML/text becomes paragraph pages;
 * a PDF is handed to the existing client parser. Source provenance is preserved.
 */
export async function importFromUrl(
  url: string,
  onProgress?: (percent: number) => void,
): Promise<Article> {
  const data = await apiPost<ImportResponse>('/api/import/url', { url }, { timeoutMs: 30_000 });

  if (data.contentKind === 'pdf') {
    const bytes = base64ToBytes(data.base64);
    const file = new File([bytes], data.fileName, { type: 'application/pdf' });
    const article = await parseFile(file, onProgress);
    article.sourceUrl = data.finalUrl;
    article.sourceDomain = data.domain;
    return article;
  }

  const id = newId();
  const rawPages = chunkIntoPages(data.paragraphs);
  const { pages, lines } = compilePagesAndLines(rawPages, id);
  const text = data.paragraphs.join('\n\n');
  return {
    id,
    title: data.title || data.domain,
    fileName: `${data.domain} (web)`,
    fileSize: formatFileSize(new TextEncoder().encode(text).length),
    fileType: 'txt',
    text,
    pages,
    lines,
    language: detectLanguage(text),
    sourceUrl: data.finalUrl,
    sourceDomain: data.domain,
  };
}
