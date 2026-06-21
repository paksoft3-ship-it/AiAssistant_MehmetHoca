import { describe, it, expect } from 'vitest';
import type { ParsedLine } from '../../../types';
import type { ResearchNote } from '../../../types/domain';
import { buildSourceAnchor } from './sourceAnchor';
import { createResearchNote, normalizeTags, parseTagInput } from './noteFactory';
import { searchNotes, sortNotes, filterByTag, collectTags } from './noteQueries';

const LINES: ParsedLine[] = [
  { text: 'Birinci cümle buradadır.', pageNumber: 1, lineNumber: 1, globalIndex: 0 },
  { text: 'İkinci cümle önemli bir iddia içerir.', pageNumber: 1, lineNumber: 2, globalIndex: 1 },
  { text: 'Üçüncü cümle sonucu özetler.', pageNumber: 2, lineNumber: 1, globalIndex: 2 },
];

describe('buildSourceAnchor', () => {
  it('anchors to the active line when there is no selection', () => {
    const anchor = buildSourceAnchor({ documentId: 'd1', lines: LINES, activeIndex: 1 });
    expect(anchor.selectedText).toBe('İkinci cümle önemli bir iddia içerir.');
    expect(anchor.pageNumber).toBe(1);
    expect(anchor.globalIndex).toBe(1);
    expect(anchor.contextBefore).toBe('Birinci cümle buradadır.');
    expect(anchor.contextAfter).toBe('Üçüncü cümle sonucu özetler.');
  });

  it('anchors to the selected text and the line that contains it', () => {
    const anchor = buildSourceAnchor({
      documentId: 'd1',
      lines: LINES,
      activeIndex: 0,
      selectedText: 'önemli bir iddia',
    });
    expect(anchor.selectedText).toBe('önemli bir iddia');
    // resolved to line index 1 (page 1, globalIndex 1), not the active index 0
    expect(anchor.globalIndex).toBe(1);
    expect(anchor.pageNumber).toBe(1);
  });

  it('falls back gracefully when there are no lines', () => {
    const anchor = buildSourceAnchor({ documentId: 'd1', lines: [], activeIndex: 0 });
    expect(anchor.selectedText).toBe('');
    expect(anchor.pageNumber).toBe(1);
  });
});

describe('noteFactory', () => {
  it('creates a note preserving raw transcript and defaulting final note to it', () => {
    const anchor = buildSourceAnchor({ documentId: 'd1', lines: LINES, activeIndex: 1 });
    const note = createResearchNote({
      documentId: 'd1',
      ordinal: 1,
      sourceAnchor: anchor,
      origin: 'voice',
      rawTranscript: '  ham fikir  ',
      now: '2026-06-21T00:00:00.000Z',
    });
    expect(note.rawTranscript).toBe('ham fikir');
    expect(note.finalNote).toBe('ham fikir');
    expect(note.aiCleaningStatus).toBe('not-requested');
    expect(note.cleanedAcademicNote).toBeUndefined();
    expect(note.createdAt).toBe(note.updatedAt);
  });

  it('keeps a distinct final note when provided', () => {
    const anchor = buildSourceAnchor({ documentId: 'd1', lines: LINES, activeIndex: 0 });
    const note = createResearchNote({
      documentId: 'd1',
      ordinal: 2,
      sourceAnchor: anchor,
      origin: 'typed',
      rawTranscript: 'ham',
      finalNote: 'düzenlenmiş sonuç',
    });
    expect(note.rawTranscript).toBe('ham');
    expect(note.finalNote).toBe('düzenlenmiş sonuç');
  });

  it('normalizes and parses tags', () => {
    expect(normalizeTags([' yöntem ', 'Yöntem', '', 'hipotez'])).toEqual(['yöntem', 'hipotez']);
    expect(parseTagInput('metodoloji, , bulgu , metodoloji')).toEqual(['metodoloji', 'bulgu']);
  });
});

function noteFixture(partial: Partial<ResearchNote> & { id: string }): ResearchNote {
  return {
    documentId: 'd1',
    ordinal: 1,
    sourceAnchor: { documentId: 'd1', pageNumber: 1, globalIndex: 0, selectedText: '' },
    origin: 'typed',
    rawTranscript: '',
    finalNote: '',
    tags: [],
    aiCleaningStatus: 'not-requested',
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
    ...partial,
  };
}

describe('noteQueries', () => {
  const notes: ResearchNote[] = [
    noteFixture({
      id: 'a',
      ordinal: 2,
      sourceAnchor: { documentId: 'd1', pageNumber: 2, globalIndex: 5, selectedText: 'sonuç' },
      finalNote: 'Bu sonucu destekliyor.',
      tags: ['bulgu'],
      createdAt: '2026-06-21T10:00:00.000Z',
    }),
    noteFixture({
      id: 'b',
      ordinal: 1,
      sourceAnchor: { documentId: 'd1', pageNumber: 1, globalIndex: 1, selectedText: 'hipotez' },
      finalNote: 'Hipotez tartışmalı.',
      tags: ['yöntem', 'hipotez'],
      createdAt: '2026-06-21T09:00:00.000Z',
    }),
  ];

  it('searches across note text, excerpt, and tags', () => {
    expect(searchNotes(notes, 'hipotez').map((n) => n.id).sort()).toEqual(['b']);
    expect(searchNotes(notes, 'sonuc'.normalize()).map((n) => n.id)).toContain('a');
    expect(searchNotes(notes, '').length).toBe(2);
  });

  it('filters by tag', () => {
    expect(filterByTag(notes, 'yöntem').map((n) => n.id)).toEqual(['b']);
    expect(filterByTag(notes, '').length).toBe(2);
  });

  it('sorts by source position by default', () => {
    expect(sortNotes(notes, 'source').map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('sorts by creation time newest first', () => {
    expect(sortNotes(notes, 'created').map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('collects distinct tags', () => {
    expect(collectTags(notes).sort()).toEqual(['bulgu', 'hipotez', 'yöntem']);
  });
});
