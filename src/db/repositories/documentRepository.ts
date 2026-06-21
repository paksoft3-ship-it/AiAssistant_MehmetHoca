import type {
  AcademicDocument,
  DocumentPage,
  TextSegment,
  ReadingAnchor,
} from '../../types/domain';
import { getDb } from '../database';

/**
 * Repository for documents and their parsed content. The UI depends on this
 * interface, not on Dexie, so a cloud-backed implementation can replace it.
 */
export const documentRepository = {
  async list(): Promise<AcademicDocument[]> {
    const docs = await getDb().documents.toArray();
    // Most-recently-opened first (fall back to updatedAt).
    return docs.sort((a, b) =>
      (b.lastOpenedAt ?? b.updatedAt).localeCompare(a.lastOpenedAt ?? a.updatedAt),
    );
  },

  async get(id: string): Promise<AcademicDocument | undefined> {
    return getDb().documents.get(id);
  },

  async getPages(documentId: string): Promise<DocumentPage[]> {
    const pages = await getDb().pages.where('documentId').equals(documentId).toArray();
    return pages.sort((a, b) => a.pageNumber - b.pageNumber);
  },

  async getSegments(documentId: string): Promise<TextSegment[]> {
    const segments = await getDb().segments.where('documentId').equals(documentId).toArray();
    return segments.sort((a, b) => a.globalIndex - b.globalIndex);
  },

  /** Persist a freshly-parsed document together with its pages and segments. */
  async save(
    document: AcademicDocument,
    pages: DocumentPage[],
    segments: TextSegment[],
  ): Promise<void> {
    const db = getDb();
    await db.transaction('rw', db.documents, db.pages, db.segments, async () => {
      await db.documents.put(document);
      if (pages.length) await db.pages.bulkPut(pages);
      if (segments.length) await db.segments.bulkPut(segments);
    });
  },

  async updateMetadata(
    id: string,
    patch: Partial<Pick<AcademicDocument, 'title' | 'authors' | 'publicationYear' | 'doi'>>,
  ): Promise<void> {
    await getDb().documents.update(id, { ...patch, updatedAt: new Date().toISOString() });
  },

  async setLastRead(id: string, anchor: ReadingAnchor): Promise<void> {
    const now = new Date().toISOString();
    await getDb().documents.update(id, { lastReadAnchor: anchor, lastOpenedAt: now });
  },

  async markOpened(id: string): Promise<void> {
    await getDb().documents.update(id, { lastOpenedAt: new Date().toISOString() });
  },

  /** Delete a document and ALL of its associated data (pages, segments, notes, etc.). */
  async remove(id: string): Promise<void> {
    const db = getDb();
    await db.transaction(
      'rw',
      [db.documents, db.pages, db.segments, db.notes, db.discussions, db.exports, db.fileBlobs],
      async () => {
        await db.documents.delete(id);
        await db.pages.where('documentId').equals(id).delete();
        await db.segments.where('documentId').equals(id).delete();
        await db.notes.where('documentId').equals(id).delete();
        await db.discussions.where('documentId').equals(id).delete();
        await db.exports.where('documentId').equals(id).delete();
        await db.fileBlobs.where('documentId').equals(id).delete();
      },
    );
  },
};
