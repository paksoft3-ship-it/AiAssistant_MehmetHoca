import type { ExportModel, ExportOptions } from './exportTypes';

function formatDate(iso: string): string {
  // Stable, locale-independent YYYY-MM-DD HH:mm (avoids test flakiness).
  return iso.replace('T', ' ').slice(0, 16);
}

/** Render the export model to a Markdown string (CLAUDE.md §12.1). */
export function renderMarkdown(model: ExportModel, options: ExportOptions): string {
  const { meta, notes } = model;
  const out: string[] = [];

  out.push('# Araştırma Notları');
  out.push('');
  out.push('## Belge');
  out.push(`**Başlık:** ${meta.title}`);
  if (meta.authors && meta.authors.length) out.push(`**Yazarlar:** ${meta.authors.join(', ')}`);
  if (meta.publicationYear) out.push(`**Yıl:** ${meta.publicationYear}`);
  if (meta.doi) out.push(`**DOI:** ${meta.doi}`);
  out.push(`**Dışa aktarma tarihi:** ${formatDate(model.exportedAt)}`);
  out.push(`**Not sayısı:** ${notes.length}`);
  out.push('');

  notes.forEach((note, idx) => {
    out.push(`## Not ${idx + 1} — Sayfa ${note.sourceAnchor.pageNumber}`);
    out.push('');
    if (options.includeSourceExcerpt && note.sourceAnchor.selectedText) {
      out.push(`> Kaynak: "${note.sourceAnchor.selectedText}"`);
      out.push('');
    }
    out.push('**Nihai not:**');
    out.push(note.finalNote || '_(boş)_');
    out.push('');
    if (options.includeRawTranscript && note.rawTranscript) {
      out.push('**Ham döküm:**');
      out.push(note.rawTranscript);
      out.push('');
    }
    if (options.includeTags && note.tags.length) {
      out.push(`**Etiketler:** ${note.tags.join(', ')}`);
      out.push('');
    }
    out.push(`_Oluşturulma: ${formatDate(note.createdAt)}_`);
    out.push('');
  });

  return out.join('\n').trim() + '\n';
}
