import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import type { ExportModel, ExportOptions } from './exportTypes';

function formatDate(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16);
}

function labelled(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)],
  });
}

/**
 * Build a docx `Document` from the export model. Pure (no I/O), so it can be
 * unit-tested by packing to a buffer.
 */
export function buildDocxDocument(model: ExportModel, options: ExportOptions): Document {
  const { meta, notes } = model;
  const children: Paragraph[] = [];

  children.push(new Paragraph({ text: 'Araştırma Notları', heading: HeadingLevel.TITLE }));
  children.push(new Paragraph({ text: 'Belge', heading: HeadingLevel.HEADING_2 }));
  children.push(labelled('Başlık', meta.title));
  if (meta.authors && meta.authors.length) children.push(labelled('Yazarlar', meta.authors.join(', ')));
  if (meta.publicationYear) children.push(labelled('Yıl', String(meta.publicationYear)));
  if (meta.doi) children.push(labelled('DOI', meta.doi));
  children.push(labelled('Dışa aktarma tarihi', formatDate(model.exportedAt)));
  children.push(labelled('Not sayısı', String(notes.length)));

  notes.forEach((note, idx) => {
    children.push(
      new Paragraph({
        text: `Not ${idx + 1} — Sayfa ${note.sourceAnchor.pageNumber}`,
        heading: HeadingLevel.HEADING_3,
      }),
    );
    if (options.includeSourceExcerpt && note.sourceAnchor.selectedText) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Kaynak: “${note.sourceAnchor.selectedText}”`, italics: true })],
        }),
      );
    }
    children.push(new Paragraph({ children: [new TextRun({ text: 'Nihai not:', bold: true })] }));
    children.push(new Paragraph(note.finalNote || '(boş)'));
    if (options.includeRawTranscript && note.rawTranscript) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'Ham döküm:', bold: true })] }));
      children.push(new Paragraph(note.rawTranscript));
    }
    if (options.includeTags && note.tags.length) {
      children.push(labelled('Etiketler', note.tags.join(', ')));
    }
    children.push(
      new Paragraph({ children: [new TextRun({ text: `Oluşturulma: ${formatDate(note.createdAt)}`, italics: true, size: 18 })] }),
    );
  });

  return new Document({ sections: [{ children }] });
}

/** Serialize a docx Document to a Blob (browser). */
export async function docxToBlob(doc: Document): Promise<Blob> {
  return Packer.toBlob(doc);
}
