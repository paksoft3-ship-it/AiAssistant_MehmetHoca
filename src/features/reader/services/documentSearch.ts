import type { ParsedLine } from '../../../types';

export interface SearchMatch {
  globalIndex: number;
  pageNumber: number;
  lineNumber: number;
  text: string;
}

/** Case-insensitive (Turkish-aware) search across document lines. */
export function searchLines(lines: ParsedLine[], query: string): SearchMatch[] {
  const q = query.trim().toLocaleLowerCase('tr');
  if (!q) return [];
  const matches: SearchMatch[] = [];
  for (const line of lines) {
    if (line.text.toLocaleLowerCase('tr').includes(q)) {
      matches.push({
        globalIndex: line.globalIndex,
        pageNumber: line.pageNumber,
        lineNumber: line.lineNumber,
        text: line.text,
      });
    }
  }
  return matches;
}

/**
 * Index (into the matches array) of the next match at or after `fromGlobalIndex`,
 * wrapping around. Returns 0 when there is no better candidate.
 */
export function nextMatchIndex(matches: SearchMatch[], fromGlobalIndex: number): number {
  if (matches.length === 0) return -1;
  const idx = matches.findIndex((m) => m.globalIndex > fromGlobalIndex);
  return idx === -1 ? 0 : idx;
}
