import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Article } from '../../../types';
import { EidosDatabase, setDb } from '../../../db/database';
import { noteRepository } from '../../../db/repositories';
import { createResearchNote } from '../../notes/services/noteFactory';
import { buildSourceAnchor } from '../../notes/services/sourceAnchor';
import { documentService } from './documentService';

function sampleArticle(): Article {
  return {
    id: 'doc-int-1',
    title: 'Entegrasyon Makalesi',
    fileName: 'entegrasyon.pdf',
    fileSize: '900 KB',
    fileType: 'pdf',
    text: 'metin',
    language: 'tr',
    pages: [{ pageNumber: 1, text: 'Tek sayfa metni.', lines: ['Tek sayfa metni.'] }],
    lines: [{ text: 'Tek sayfa metni.', pageNumber: 1, lineNumber: 1, globalIndex: 0 }],
  };
}

describe('documentService + notes integration', () => {
  beforeEach(() => {
    setDb(new EidosDatabase(`eidosus-svc-${Math.floor(performance.now())}-${Math.random()}`));
  });

  it('saves, lists, opens, attaches a note, and deletes with cascade', async () => {
    const article = sampleArticle();
    await documentService.saveArticle(article, 'upload');

    // Library lists the saved document with zero notes.
    let library = await documentService.listLibrary();
    expect(library).toHaveLength(1);
    expect(library[0].document.title).toBe('Entegrasyon Makalesi');
    expect(library[0].noteCount).toBe(0);

    // Reopen reconstructs the reader Article.
    const reopened = await documentService.openArticle(article.id);
    expect(reopened?.lines[0].text).toBe('Tek sayfa metni.');

    // Attach a source-linked note.
    const anchor = buildSourceAnchor({
      documentId: article.id,
      lines: reopened!.lines,
      activeIndex: 0,
    });
    const ordinal = await noteRepository.nextOrdinal(article.id);
    await noteRepository.create(
      createResearchNote({
        documentId: article.id,
        ordinal,
        sourceAnchor: anchor,
        origin: 'typed',
        rawTranscript: 'ilk fikir',
      }),
    );

    library = await documentService.listLibrary();
    expect(library[0].noteCount).toBe(1);

    // Deleting the document cascades to its notes.
    await documentService.remove(article.id);
    expect(await documentService.listLibrary()).toHaveLength(0);
    expect(await noteRepository.listByDocument(article.id)).toHaveLength(0);
  });

  it('reading position round-trips through the document row', async () => {
    const article = sampleArticle();
    await documentService.saveArticle(article, 'upload');
    await documentService.setReadingPosition(article.id, 0, 1);
    const reopened = await documentService.openArticle(article.id);
    expect(reopened?.lastReadIndex).toBe(0);
  });
});
