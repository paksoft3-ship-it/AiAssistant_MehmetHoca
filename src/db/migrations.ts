import type { Article, Note, ParsedLine } from '../types';
import type {
  AcademicDocument,
  DocumentPage,
  TextSegment,
  ResearchNote,
  DocumentFileType,
  SegmentType,
  SourceAnchor,
  ReadingAnchor,
} from '../types/domain';
import { newId } from '../lib/ids';
import type { EidosDatabase } from './database';
import { getDb } from './database';

/** Legacy localStorage keys from the prototype (CLAUDE.md §5.3). */
export const LEGACY_KEYS = {
  active: 'sesli_makale_aktif',
  notes: 'sesli_makale_notlar',
  archive: 'sesli_makale_arsiv',
} as const;

/** Flag marking the one-time migration complete. Stored in localStorage. */
export const MIGRATION_FLAG = 'eidosus_migration_v1_done';

export interface LegacyData {
  active: Article | null;
  archive: Article[];
  notes: Note[];
}

export interface MigrationResult {
  documents: AcademicDocument[];
  pages: DocumentPage[];
  segments: TextSegment[];
  notes: ResearchNote[];
}

function mapFileType(fileType: string | undefined): DocumentFileType {
  // `.doc` is unsupported going forward; legacy parsed text is treated as txt.
  if (fileType === 'pdf' || fileType === 'docx' || fileType === 'txt') return fileType;
  return 'txt';
}

function segmentTypeForLine(line: Pick<ParsedLine, 'isHeading' | 'isGraph'>): SegmentType {
  if (line.isGraph) return 'figure-caption';
  if (line.isHeading) return 'heading';
  return 'sentence';
}

function parseFileSizeToBytes(fileSize: string | undefined): number {
  // Legacy stored a formatted string like "1.2 MB". Best-effort reverse.
  if (!fileSize) return 0;
  const match = /([\d.]+)\s*(bytes|kb|mb|gb)?/i.exec(fileSize.trim());
  if (!match) return 0;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return 0;
  const unit = (match[2] || 'bytes').toLowerCase();
  const multipliers: Record<string, number> = {
    bytes: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
  };
  return Math.round(value * (multipliers[unit] ?? 1));
}

/**
 * Convert one legacy `Article` into the domain document + its pages + segments.
 * Pure; no IndexedDB. Stable segment IDs are generated and used to anchor notes.
 */
export function documentFromLegacyArticle(
  article: Article,
  now: string,
): { document: AcademicDocument; pages: DocumentPage[]; segments: TextSegment[] } {
  const documentId = article.id || newId();

  const pages: DocumentPage[] = (article.pages || []).map((p) => ({
    id: newId(),
    documentId,
    pageNumber: p.pageNumber,
    rawText: p.text ?? '',
    normalizedText: p.text ?? '',
  }));

  // Track per-page running block index for blockIndex assignment.
  const perPageCounter = new Map<number, number>();
  const segments: TextSegment[] = (article.lines || []).map((line) => {
    const blockIndex = perPageCounter.get(line.pageNumber) ?? 0;
    perPageCounter.set(line.pageNumber, blockIndex + 1);
    return {
      id: newId(),
      documentId,
      pageNumber: line.pageNumber,
      blockIndex,
      globalIndex: line.globalIndex,
      text: line.text,
      segmentType: segmentTypeForLine(line),
    };
  });

  // Resolve last reading position into an anchor.
  let lastReadAnchor: ReadingAnchor | undefined;
  if (typeof article.lastReadIndex === 'number') {
    const seg = segments.find((s) => s.globalIndex === article.lastReadIndex);
    if (seg) {
      lastReadAnchor = {
        documentId,
        pageNumber: seg.pageNumber,
        segmentId: seg.id,
        globalIndex: seg.globalIndex,
      };
    }
  }

  const document: AcademicDocument = {
    id: documentId,
    title: article.title || article.fileName || 'Adsız Belge',
    fileName: article.fileName || `${article.title || 'belge'}.txt`,
    fileType: mapFileType(article.fileType),
    fileSizeBytes: parseFileSizeToBytes(article.fileSize),
    pageCount: pages.length || 1,
    language: article.language || 'tr',
    createdAt: now,
    updatedAt: now,
    parseStatus: 'ready',
    source: 'upload',
    lastReadAnchor,
  };

  return { document, pages, segments };
}

/**
 * Convert one legacy `Note` into a `ResearchNote`, anchoring it to a segment by
 * matching the preserved context text (falling back to page/line position).
 */
