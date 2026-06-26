import type { HistoryEvent, HistoryEventType } from '../../../types/domain';

const META: Record<HistoryEventType, { icon: string; label: string }> = {
  document_uploaded: { icon: 'upload_file', label: 'Belge yüklendi' },
  url_imported: { icon: 'link', label: 'Bağlantıdan içe aktarıldı' },
  document_opened: { icon: 'menu_book', label: 'Belge açıldı' },
  note_created: { icon: 'edit_note', label: 'Not eklendi' },
  note_deleted: { icon: 'delete', label: 'Not silindi' },
  export_created: { icon: 'download', label: 'Dışa aktarıldı' },
  project_created: { icon: 'create_new_folder', label: 'Proje oluşturuldu' },
};

/** Icon + human label for a history event, including a short detail from metadata. */
export function describeEvent(event: HistoryEvent): { icon: string; label: string; detail?: string } {
  const base = META[event.type] ?? { icon: 'history', label: event.type };
  const title = event.metadata?.title;
  const format = event.metadata?.format;
  const name = event.metadata?.name;
  const detail = [title, name, format].find((v) => typeof v === 'string' && v.length > 0) as string | undefined;
  return { ...base, detail };
}

/** Locale date-time for the timeline. */
export function formatEventTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
