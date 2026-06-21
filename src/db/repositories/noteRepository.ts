import type { ResearchNote } from '../../types/domain';
import { getDb } from '../database';

/**
 * Repository for research notes. Ordinals are kept stable: deleting a note does
 * NOT renumber the others' stable IDs (CLAUDE.md §11.3) — `ordinal` is a display
 * number that can be recomputed for presentation without touching `id`.
 */
export const noteRepository = {
  async listByDocument(documentId: string): Promise<ResearchNote[]> {
    const notes = await getDb().notes.where('documentId').equals(documentId).toArray();
    // Default order: by source position (ordinal), then creation time.
    return notes.sort(
      (a, b) => a.ordinal - b.ordinal || a.createdAt.localeCompare(b.createdAt),
    );
  },

  async get(id: string): Promise<ResearchNote | undefined> {
    return getDb().notes.get(id);
  },

  /** Next ordinal for a document = current count + 1 (1-based, per document). */
  async nextOrdinal(documentId: string): Promise<number> {
    const count = await getDb().notes.where('documentId').equals(documentId).count();
    return count + 1;
  },

  async create(note: ResearchNote): Promise<void> {
    await getDb().notes.put(note);
  },

  async update(
    id: string,
    patch: Partial<Omit<ResearchNote, 'id' | 'documentId' | 'createdAt' | 'rawTranscript'>>,
  ): Promise<void> {
    // rawTranscript is intentionally excluded — it is never overwritten.
    await getDb().notes.update(id, { ...patch, updatedAt: new Date().toISOString() });
  },

  async remove(id: string): Promise<void> {
    await getDb().notes.delete(id);
  },
};
