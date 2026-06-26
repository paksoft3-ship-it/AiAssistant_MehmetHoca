import type { ExportModel, ExportOptions } from './exportTypes';

export interface TableData {
  headers: string[];
  rows: string[][];
}

function formatDate(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16);
}

/**
 * Flattens the export model into a header row + one row per note, honouring the
 * field-selection options. Shared by the CSV and XLSX renderers so both formats
 * stay column-consistent. Pure and deterministic.
 */
export function buildTable(model: ExportModel, options: ExportOptions): TableData {
  const { notes } = model;

  const columns: { header: string; value: (n: (typeof notes)[number], i: number) => string }[] = [];
  columns.push({ header: 'No', value: (_n, i) => String(i + 1) });
  columns.push({ header: 'Sayfa', value: (n) => String(n.sourceAnchor.pageNumber) });
  if (options.includeSourceExcerpt) {
    columns.push({ header: 'Kaynak Pasaj', value: (n) => n.sourceAnchor.selectedText ?? '' });
  }
  if (options.includeRawTranscript) {
    columns.push({ header: 'Ham Döküm', value: (n) => n.rawTranscript ?? '' });
  }
  columns.push({ header: 'Düzenlenmiş Not', value: (n) => n.cleanedAcademicNote ?? '' });
  columns.push({ header: 'Nihai Not', value: (n) => n.finalNote ?? '' });
  if (options.includeTags) {
    columns.push({ header: 'Etiketler', value: (n) => n.tags.join(', ') });
  }
  columns.push({ header: 'Köken', value: (n) => n.origin });
  columns.push({ header: 'Oluşturulma', value: (n) => formatDate(n.createdAt) });

  return {
    headers: columns.map((c) => c.header),
    rows: notes.map((note, i) => columns.map((c) => c.value(note, i))),
  };
}
