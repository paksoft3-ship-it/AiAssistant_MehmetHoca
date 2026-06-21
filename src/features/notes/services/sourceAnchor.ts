import type { ParsedLine } from '../../../types';
import type { SourceAnchor } from '../../../types/domain';

export interface AnchorInput {
  documentId: string;
  /** The document's readable lines (segments rendered in the reader). */
  lines: ParsedLine[];
  /** Index of the currently spoken/active line. */
  activeIndex: number;
  /** Optional exact text the user selected in the reader. */
  selectedText?: string | null;
}

/**
 * Build a `SourceAnchor` for a note (CLAUDE.md §8.4, §11).
 *
 * Priority:
 *  1. If the user selected exact text, anchor to that selection (and the line
 *     that contains it, when found).
 *  2. Otherwise, anchor to the currently active/spoken line.
 *
 * The anchor always preserves the selected text plus surrounding context so the
 * note stays meaningful even after the document is re-parsed.
 */
export function buildSourceAnchor(input: AnchorInput): SourceAnchor {
  const { documentId, lines, activeIndex } = input;
  const selected = input.selectedText?.trim() || '';

  let anchorIndex = activeIndex;

  if (selected) {
    // Try to locate the line that contains the selected text (so page/index are right).
    const containingIndex = lines.findIndex((l) => l.text.includes(selected));
    if (containingIndex >= 0) {
      anchorIndex = containingIndex;
    }
  }

  const anchorLine: ParsedLine | undefined = lines[anchorIndex];
  const selectedText = selected || anchorLine?.text || '';

  return {
    documentId,
    pageNumber: anchorLine?.pageNumber ?? 1,
    globalIndex: anchorLine?.globalIndex,
    selectedText,
    contextBefore: anchorIndex > 0 ? lines[anchorIndex - 1]?.text : undefined,
    contextAfter: anchorIndex < lines.length - 1 ? lines[anchorIndex + 1]?.text : undefined,
  };
}