export function researchNoteFromLegacy(
  note: Note,
  segments: TextSegment[],
  now: string,
): ResearchNote {
  // Best-effort anchor resolution: exact text match on the same page, then any
  // text match, then page/line ordinal.
  const samePage = segments.filter((s) => s.pageNumber === note.pageNumber);
  let anchorSeg =
    samePage.find((s) => s.text.trim() === (note.contextText || '').trim()) ||
    segments.find((s) => s.text.trim() === (note.contextText || '').trim()) ||
    samePage[note.lineNumber - 1];

  const sourceAnchor: SourceAnchor = {
    documentId: note.articleId,
    pageNumber: note.pageNumber,
    segmentId: anchorSeg?.id,
    globalIndex: anchorSeg?.globalIndex,
    selectedText: note.contextText || '',
  };

  const createdAt = note.createdAt || now;
  return {
    id: note.id || newId(),
    documentId: note.articleId,
    ordinal: note.number ?? 0,
    sourceAnchor,
    origin: 'typed',
    rawTranscript: note.noteText || '',
    finalNote: note.noteText || '',
    cleanedAcademicNote: undefined,
    tags: [],
    aiCleaningStatus: 'not-requested',
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * Pure mapping of all legacy data into the domain model. No side effects.
 * `now` is injected so the result is deterministic and testable.
 */
export function mapLegacyToDomain(data: LegacyData, now: string): MigrationResult {
  // Dedupe articles by id (the active article is usually also in the archive).
  const byId = new Map<string, Article>();
  for (const a of data.archive || []) {
    if (a && a.id) byId.set(a.id, a);
  }
  if (data.active && data.active.id && !byId.has(data.active.id)) {
    byId.set(data.active.id, data.active);
  }

  const documents: AcademicDocument[] = [];
  const pages: DocumentPage[] = [];
  const segmentsByDoc = new Map<string, TextSegment[]>();

  for (const article of byId.values()) {
    const { document, pages: docPages, segments } = documentFromLegacyArticle(article, now);
    documents.push(document);
    pages.push(...docPages);
    segmentsByDoc.set(document.id, segments);
  }

  const allSegments: TextSegment[] = [];
  for (const segs of segmentsByDoc.values()) allSegments.push(...segs);

  const notes: ResearchNote[] = (data.notes || [])
    .filter((n) => n && n.articleId)
    .map((n) => researchNoteFromLegacy(n, segmentsByDoc.get(n.articleId) || [], now));

  return { documents, pages, segments: allSegments, notes };
}

/** Safe JSON parse from a storage value. */
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Read the legacy data out of a Storage-like object (defaults to localStorage). */
export function readLegacyData(storage: Storage): LegacyData {
  return {
    active: safeParse<Article | null>(storage.getItem(LEGACY_KEYS.active), null),
    archive: safeParse<Article[]>(storage.getItem(LEGACY_KEYS.archive), []),
    notes: safeParse<Note[]>(storage.getItem(LEGACY_KEYS.notes), []),
  };
}

export interface RunMigrationOutcome {
  ran: boolean;
  migratedDocuments: number;
  migratedNotes: number;
  reason?: string;
}

/**
 * One-time, non-destructive migration of legacy localStorage data into IndexedDB.
 *
 * - Skips if already completed (flag present) — unless `force` is set.
 * - Validates and imports documents, pages, segments, and notes.
 * - Leaves the legacy localStorage keys intact (recovery is possible).
 * - Only sets the completion flag after a successful write.
 */
export async function runLegacyMigration(options?: {
  db?: EidosDatabase;
  storage?: Storage;
  now?: string;
  force?: boolean;
}): Promise<RunMigrationOutcome> {
  const db = options?.db ?? getDb();
  const storage =
    options?.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
  const now = options?.now ?? new Date().toISOString();

  if (!storage) {
    return { ran: false, migratedDocuments: 0, migratedNotes: 0, reason: 'no-storage' };
  }

  if (!options?.force && storage.getItem(MIGRATION_FLAG) === 'true') {
    return { ran: false, migratedDocuments: 0, migratedNotes: 0, reason: 'already-done' };
  }

  const legacy = readLegacyData(storage);
  const hasLegacy =
    !!legacy.active || (legacy.archive?.length ?? 0) > 0 || (legacy.notes?.length ?? 0) > 0;

  if (!hasLegacy) {
    // Nothing to import; mark done so we don't re-check every load.
    storage.setItem(MIGRATION_FLAG, 'true');
    return { ran: false, migratedDocuments: 0, migratedNotes: 0, reason: 'no-legacy-data' };
  }

  const mapped = mapLegacyToDomain(legacy, now);

  await db.transaction('rw', db.documents, db.pages, db.segments, db.notes, async () => {
    // bulkPut is idempotent on id, so re-running (force) won't duplicate.
    if (mapped.documents.length) await db.documents.bulkPut(mapped.documents);
    if (mapped.pages.length) await db.pages.bulkPut(mapped.pages);
    if (mapped.segments.length) await db.segments.bulkPut(mapped.segments);
    if (mapped.notes.length) await db.notes.bulkPut(mapped.notes);
  });

  storage.setItem(MIGRATION_FLAG, 'true');
  return {
    ran: true,
    migratedDocuments: mapped.documents.length,
    migratedNotes: mapped.notes.length,
  };
}
