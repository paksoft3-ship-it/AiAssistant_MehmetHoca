import type { Article, ParsedLine, ParsedPage } from '../../../types';
import type {
  AcademicDocument,
  DocumentPage,
  TextSegment,
  DocumentFileType,
} from '../../../types/domain';
import { formatFileSize } from '../../../utils/documentParser';

/** Map a domain segment's type back to the reader's heading/graph flags. */
function lineFlagsFromSegment(segment: TextSegment): Pick<ParsedLine, 'isHeading' | 'isGraph'> {
  return {
    isHeading: segment.segmentType === 'heading',
    isGraph: segment.segmentType === 'figure-caption' || segment.segmentType === 'table-caption',
  };
}

/**
 * Reconstruct the in-memory `Article` shape (used by the reader + TTS engine)
 * from the stored domain document, pages, and segments. Inverse of
 * `documentFromLegacyArticle` (see `db/migrations.ts`).
 */
export function documentToArticle(
  document: AcademicDocument,
  pages: DocumentPage[],
  segments: TextSegment[],
): Article {
  const sortedSegments = [...segments].sort((a, b) => a.globalIndex - b.globalIndex);
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  const lines: ParsedLine[] = sortedSegments.map((s) => ({
    text: s.text,
    pageNumber: s.pageNumber,
    lineNumber: s.blockIndex + 1,
    globalIndex: s.globalIndex,
    ...lineFlagsFromSegment(s),
  }));

  const parsedPages: ParsedPage[] = sortedPages.map((p) => ({
    pageNumber: p.pageNumber,
    text: p.rawText,
    lines: sortedSegments.filter((s) => s.pageNumber === p.pageNumber).map((s) => s.text),
  }));

  const fileType: Article['fileType'] = document.fileType;

  return {
    id: document.id,
    title: document.title,
    fileName: document.fileName,
    fileSize: formatFileSize(document.fileSizeBytes),
    fileType,
    text: parsedPages.map((p) => p.text).join('\n\n'),
    pages: parsedPages,
    lines,
    language: document.language,
    lastReadIndex: document.lastReadAnchor?.globalIndex,
  };
}

export type { DocumentFileType };
