import { describe, it, expect } from 'vitest';
import type { Article } from '../../../types';
import { documentFromLegacyArticle } from '../../../db/migrations';
import { documentToArticle } from './documentMapper';

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

describe('documentToArticle (roundtrip with documentFromLegacyArticle)', () => {
  it('reconstructs the reader Article from stored domain data', () => {
    const original = sampleArticle();
    const { document, pages, segments } = documentFromLegacyArticle(original, NOW);
    const rebuilt = documentToArticle(document, pages, segments);

    expect(rebuilt.id).toBe('doc-1');
    expect(rebuilt.title).toBe('Örnek Makale');
    expect(rebuilt.fileType).toBe('pdf');
    expect(rebuilt.language).toBe('tr');
    // Lines preserved in order with text + page numbers.
    expect(rebuilt.lines.map((l) => l.text)).toEqual([
      'Birinci sayfa metni.',
      'İkinci sayfa metni.',
    ]);
    expect(rebuilt.lines.map((l) => l.pageNumber)).toEqual([1, 2]);
    // Heading flag survives the round trip.
    expect(rebuilt.lines[1].isHeading).toBe(true);
    // Reading position restored.
    expect(rebuilt.lastReadIndex).toBe(1);
    // Pages reconstructed.
    expect(rebuilt.pages).toHaveLength(2);
    expect(rebuilt.pages[0].text).toBe('Birinci sayfa metni.');
  });
});
