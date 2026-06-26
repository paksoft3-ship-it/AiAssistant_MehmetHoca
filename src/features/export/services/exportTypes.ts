import type { ResearchNote } from '../../../types/domain';

export type ExportFormat = 'markdown' | 'docx' | 'txt' | 'csv' | 'xlsx';

/** Formats whose output is a flat table (one row per note). */
export const TABULAR_FORMATS: ExportFormat[] = ['csv', 'xlsx'];

export interface ExportOptions {
  format: ExportFormat;
  includeRawTranscript: boolean;
  includeSourceExcerpt: boolean;
  includeTags: boolean;
  /** Order notes by document/source position or by creation time. */
  order: 'source' | 'created';
  /** When set, export only these note IDs; null/undefined = all. */
  selectedNoteIds?: string[] | null;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'markdown',
  includeRawTranscript: false,
  includeSourceExcerpt: true,
  includeTags: true,
  order: 'source',
  selectedNoteIds: null,
};

/** Product-neutral document metadata included in exports. */
export interface ExportDocumentMeta {
  title: string;
  authors?: string[];
  doi?: string;
  publicationYear?: number;
}

/** Fully-resolved data ready to render into any export format. */
export interface ExportModel {
  meta: ExportDocumentMeta;
  exportedAt: string;
  notes: ResearchNote[];
}
