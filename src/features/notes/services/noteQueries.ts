import type { ResearchNote } from '../../../types/domain';

export type NoteSortKey = 'source' | 'created' | 'updated';

/** Case-insensitive search across final note, raw transcript, source excerpt, and tags. */
export function searchNotes(notes: ResearchNote[], query: string): ResearchNote[] {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter((n) => {
    return (
      n.finalNote.toLowerCase().includes(q) ||
      n.rawTranscript.toLowerCase().includes(q) ||
      n.sourceAnchor.selectedText.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/** Keep only notes carrying the given tag (case-insensitive). Empty tag = all. */
export function filterByTag(notes: ResearchNote[], tag: string): ResearchNote[] {
  const t = tag.trim().toLowerCase();
  if (!t) return notes;
  return notes.filter((n) => n.tags.some((x) => x.toLowerCase() === t));
}

/**
 * Sort notes for display. Returns a new array.
 *  - 'source'  → by document position (sourceAnchor.globalIndex, then ordinal)
 *  - 'created' → newest first by createdAt
 *  - 'updated' → most recently edited first
 */
export function sortNotes(notes: ResearchNote[], key: NoteSortKey): ResearchNote[] {
  const copy = [...notes];
  switch (key) {
    case 'created':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'updated':
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case 'source':
    default:
      return copy.sort((a, b) => {
        const ai = a.sourceAnchor.globalIndex ?? Number.MAX_SAFE_INTEGER;
        const bi = b.sourceAnchor.globalIndex ?? Number.MAX_SAFE_INTEGER;
        return ai - bi || a.ordinal - b.ordinal;
      });
  }
}

/** Collect the distinct tags present across a set of notes (preserves first-seen order). */
export function collectTags(notes: ResearchNote[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of notes) {
    for (const t of n.tags) {
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    }
  }
  return out;
}
