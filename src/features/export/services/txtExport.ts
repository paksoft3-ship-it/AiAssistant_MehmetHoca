import type { ExportModel, ExportOptions } from './exportTypes';

function formatDate(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16);
}

const RULE = '-----------------------------------------';

/** Render the export model to a plain-text string (backward-compatible TXT). */
export function renderTxt(model: ExportModel, options: ExportOptions): string {
  const { meta, notes } = model;
  const out: string[] = [];

  out.push('ARAŞTIRMA NOTLARI');
  out.push(`Başlık: ${meta.title}`);
  if (meta.authors && meta.authors.length) out.push(`Yazarlar: ${meta.authors.join(', ')}`);
  if (meta.doi) out.push(`DOI: ${meta.doi}`);
  out.push(`Dışa aktarma tarihi: ${formatDate(model.exportedAt)}`);
  out.push(`Not sayısı: ${notes.length}`);
  out.push('');
  out.push(RULE);
  out.push('');

  notes.forEach((note, idx) => {
    out.push(`NOT ${idx + 1} [Sayfa ${note.sourceAnchor.pageNumber}] - ${formatDate(note.createdAt)}`);
    if (options.includeSourceExcerpt && note.sourceAnchor.selectedText) {
      out.push(`Kaynak: "${note.sourceAnchor.selectedText}"`);
    }
    out.push(`Nihai not: ${note.finalNote}`);
    if (options.includeRawTranscript && note.rawTranscript) {
      out.push(`Ham döküm: ${note.rawTranscript}`);
    }
    if (options.includeTags && note.tags.length) {
      out.push(`Etiketler: ${note.tags.join(', ')}`);
    }
    out.push(RULE);
    out.push('');
  });

  return out.join('\n').trim() + '\n';
}
