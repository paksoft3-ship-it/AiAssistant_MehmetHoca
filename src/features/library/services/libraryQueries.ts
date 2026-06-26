import type { LibraryEntry } from '../../documents/services/documentService';

export type LibrarySortKey = 'recent' | 'title' | 'notes' | 'progress';

/** Reading progress ratio (0–1) from the last read anchor, if any. */
export function progressRatio(entry: LibraryEntry): number {
  const { lastReadAnchor, pageCount } = entry.document;
  if (!lastReadAnchor || !pageCount) return 0;
  return Math.min(1, Math.max(0, lastReadAnchor.pageNumber / pageCount));
}

/**
 * Picks the document to offer for "Okumaya Devam Et" (Continue Reading) on the
 * home page: the most-recently-opened document the user has actually started
 * reading. Prefers `lastActiveId` if it qualifies, otherwise the most recently
 * opened entry that has a reading anchor. Returns null when nothing qualifies.
 */
export function selectContinueEntry(
  entries: LibraryEntry[],
  lastActiveId?: string | null,
): LibraryEntry | null {
  const started = entries.filter((e) => !!e.document.lastReadAnchor);
  if (started.length === 0) return null;

  if (lastActiveId) {
    const preferred = started.find((e) => e.document.id === lastActiveId);
    if (preferred) return preferred;
  }

  return started.reduce((latest, e) => {
    const t = e.document.lastOpenedAt ?? e.document.updatedAt;
    const best = latest.document.lastOpenedAt ?? latest.document.updatedAt;
    return t > best ? e : latest;
  });
}

/** Case-insensitive search over document titles, authors, and filename. */
export function searchLibrary(entries: LibraryEntry[], query: string): LibraryEntry[] {
  const q = query.trim().toLocaleLowerCase('tr');
  if (!q) return entries;
  return entries.filter((e) => {
    const d = e.document;
    return (
      d.title.toLocaleLowerCase('tr').includes(q) ||
      d.fileName.toLocaleLowerCase('tr').includes(q) ||
      (d.authors ?? []).some((a) => a.toLocaleLowerCase('tr').includes(q))
    );
  });
}

/** Keep only documents in the given language (empty = all). */
export function filterByLanguage(entries: LibraryEntry[], language: string): LibraryEntry[] {
  if (!language) return entries;
  return entries.filter((e) => e.document.language === language);
}

/** Distinct languages present, in first-seen order. */
export function listLanguages(entries: LibraryEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of entries) {
    if (!seen.has(e.document.language)) {
      seen.add(e.document.language);
      out.push(e.document.language);
    }
  }
  return out;
}

/** Sort library entries (returns a new array). */
export function sortLibrary(entries: LibraryEntry[], key: LibrarySortKey): LibraryEntry[] {
  const copy = [...entries];
  switch (key) {
    case 'title':
      return copy.sort((a, b) => a.document.title.localeCompare(b.document.title, 'tr'));
    case 'notes':
      return copy.sort((a, b) => b.noteCount - a.noteCount);
    case 'progress':
      return copy.sort((a, b) => progressRatio(b) - progressRatio(a));
    case 'recent':
    default:
      return copy.sort((a, b) => {
        const at = a.document.lastOpenedAt ?? a.document.updatedAt;
        const bt = b.document.lastOpenedAt ?? b.document.updatedAt;
        return bt.localeCompare(at);
      });
  }
}
