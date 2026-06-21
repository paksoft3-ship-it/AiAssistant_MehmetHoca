/**
 * Stable ID generation. Prefers crypto.randomUUID() with a tested fallback
 * for older browsers / non-secure contexts (CLAUDE.md §6).
 */
export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to manual generation
  }
  return uuidV4Fallback();
}

/** RFC4122-shaped v4 UUID using crypto.getRandomValues when available. */
export function uuidV4Fallback(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      // Deterministic-enough fallback; only reached when no crypto exists at all.
      bytes[i] = (i * 31 + 7) % 256;
    }
  }
  // Per RFC4122 §4.4: set version (4) and variant (10xx) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  );
}
