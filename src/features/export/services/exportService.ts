import type { ResearchNote, ExportRecord } from '../../../types/domain';
import { exportRepository } from '../../../db/repositories';
import { newId } from '../../../lib/ids';
import type { ExportDocumentMeta, ExportOptions } from './exportTypes';
import { buildExportModel } from './exportModel';
import { renderMarkdown } from './markdownExport';
import { renderTxt } from './txtExport';
import { renderCsv } from './csvExport';
import { buildExportFilename } from './filename';

const MIME: Record<ExportOptions['format'], string> = {
  markdown: 'text/markdown;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  csv: 'text/csv;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// Excel needs a UTF-8 BOM to render Turkish characters in CSV correctly.
const UTF8_BOM = '﻿';

/** Trigger a browser download for a Blob. */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export interface ExportResult {
  filename: string;
  noteCount: number;
}

/**
 * Generate the chosen export format for a document's notes, download it, and
 * record an `ExportRecord`. Pure content generation lives in the per-format
 * renderers; this orchestrator owns the browser I/O and persistence.
 */
export async function exportNotes(
  documentId: string,
  meta: ExportDocumentMeta,
  notes: ResearchNote[],
  options: ExportOptions,
): Promise<ExportResult> {
  const now = new Date().toISOString();
  const model = buildExportModel(meta, notes, options, now);
  const filename = buildExportFilename(meta.title, options.format);

  let blob: Blob;
  if (options.format === 'markdown') {
    blob = new Blob([renderMarkdown(model, options)], { type: MIME.markdown });
  } else if (options.format === 'txt') {
    blob = new Blob([renderTxt(model, options)], { type: MIME.txt });
  } else if (options.format === 'csv') {
    blob = new Blob([UTF8_BOM + renderCsv(model, options)], { type: MIME.csv });
  } else if (options.format === 'xlsx') {
    // Lazy-load JSZip + the OOXML writer only when XLSX is requested.
    const { renderXlsxBlob } = await import('./xlsxExport');
    blob = await renderXlsxBlob(model, options);
  } else {
    // Lazy-load the heavy `docx` dependency only when a DOCX export is requested.
    const { buildDocxDocument, docxToBlob } = await import('./docxExport');
    blob = await docxToBlob(buildDocxDocument(model, options));
  }

  downloadBlob(blob, filename);

  const record: ExportRecord = {
    id: newId(),
    documentId,
    format: options.format === 'markdown' ? 'markdown' : options.format,
    noteIds: model.notes.map((n) => n.id),
    createdAt: now,
  };
  try {
    await exportRepository.create(record);
  } catch (err) {
    // Recording history must never block the actual export.
    console.warn('[EidosUs] Failed to record export history:', err);
  }

  return { filename, noteCount: model.notes.length };
}
