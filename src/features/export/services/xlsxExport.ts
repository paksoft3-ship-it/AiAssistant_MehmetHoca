import JSZip from 'jszip';
import type { ExportModel, ExportOptions } from './exportTypes';
import { buildTable, type TableData } from './tabularExport';

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 0-based column index → spreadsheet column letters (A, B, …, Z, AA, …). */
function colLetter(index: number): string {
  let s = '';
  let n = index;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function cellXml(ref: string, value: string): string {
  // Plain non-negative integers become real numeric cells; everything else is
  // an inline string (so Turkish text and multi-line notes are preserved).
  if (value !== '' && /^\d+$/.test(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetXml(table: TableData): string {
  const allRows = [table.headers, ...table.rows];
  const rowsXml = allRows
    .map((row, r) => {
      const cells = row.map((val, c) => cellXml(`${colLetter(c)}${r + 1}`, val)).join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Notlar" sheetId="1" r:id="rId1"/></sheets></workbook>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;

/**
 * Build a minimal but valid .xlsx workbook (one "Notlar" sheet) as raw bytes.
 * Hand-assembled OOXML + JSZip avoids a heavyweight spreadsheet dependency.
 * Returning bytes (not a Blob) keeps this unit-testable outside a browser.
 */
export async function renderXlsxBytes(model: ExportModel, options: ExportOptions): Promise<Uint8Array> {
  const table = buildTable(model, options);
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.file('_rels/.rels', ROOT_RELS);
  zip.file('xl/workbook.xml', WORKBOOK);
  zip.file('xl/_rels/workbook.xml.rels', WORKBOOK_RELS);
  zip.file('xl/worksheets/sheet1.xml', sheetXml(table));
  return zip.generateAsync({ type: 'uint8array' });
}

/** Browser-facing wrapper: package the workbook bytes into a downloadable Blob. */
export async function renderXlsxBlob(model: ExportModel, options: ExportOptions): Promise<Blob> {
  const bytes = await renderXlsxBytes(model, options);
  return new Blob([bytes], { type: XLSX_MIME });
}
