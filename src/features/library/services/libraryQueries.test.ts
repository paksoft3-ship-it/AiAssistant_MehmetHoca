import { describe, it, expect } from 'vitest';
import type { AcademicDocument } from '../../../types/domain';
import type { LibraryEntry } from '../../documents/services/documentService';
import {
  searchLibrary,
  filterByLanguage,
  listLanguages,
  sortLibrary,
  progressRatio,
} from './libraryQueries';

function doc(p: Partial<AcademicDocument> & { id: string; title: string }): AcademicDocument {
  return {
    fileName: `${p.title}.pdf`,
    fileType: 'pdf',
    fileSizeBytes: 1000,
    pageCount: 10,
    language: 'tr',
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
    parseStatus: 'ready',
    source: 'upload',
    ...p,
  };
}

function entry(d: AcademicDocument, noteCount = 0): LibraryEntry {
  return { document: d, noteCount };
}

const entries: LibraryEntry[] = [
  entry(doc({ id: 'a', title: 'Makine Öğrenmesi', language: 'tr', lastOpenedAt: '2026-06-21T10:00:00.000Z', pageCount: 10, lastReadAnchor: { documentId: 'a', pageNumber: 5, globalIndex: 4 } }), 3),
  entry(doc({ id: 'b', title: 'Deep Learning', language: 'en', lastOpenedAt: '2026-06-21T12:00:00.000Z' }), 1),
  entry(doc({ id: 'c', title: 'Algoritmalar', language: 'tr', lastOpenedAt: '2026-06-21T08:00:00.000Z' }), 5),
];

describe('searchLibrary', () => {
  it('matches titles case-insensitively', () => {
    expect(searchLibrary(entries, 'makine').map((e) => e.document.id)).toEqual(['a']);
    expect(searchLibrary(entries, '').length).toBe(3);
  });
});

describe('filterByLanguage / listLanguages', () => {
  it('filters by language', () => {
    expect(filterByLanguage(entries, 'tr').map((e) => e.document.id).sort()).toEqual(['a', 'c']);
    expect(filterByLanguage(entries, '').length).toBe(3);
  });
  it('lists distinct languages', () => {
    expect(listLanguages(entries).sort()).toEqual(['en', 'tr']);
  });
});

describe('sortLibrary', () => {
  it('sorts by most recent', () => {
    expect(sortLibrary(entries, 'recent').map((e) => e.document.id)).toEqual(['b', 'a', 'c']);
  });
  it('sorts by title', () => {
    expect(sortLibrary(entries, 'title').map((e) => e.document.id)).toEqual(['c', 'b', 'a']);
  });
  it('sorts by note count', () => {
    expect(sortLibrary(entries, 'notes').map((e) => e.document.id)).toEqual(['c', 'a', 'b']);
  });
  it('sorts by reading progress', () => {
    expect(sortLibrary(entries, 'progress')[0].document.id).toBe('a');
  });
});

describe('progressRatio', () => {
  it('computes a bounded ratio from the last read anchor', () => {
    expect(progressRatio(entries[0])).toBeCloseTo(0.5);
    expect(progressRatio(entries[1])).toBe(0);
  });
});
