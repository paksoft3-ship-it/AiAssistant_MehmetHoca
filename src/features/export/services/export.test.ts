import { describe, it, expect } from 'vitest';
import { Packer } from 'docx';
import type { ResearchNote } from '../../../types/domain';
import { sanitizeFilename, buildExportFilename } from './filename';
import { buildExportModel } from './exportModel';
import { renderMarkdown } from './markdownExport';
import { renderTxt } from './txtExport';
import { buildDocxDocument } from './docxExport';
import { buildTable } from './tabularExport';
import { renderCsv } from './csvExport';
import { renderXlsxBytes } from './xlsxExport';
import { DEFAULT_EXPORT_OPTIONS, type ExportOptions } from './exportTypes';

const NOW = '2026-06-21T08:30:00.000Z';

function note(partial: Partial<ResearchNote> & { id: string }): ResearchNote {
  return {
    documentId: 'd1',
    ordinal: 1,
    sourceAnchor: { documentId: 'd1', pageNumber: 1, globalIndex: 0, selectedText: 'kaynak pasaj' },
    origin: 'typed',
    rawTranscript: 'ham metin',
    finalNote: 'nihai not',
    tags: ['yöntem'],
    aiCleaningStatus: 'not-requested',
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

const META = { title: 'Örnek Makale' };
const opts = (o: Partial<ExportOptions> = {}): ExportOptions => ({ ...DEFAULT_EXPORT_OPTIONS, ...o });

describe('sanitizeFilename', () => {
  it('strips illegal characters and collapses whitespace', () => {
    expect(sanitizeFilename('My/Paper: Title*?')).toBe('My_Paper_Title');
    expect(sanitizeFilename('  ')).toBe('arastirma_notlari');
  });
  it('builds an extension-correct filename', () => {
    expect(buildExportFilename('Örnek Makale', 'markdown')).toBe('Örnek_Makale_arastirma_notlari.md');
    expect(buildExportFilename('A', 'docx')).toBe('A_arastirma_notlari.docx');
  });
});

describe('buildExportModel', () => {
  const notes = [
    note({ id: 'a', ordinal: 2, sourceAnchor: { documentId: 'd1', pageNumber: 2, globalIndex: 5, selectedText: 'x' }, createdAt: '2026-06-21T10:00:00.000Z' }),
    note({ id: 'b', ordinal: 1, sourceAnchor: { documentId: 'd1', pageNumber: 1, globalIndex: 1, selectedText: 'y' }, createdAt: '2026-06-21T09:00:00.000Z' }),
  ];

  it('orders by source position by default', () => {
    const model = buildExportModel(META, notes, opts({ order: 'source' }), NOW);
    expect(model.notes.map((n) => n.id)).toEqual(['b', 'a']);
  });
  it('orders by creation time when requested', () => {
    const model = buildExportModel(META, notes, opts({ order: 'created' }), NOW);
    expect(model.notes.map((n) => n.id)).toEqual(['a', 'b']);
  });
  it('filters to selected notes', () => {
    const model = buildExportModel(META, notes, opts({ selectedNoteIds: ['a'] }), NOW);
    expect(model.notes.map((n) => n.id)).toEqual(['a']);
  });
});

describe('renderMarkdown', () => {
  it('includes metadata, excerpt, final note, and tags', () => {
    const model = buildExportModel(META, [note({ id: 'a' })], opts(), NOW);
    const md = renderMarkdown(model, opts());
    expect(md).toContain('# Araştırma Notları');
    expect(md).toContain('**Başlık:** Örnek Makale');
    expect(md).toContain('**Not sayısı:** 1');
    expect(md).toContain('## Not 1 — Sayfa 1');
    expect(md).toContain('> Kaynak: "kaynak pasaj"');
    expect(md).toContain('nihai not');
    expect(md).toContain('**Etiketler:** yöntem');
  });

  it('omits raw transcript unless requested, and respects toggles', () => {
    const model = buildExportModel(META, [note({ id: 'a' })], opts(), NOW);
    expect(renderMarkdown(model, opts({ includeRawTranscript: false }))).not.toContain('ham metin');
    expect(renderMarkdown(model, opts({ includeRawTranscript: true }))).toContain('ham metin');
    expect(renderMarkdown(model, opts({ includeSourceExcerpt: false }))).not.toContain('Kaynak:');
    expect(renderMarkdown(model, opts({ includeTags: false }))).not.toContain('Etiketler');
  });
});

describe('renderTxt', () => {
  it('produces a plain-text report', () => {
    const model = buildExportModel(META, [note({ id: 'a' })], opts(), NOW);
    const txt = renderTxt(model, opts());
    expect(txt).toContain('ARAŞTIRMA NOTLARI');
    expect(txt).toContain('NOT 1 [Sayfa 1]');
    expect(txt).toContain('Nihai not: nihai not');
  });
});

describe('buildTable', () => {
  it('builds a header row plus one row per note, honouring toggles', () => {
    const model = buildExportModel(META, [note({ id: 'a' })], opts(), NOW);
    const table = buildTable(model, opts({ includeRawTranscript: true }));
    expect(table.headers).toContain('Nihai Not');
    expect(table.headers).toContain('Ham Döküm');
    expect(table.headers).toContain('Kaynak Pasaj');
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0][0]).toBe('1'); // No
    expect(table.rows[0]).toContain('nihai not');
  });

  it('drops columns when their toggle is off', () => {
    const model = buildExportModel(META, [note({ id: 'a' })], opts(), NOW);
    const table = buildTable(model, opts({ includeRawTranscript: false, includeTags: false }));
    expect(table.headers).not.toContain('Ham Döküm');
    expect(table.headers).not.toContain('Etiketler');
  });
});

describe('renderCsv', () => {
  it('quotes fields with commas/quotes/newlines and uses CRLF', () => {
    const model = buildExportModel(META, [
      note({ id: 'a', finalNote: 'iki, virgül', sourceAnchor: { documentId: 'd1', pageNumber: 1, globalIndex: 0, selectedText: 'tırnak "x"' } }),
    ], opts(), NOW);
    const csv = renderCsv(model, opts());
    expect(csv.split('\r\n').length).toBeGreaterThanOrEqual(2);
    expect(csv).toContain('"iki, virgül"');
    expect(csv).toContain('"tırnak ""x"""');
  });
});

describe('renderXlsxBytes', () => {
  it('produces a valid (PK-headed) zip workbook', async () => {
    const model = buildExportModel(META, [note({ id: 'a' })], opts(), NOW);
    const bytes = await renderXlsxBytes(model, opts());
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
  });

  it('round-trips through JSZip to a worksheet with the note content', async () => {
    const model = buildExportModel(META, [note({ id: 'a', finalNote: 'özgün not' })], opts(), NOW);
    const bytes = await renderXlsxBytes(model, opts());
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(bytes);
    const sheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(sheet).toContain('özgün not');
    expect(sheet).toContain('Nihai Not');
  });
});

describe('buildDocxDocument', () => {
  it('packs to a non-empty DOCX buffer', async () => {
    const model = buildExportModel(META, [note({ id: 'a' }), note({ id: 'b', ordinal: 2 })], opts(), NOW);
    const doc = buildDocxDocument(model, opts({ includeRawTranscript: true }));
    const buffer = await Packer.toBuffer(doc);
    expect(buffer.length).toBeGreaterThan(0);
    // DOCX is a ZIP — verify the PK magic header.
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});
