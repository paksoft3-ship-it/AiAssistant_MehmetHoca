import type { ExportModel, ExportOptions } from './exportTypes';
import { buildTable } from './tabularExport';

/** Escape one CSV field per RFC 4180: quote when it contains , " CR or LF. */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Render the export model to CSV text (RFC 4180, CRLF line endings). A UTF-8
 * BOM is added by the download layer so Excel renders Turkish characters
 * correctly — keep this function BOM-free so it stays easy to test.
 */
export function renderCsv(model: ExportModel, options: ExportOptions): string {
  const { headers, rows } = buildTable(model, options);
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvField).join(','));
  return lines.join('\r\n');
}
