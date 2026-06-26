import dns from 'node:dns/promises';
import { parseImportUrl, isPrivateAddress, UrlImportError } from './urlGuard';

export interface FetchedSource {
  kind: 'pdf' | 'html' | 'text';
  finalUrl: string;
  contentType: string;
  /** Present for kind === 'pdf'. */
  bytes?: Uint8Array;
  /** Present for kind === 'html' | 'text'. */
  text?: string;
}

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const USER_AGENT = 'EidosusBot/0.1 (+academic reading assistant; respects robots)';

/** Resolve a hostname and reject if ANY resolved address is non-public (anti-SSRF). */
async function assertPublicHost(url: URL): Promise<void> {
  // parseImportUrl already blocks literal private IPs and internal names.
  parseImportUrl(url.toString());
  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new UrlImportError('Adres çözümlenemedi.', 'fetch_failed');
  }
  if (addresses.length === 0) {
    throw new UrlImportError('Adres çözümlenemedi.', 'fetch_failed');
  }
  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new UrlImportError('Bu adres iç/özel bir ağ adresine çözümleniyor.', 'blocked_address');
    }
  }
}

/** Read a response body, aborting if it exceeds the size cap (defends against lying headers). */
async function readCapped(res: Response): Promise<Uint8Array> {
  const declared = Number(res.headers.get('content-length') || '0');
  if (declared && declared > MAX_BYTES) {
    throw new UrlImportError('İçerik çok büyük.', 'too_large');
  }
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new UrlImportError('İçerik çok büyük.', 'too_large');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * Fetch a remote document safely: validates and re-resolves the host at every
 * redirect hop, enforces a timeout, caps the body size, and only accepts
 * PDF / HTML / plain-text content. Returns the raw payload for extraction.
 */
export async function fetchSource(rawUrl: string): Promise<FetchedSource> {
  let current = parseImportUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5' },
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof UrlImportError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new UrlImportError('Bağlantı zaman aşımına uğradı.', 'timeout');
      }
      throw new UrlImportError('İçerik getirilemedi.', 'fetch_failed');
    }
    clearTimeout(timer);

    // Manual redirect handling so each hop is re-validated against SSRF rules.
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new UrlImportError('Geçersiz yönlendirme.', 'fetch_failed');
      current = parseImportUrl(new URL(location, current).toString());
      continue;
    }

    if (!res.ok) {
      throw new UrlImportError(`Kaynak hata döndürdü (${res.status}).`, 'fetch_failed');
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const finalUrl = current.toString();

    if (contentType.includes('application/pdf')) {
      return { kind: 'pdf', finalUrl, contentType, bytes: await readCapped(res) };
    }
    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      return { kind: 'html', finalUrl, contentType, text: new TextDecoder().decode(await readCapped(res)) };
    }
    if (contentType.includes('text/plain') || contentType === '') {
      return { kind: 'text', finalUrl, contentType, text: new TextDecoder().decode(await readCapped(res)) };
    }
    throw new UrlImportError('Bu içerik türü desteklenmiyor.', 'unsupported_type');
  }

  throw new UrlImportError('Çok fazla yönlendirme.', 'fetch_failed');
}
