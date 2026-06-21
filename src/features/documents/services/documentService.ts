import type { Article } from '../../../types';
import type { AcademicDocument, ReadingAnchor } from '../../../types/domain';
import { documentRepository, noteRepository } from '../../../db/repositories';
import { documentFromLegacyArticle } from '../../../db/migrations';
import { documentToArticle } from './documentMapper';

export interface LibraryEntry {
  document: AcademicDocument;
  noteCount: number;
}

/**
 * Coordinates document persistence between the in-memory `Article` shape (used
 * by the reader/TTS) and the IndexedDB domain model. The UI uses this service,
 * never Dexie directly.
 */
export const documentService = {
  /** Persist an in-memory Article (fresh upload, sample, or translation re-save). */
  async saveArticle(
    article: Article,
    source: AcademicDocument['source'] = 'upload',
  ): Promise<void> {
    const now = new Date().toISOString();
    const existing = await documentRepository.get(article.id);
    const { document, pages, segments } = documentFromLegacyArticle(article, now);
    document.source = source;
    if (existing) {
      // Preserve original creation time and last-opened metadata on re-save.
      document.createdAt = existing.createdAt;
      document.lastOpenedAt = existing.lastOpenedAt;
      if (existing.lastReadAnchor && !document.lastReadAnchor) {
        document.lastReadAnchor = existing.lastReadAnchor;
      }
    }
    await documentRepository.save(document, pages, segments);
  },

  /** List library documents with their note counts, most-recently-opened first. */
  async listLibrary(): Promise<LibraryEntry[]> {
    const documents = await documentRepository.list();
    const entries = await Promise.all(
      documents.map(async (document) => ({
        document,
        noteCount: (await noteRepository.listByDocument(document.id)).length,
      })),
    );
    return entries;
  },

  /** Load a stored document and reconstruct the Article for the reader. */
  async openArticle(documentId: string): Promise<Article | null> {
    const document = await documentRepository.get(documentId);
    if (!document) return null;
    const [pages, segments] = await Promise.all([
      documentRepository.getPages(documentId),
      documentRepository.getSegments(documentId),
    ]);
    await documentRepository.markOpened(documentId);
    return documentToArticle(document, pages, segments);
  },

  async setReadingPosition(documentId: string, globalIndex: number, pageNumber: number): Promise<void> {
    const anchor: ReadingAnchor = { documentId, pageNumber, globalIndex };
    await documentRepository.setLastRead(documentId, anchor);
  },

  async remove(documentId: string): Promise<void> {
    await documentRepository.remove(documentId);
  },
};
