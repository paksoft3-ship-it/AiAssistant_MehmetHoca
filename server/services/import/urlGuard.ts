/**
 * SSRF protection for the URL-import feature (Beta spec §11).
 *
 * These are pure, dependency-free checks so they can be unit-tested exhaustively
 * and reused at every redirect hop. The network layer (fetchSource) resolves the
 * hostname and calls `isPrivateAddress` on every resolved IP before connecting.
 */

export class UrlImportError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid_url'
      | 'blocked_host'
      | 'blocked_address'
      | 'too_large'
      | 'timeout'
      | 'unsupported_type'
      | 'fetch_failed'
      | 'extract_failed',
  ) {
    super(message);
    this.name = 'UrlImportError';
  }
}

/** Parse and require an http(s) URL. Throws UrlImportError on anything else. */
export function parseImportUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UrlImportError('Geçersiz bağlantı adresi.', 'invalid_url');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlImportError('Yalnızca http ve https bağlantıları desteklenir.', 'invalid_url');
  }
  if (isBlockedHostname(url.hostname)) {
    throw new UrlImportError('Bu adres içe aktarılamaz (yerel/iç ağ).', 'blocked_host');
  }
  return url;
}

/** Hostnames that must never be fetched, independent of DNS resolution. */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === 'metadata.google.internal') return true;
  // Bracketed IPv6 literals arrive without brackets from URL.hostname, but guard anyway.
  const literal = host.replace(/^\[|\]$/g, '');
  if (isIpAddress(literal)) return isPrivateAddress(literal);
  return false;
}

export function isIpAddress(value: string): boolean {
  return isIpv4(value) || value.includes(':');
}

function isIpv4(value: string): boolean {
  const m = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  return m.slice(1).every((o) => Number(o) <= 255);
}

function ipv4ToInt(value: string): number {
  return value.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

function inRange(ip: number, cidr: string): boolean {
  const [base, bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ip & mask) === (ipv4ToInt(base) & mask);
}

// IPv4 ranges that must never be reached from the import fetcher.
const BLOCKED_V4_CIDRS = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10', // CGNAT
  '127.0.0.0/8', // loopback
  '169.254.0.0/16', // link-local (incl. cloud metadata 169.254.169.254)
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4', // multicast
  '240.0.0.0/4', // reserved
];

/**
 * True when an IP literal points at loopback, private, link-local, or otherwise
 * non-public space (IPv4 and IPv6, including IPv4-mapped IPv6).
 */
export function isPrivateAddress(ip: string): boolean {
  const addr = ip.trim().toLowerCase().replace(/^\[|\]$/g, '');

  if (isIpv4(addr)) {
    const n = ipv4ToInt(addr);
    return BLOCKED_V4_CIDRS.some((cidr) => inRange(n, cidr));
  }

  if (addr.includes(':')) {
    if (addr === '::1' || addr === '::') return true;
    // IPv4-mapped / -compatible: ::ffff:a.b.c.d or ::a.b.c.d
    const mapped = addr.match(/(?:::ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped && isIpv4(mapped[1])) return isPrivateAddress(mapped[1]);
    const first = addr.split(':')[0];
    // fc00::/7 unique-local (fc, fd), fe80::/10 link-local (fe8–feb)
    if (first.startsWith('fc') || first.startsWith('fd')) return true;
    if (first.startsWith('fe8') || first.startsWith('fe9') || first.startsWith('fea') || first.startsWith('feb')) return true;
    if (first.startsWith('2001:db8') || addr.startsWith('2001:db8')) return true; // documentation
    return false;
  }

  // Unknown format — fail closed.
  return true;
}
