import { Router } from 'express';
import { importUrlRequestSchema } from '../schemas/importUrl';
import { fetchSource } from '../services/import/fetchSource';
import { extractHtmlArticle, extractPlainText } from '../services/import/extractArticle';
import { UrlImportError } from '../services/import/urlGuard';

export const importRouter = Router();

const STATUS_BY_CODE: Record<UrlImportError['code'], number> = {
  invalid_url: 400,
  blocked_host: 400,
  blocked_address: 400,
  unsupported_type: 415,
  too_large: 413,
  timeout: 504,
  fetch_failed: 502,
  extract_failed: 422,
};

function fileNameFromUrl(url: string): string {
  try {
    const { pathname, hostname } = new URL(url);
    const last = pathname.split('/').filter(Boolean).pop();
    return last && last.toLowerCase().endsWith('.pdf') ? last : `${hostname}.pdf`;
  } catch {
    return 'belge.pdf';
  }
}

/**
 * POST /api/import/url
 * Fetches a public URL safely (SSRF-guarded) and returns readable content for
 * the reader. HTML → Readability-extracted paragraphs; PDF → base64 bytes for
 * the client's existing parser; plain text → paragraphs. Privacy: logs only the
 * domain + outcome, never the fetched content.
 */
importRouter.post('/url', async (req, res) => {
  const parsed = importUrlRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Geçersiz istek.', code: 'invalid_request' });
  }

  let domain = '?';
  try {
    const source = await fetchSource(parsed.data.url);
    domain = new URL(source.finalUrl).hostname;

    if (source.kind === 'pdf') {
      const base64 = Buffer.from(source.bytes ?? new Uint8Array()).toString('base64');
      console.info(`[import] ok domain=${domain} kind=pdf bytes=${source.bytes?.byteLength ?? 0}`);
      return res.json({
        contentKind: 'pdf',
        originalUrl: parsed.data.url,
        finalUrl: source.finalUrl,
        domain,
        fileName: fileNameFromUrl(source.finalUrl),
        base64,
      });
    }

    const article =
      source.kind === 'html'
        ? extractHtmlArticle(source.text ?? '', source.finalUrl)
        : extractPlainText(source.text ?? '');

    console.info(`[import] ok domain=${domain} kind=${source.kind} paras=${article.paragraphs.length}`);
    return res.json({
      contentKind: 'text',
      originalUrl: parsed.data.url,
      finalUrl: source.finalUrl,
      domain,
      title: article.title,
      byline: article.byline,
      paragraphs: article.paragraphs,
    });
  } catch (err) {
    if (err instanceof UrlImportError) {
      console.warn(`[import] fail domain=${domain} code=${err.code}`);
      return res.status(STATUS_BY_CODE[err.code]).json({ error: err.message, code: err.code });
    }
    console.error('[import] unexpected error:', (err as Error).message);
    return res.status(500).json({ error: 'Beklenmeyen bir sunucu hatası oluştu.', code: 'server_error' });
  }
});
