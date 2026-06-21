import type { ResearchNote } from '../../../types/domain';
import { sortNotes } from '../../notes/services/noteQueries';
import type { ExportDocumentMeta, ExportModel, ExportOptions } from './exportTypes';

/**
 * Resolve the notes to export: apply the selected-notes filter and ordering.
 * Pure and deterministic (`now` is injected).
 */
export function buildExportModel(
  meta: ExportDocumentMeta,
  notes: ResearchNote[],
  options: ExportOptions,
  now: string,
): ExportModel {
  const selected = options.selectedNoteIds;
  const filtered =
    selected && selected.length > 0
      ? notes.filter((n) => selected.includes(n.id))
      : notes;

  const ordered = sortNotes(filtered, options.order === 'created' ? 'created' : 'source');

  return {
    meta,
    exportedAt: now,
    notes: ordered,
  };
}
