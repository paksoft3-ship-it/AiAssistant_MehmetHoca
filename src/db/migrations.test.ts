import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Article, Note } from '../types';
import {
  mapLegacyToDomain,
  runLegacyMigration,
  LEGACY_KEYS,
  MIGRATION_FLAG,
  type LegacyData,
} from './migrations';
import { EidosDatabase, setDb } from './database';

const NOW = '2026-06-21T00:00:00.000Z';

function sampleArticle(): Article {
  return {
    id: 'doc-1',
    title: 'Örnek Makale',
    fileName: 'ornek.pdf',
    fileSize: '1.5 MB',
    fileType: 'pdf',
    text: 'tam metin',
    language: 'tr',
    lastReadIndex: 1,
    pages: [
      { pageNumber: 1, text: 'Birinci sayfa metni.', lines: ['Birinci sayfa metni.'] },
      { pageNumber: 2, text: 'İkinci sayfa metni.', lines: ['İkinci sayfa metni.'] },
    ],
    lines: [
      { text: 'Birinci sayfa metni.', pageNumber: 1, lineNumber: 1, globalIndex: 0 },
      { text: 'İkinci sayfa metni.', pageNumber: 2, lineNumber: 1, globalIndex: 1, isHeading: true },
    ],
  };
}

function sampleNote(): Note {
  return {
    id: 'note-1',
    number: 1,
    timestamp: '10:00:00',
    pageNumber: 2,
    lineNumber: 1,
    contextText: 'İkinci sayfa metni.',
    noteText: 'Bu pasaj önemli.',
    createdAt: '2026-06-20T09:00:00.000Z',
    articleId: 'doc-1',
    articleTitle: 'Örnek Makale',
  };
}

describe('mapLegacyToDomain (pure)', () => {
  it('maps an article into a document, pages, and segments', () => {
    const data: LegacyData = { active: sampleArticle(), archive: [sampleArticle()], notes: [] };
    const result = mapLegacyToDomain(data, NOW);

    // active + archive are the same id → deduped to one document.
    expect(result.documents).toHaveLength(1);
    const doc = result.documents[0];
    expect(doc.id).toBe('doc-1');
    expect(doc.fileType).toBe('pdf');
    expect(doc.fileSizeBytes).toBe(Math.round(1.5 * 1024 * 1024));
    expect(doc.pageCount).toBe(2);
    expect(result.pages).toHaveLength(2);
    expect(result.segments).toHaveLength(2);
    // heading flag → segmentType
    expect(result.segments.find((s) => s.globalIndex === 1)?.segmentType).toBe('heading');
    // lastReadIndex resolved to an anchor
    expect(doc.lastReadAnchor?.globalIndex).toBe(1);
  });

  it('anchors a note to the matching segment by context text and preserves raw transcript', () => {
    const data: LegacyData = { active: sampleArticle(), archive: [], notes: [sampleNote()] };
    const result = mapLegacyToDomain(data, NOW);

    expect(result.notes).toHaveLength(1);
    const note = result.notes[0];
    expect(note.sourceAnchor.selectedText).toBe('İkinci sayfa metni.');
    expect(note.sourceAnchor.segmentId).toBe(
      result.segments.find((s) => s.text === 'İkinci sayfa metni.')?.id,
    );
    expect(note.rawTranscript).toBe('Bu pasaj önemli.');
    expect(note.finalNote).toBe('Bu pasaj önemli.');
    expect(note.origin).toBe('typed');
    expect(note.ordinal).toBe(1);
  });

  it('maps an unsupported legacy .doc type down to txt', () => {
    const art = { ...sampleArticle(), fileType: 'doc' as Article['fileType'] };
    const result = mapLegacyToDomain({ active: art, archive: [], notes: [] }, NOW);
    expect(result.documents[0].fileType).toBe('txt');
  });
});

describe('runLegacyMigration (IndexedDB)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Fresh, uniquely-named DB per test to avoid cross-test state.
    setDb(new EidosDatabase(`eidosus-test-${Math.floor(performance.now())}-${Math.random()}`));
  });

  it('imports legacy data into IndexedDB and is non-destructive', async () => {
    localStorage.setItem(LEGACY_KEYS.active, JSON.stringify(sampleArticle()));
    localStorage.setItem(LEGACY_KEYS.archive, JSON.stringify([sampleArticle()]));
    localStorage.setItem(LEGACY_KEYS.notes, JSON.stringify([sampleNote()]));

    const outcome = await runLegacyMigration({ now: NOW });

    expect(outcome.ran).toBe(true);
    expect(outcome.migratedDocuments).toBe(1);
    expect(outcome.migratedNotes).toBe(1);

    // Flag set, but legacy keys are preserved for recovery.
    expect(localStorage.getItem(MIGRATION_FLAG)).toBe('true');
    expect(localStorage.getItem(LEGACY_KEYS.active)).not.toBeNull();
    expect(localStorage.getItem(LEGACY_KEYS.notes)).not.toBeNull();
  });

  it('skips when already completed', async () => {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    localStorage.setItem(LEGACY_KEYS.active, JSON.stringify(sampleArticle()));

    const outcome = await runLegacyMigration({ now: NOW });
    expect(outcome.ran).toBe(false);
    expect(outcome.reason).toBe('already-done');
  });

  it('marks done without importing when there is no legacy data', async () => {
    const outcome = await runLegacyMigration({ now: NOW });
    expect(outcome.ran).toBe(false);
    expect(outcome.reason).toBe('no-legacy-data');
    expect(localStorage.getItem(MIGRATION_FLAG)).toBe('true');
  });
});
