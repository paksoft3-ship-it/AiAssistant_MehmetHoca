/**
 * EidosUs domain model (CLAUDE.md §6).
 *
 * This is the target source-aware model that replaces the flat prototype
 * `Article`/`Note` types in `src/types.ts`. The legacy types are kept and bridged
 * through migration adapters (see `src/db/migrations.ts`) so existing data is preserved.
 */

export type DocumentFileType = 'pdf' | 'docx' | 'txt';

export type SegmentType =
  | 'heading'
  | 'paragraph'
  | 'sentence'
  | 'figure-caption'
  | 'table-caption'
  | 'reference'
  | 'unknown';

export type ParseStatus = 'pending' | 'parsing' | 'ready' | 'failed';

export type NoteOrigin = 'voice' | 'typed' | 'discussion';

export type AiCleaningStatus = 'not-requested' | 'pending' | 'completed' | 'failed';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReadingAnchor {
  documentId: string;
  pageNumber: number;
  segmentId?: string;
  globalIndex: number;
  characterOffset?: number;
}

export interface AcademicDocument {
  id: string;
  title: string;
  authors?: string[];
  publicationYear?: number;
  doi?: string;
  fileName: string;
  fileType: DocumentFileType;
  fileSizeBytes: number;
  pageCount: number;
  language: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  lastReadAnchor?: ReadingAnchor;
  parseStatus: ParseStatus;
  parseError?: string;
  originalFileBlobId?: string;
  source: 'upload' | 'sample' | 'url';
  /** Original URL + domain when source === 'url' (Beta spec §11). */
  sourceUrl?: string;
  sourceDomain?: string;
  /** Optional project grouping (Beta spec §23). */
  projectId?: string;
}

export interface DocumentPage {
  id: string;
  documentId: string;
  pageNumber: number;
  rawText: string;
  normalizedText: string;
}

export interface TextSegment {
  id: string;
  documentId: string;
  pageNumber: number;
  blockIndex: number;
  globalIndex: number;
  text: string;
  segmentType: SegmentType;
  boundingBox?: BoundingBox;
}

/**
 * The heart of the product: anchors a note to the *actual text* of a source
 * passage (not just page/line), so notes stay understandable after reparsing.
 */
export interface SourceAnchor {
  documentId: string;
  pageNumber: number;
  segmentId?: string;
  globalIndex?: number;
  selectedText: string;
  contextBefore?: string;
  contextAfter?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface ResearchNote {
  id: string;
  documentId: string;
  ordinal: number;
  sourceAnchor: SourceAnchor;
  origin: NoteOrigin;
  /** The user's words, exactly as dictated/typed. NEVER overwritten by AI. */
  rawTranscript: string;
  /** Optional AI-cleaned version. Separate from raw and final. */
  cleanedAcademicNote?: string;
  /** The user's final, edited note. */
  finalNote: string;
  tags: string[];
  aiCleaningStatus: AiCleaningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AcademicDiscussion {
  id: string;
  documentId: string;
  sourceAnchor: SourceAnchor;
  messages: DiscussionMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportRecord {
  id: string;
  documentId: string;
  format: 'markdown' | 'docx' | 'pdf' | 'txt' | 'csv' | 'xlsx';
  noteIds: string[];
  createdAt: string;
}

/** Stored original file blob (kept separate from metadata for storage efficiency). */
export interface FileBlobRecord {
  id: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
}

/** Research project for grouping documents/notes (Beta spec §23). Optional. */
export interface ResearchProject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/** Activity history event types (Beta spec §22). */
export type HistoryEventType =
  | 'document_uploaded'
  | 'url_imported'
  | 'document_opened'
  | 'note_created'
  | 'note_deleted'
  | 'export_created'
  | 'project_created';

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  documentId?: string;
  projectId?: string;
  noteId?: string;
  /** Small, non-sensitive labels only (e.g. document title, format). */
  metadata?: Record<string, string | number>;
  createdAt: string;
}
