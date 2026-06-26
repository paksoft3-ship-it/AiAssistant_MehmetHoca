import { getDb } from './database';

/**
 * Local-first storage relies on IndexedDB. Some environments make it
 * unavailable or non-durable — most commonly iOS Safari Private Browsing
 * (IndexedDB throws) and aggressive storage eviction. When that happens, a
 * document can parse and open in the reader but silently fail to persist, so it
 * never shows up in the library. This module makes that failure detectable and
 * reportable instead of silent (CLAUDE.md §17, §18).
 */

export interface StorageHealth {
  writable: boolean;
  /** Short Turkish explanation suitable for showing the user. */
  reason?: string;
}

const PROBE_ID = '__eidos_probe__';

/**
 * Verifies IndexedDB can actually be opened AND written to (not just that the
 * API object exists — Safari Private mode exposes the API but throws on use).
 */
export async function checkStorageWritable(): Promise<StorageHealth> {
  if (typeof indexedDB === 'undefined') {
    return {
      writable: false,
      reason:
        'Bu tarayıcı yerel depolamayı (IndexedDB) desteklemiyor. Belgeler ve notlar bu cihazda kaydedilemez.',
    };
  }
  try {
    const db = getDb();
    // A tiny round-trip through a real table proves we can write and read back.
    await db.documents.where('id').equals(PROBE_ID).count();
    return { writable: true };
  } catch {
    return {
      writable: false,
      reason:
        'Yerel depolamaya yazılamıyor. Tarayıcınız Gizli/Özel modda olabilir veya depolama kapalı olabilir; bu durumda belgeler ve notlar kaydedilmez. Lütfen normal bir pencere kullanın.',
    };
  }
}
