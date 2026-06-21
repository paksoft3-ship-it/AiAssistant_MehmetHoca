import { getDb } from './database';
import { LEGACY_KEYS, MIGRATION_FLAG } from './migrations';

/** Preference keys EidosUs keeps in localStorage. */
export const PREF_KEYS = {
  lastActiveDocument: 'eidosus_last_active_doc',
} as const;

/**
 * Permanently delete ALL local user data (CLAUDE.md §17 "Verilerimi Sil").
 *
 * Clears every IndexedDB table and, when `includeLegacy` is set, the legacy
 * prototype localStorage keys + migration flag as well. Preferences such as the
 * last-active-document pointer are always cleared.
 */
export async function resetAllData(options?: { includeLegacy?: boolean }): Promise<void> {
  const db = getDb();
  await db.transaction(
    'rw',
    [db.documents, db.pages, db.segments, db.notes, db.discussions, db.exports, db.fileBlobs],
    async () => {
      await Promise.all([
        db.documents.clear(),
        db.pages.clear(),
        db.segments.clear(),
        db.notes.clear(),
        db.discussions.clear(),
        db.exports.clear(),
        db.fileBlobs.clear(),
      ]);
    },
  );

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(PREF_KEYS.lastActiveDocument);
    if (options?.includeLegacy) {
      localStorage.removeItem(LEGACY_KEYS.active);
      localStorage.removeItem(LEGACY_KEYS.notes);
      localStorage.removeItem(LEGACY_KEYS.archive);
      localStorage.removeItem(MIGRATION_FLAG);
    }
  }
}
