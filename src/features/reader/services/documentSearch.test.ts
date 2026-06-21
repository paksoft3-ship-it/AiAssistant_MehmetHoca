import { describe, it, expect } from 'vitest';
import type { ParsedLine } from '../../../types';
import { searchLines, nextMatchIndex } from './documentSearch';

const LINES: ParsedLine[] = [
  { text: 'Yapay zeka eğitimi dönüştürüyor.', pageNumber: 1, lineNumber: 1, globalIndex: 0 },
  { text: 'Adaptif sistemler öğrenmeyi kişiselleştirir.', pageNumber: 1, lineNumber: 2, globalIndex: 1 },
  { text: 'Yapay zeka etiği önemlidir.', pageNumber: 2, lineNumber: 1, globalIndex: 2 },
];

describe('searchLines', () => {
  it('finds all case-insensitive matches', () => {
    const matches = searchLines(LINES, 'yapay zeka');
    expect(matches.map((m) => m.globalIndex)).toEqual([0, 2]);
  });
  it('returns nothing for an empty query', () => {
    expect(searchLines(LINES, '  ')).toEqual([]);
  });
});

describe('nextMatchIndex', () => {
  const matches = searchLines(LINES, 'yapay zeka');
  it('moves to the next match after the current position', () => {
    expect(nextMatchIndex(matches, 0)).toBe(1); // match at globalIndex 2
  });
  it('wraps around to the first match', () => {
    expect(nextMatchIndex(matches, 2)).toBe(0);
  });
  it('returns -1 when there are no matches', () => {
    expect(nextMatchIndex([], 0)).toBe(-1);
  });
});
