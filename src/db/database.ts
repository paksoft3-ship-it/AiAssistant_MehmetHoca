import Dexie, { type Table } from 'dexie';
import type {
  AcademicDocument,
  DocumentPage,
  TextSegment,
  ResearchNote,
  AcademicDiscussion,
  ExportRecord,
  FileBlobRecord,
} from '../types/domain';

/**
 * Local-first IndexedDB database (CLAUDE.md §5.3).
 *
 * The UI never touches these tables directly — it goes through repositories
 * (`src/db/repositories/*`) so a future cloud repository can be swapped in
 * without changing components.
 */
export class EidosDatabase extends Dexie {
  documents!: Table<AcademicDocument, string>;
  pages!: Table<DocumentPage, string>;
  segments!: Table<TextSegment, string>;
  notes!: Table<ResearchNote, string>;
  discussions!: Table<AcademicDiscussion, string>;
  exports!: Table<ExportRecord, string>;
  fileBlobs!: Table<FileBlobRecord, string>;

  constructor(name = 'eidosus') {
    super(name);
    this.version(1).stores({
      // Primary key first, then secondary indexes used for lookups/filtering.
      documents: 'id, source, parseStatus, lastOpenedAt, updatedAt',
      pages: 'id, documentId, [documentId+pageNumber]',
      segments: 'id, documentId, [documentId+globalIndex]',
      notes: 'id, documentId, [documentId+ordinal], updatedAt',
      discussions: 'id, documentId, updatedAt',
      exports: 'id, documentId, createdAt',
      fileBlobs: 'id, documentId',
    });
  }
}

let _db: EidosDatabase | null = null;

/** Lazily-created singleton database instance. */
export function getDb(): EidosDatabase {
  if (!_db) {
    _db = new EidosDatabase();
  }
  return _db;
}

/** Test/utility hook to inject a database instance (e.g. fake-indexeddb). */
export function setDb(db: EidosDatabase): void {
  _db = db;
}
