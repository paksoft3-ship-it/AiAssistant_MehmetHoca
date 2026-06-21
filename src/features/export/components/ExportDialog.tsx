import { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';
import type { ResearchNote } from '../../../types/domain';
import {
  DEFAULT_EXPORT_OPTIONS,
  type ExportFormat,
  type ExportOptions,
} from '../services/exportTypes';
import { exportNotes, type ExportResult } from '../services/exportService';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  notes: ResearchNote[];
  onExported?: (result: ExportResult) => void;
}

const FORMATS: { value: ExportFormat; label: string; sub: string; icon: string }[] = [
  { value: 'markdown', label: 'Markdown', sub: 'Obsidian & Notion için ideal', icon: 'markdown' },
  { value: 'docx', label: 'Word (DOCX)', sub: 'Akademik makale taslakları', icon: 'description' },
  { value: 'txt', label: 'Düz Metin (TXT)', sub: 'Sadece ham metin', icon: 'article' },
];

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 flex h-5 w-5 items-center justify-center">
        <span
          className={`h-5 w-5 rounded border transition-colors ${
            checked ? 'border-primary bg-primary' : 'border-border bg-surface'
          }`}
        />
        {checked && <Icon name="check" className="absolute text-[16px] text-white" />}
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      </span>
      <span className="text-on-surface transition-colors group-hover:text-primary dark:text-slate-200">{label}</span>
    </label>
  );
}

export default function ExportDialog({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  notes,
  onExported,
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exportCount = selectMode ? selectedIds.size : notes.length;

  const handleExport = async () => {
    if (exportCount === 0) return;
    setIsExporting(true);
    setError(null);
    try {
      const result = await exportNotes(documentId, { title: documentTitle }, notes, {
        ...options,
        selectedNoteIds: selectMode ? [...selectedIds] : null,
      });
      onExported?.(result);
      onClose();
    } catch (err) {
      console.error('[EidosUs] Export failed:', err);
      setError('Dışa aktarma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-md backdrop-blur-sm sm:p-lg">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-border bg-surface shadow-lg dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-lg py-md dark:bg-slate-900">
          <div className="flex items-center gap-sm text-on-surface dark:text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon name="file_download" />
            </div>
            <h2 className="font-h2-section-title text-h2-section-title">Notları Dışa Aktar</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-on-surface"
            aria-label="Kapat"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-xl overflow-y-auto p-lg">
          {/* Format */}
          <section>
            <h3 className="mb-md font-h3-card-title text-h3-card-title text-on-surface dark:text-white">Biçim</h3>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
              {FORMATS.map((f) => {
                const selected = options.format === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setOptions((o) => ({ ...o, format: f.value }))}
                    className={`rounded-xl p-md text-left transition-all ${
                      selected
                        ? 'border-2 border-primary bg-primary-soft'
                        : 'border border-border bg-surface hover:border-outline-variant hover:bg-surface-muted dark:bg-slate-900'
                    }`}
                  >
                    <div className="mb-sm flex items-start justify-between">
                      <Icon name={f.icon} className={selected ? 'text-primary' : 'text-text-muted'} />
                      {selected && (
                        <Icon name="check_circle" className="text-primary" style={{ fontVariationSettings: "'FILL' 1" }} />
                      )}
                    </div>
                    <span className={`block font-medium ${selected ? 'text-primary' : 'text-on-surface dark:text-white'}`}>{f.label}</span>
                    <span className={`mt-xs block font-small text-small ${selected ? 'text-primary/80' : 'text-text-muted'}`}>{f.sub}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="border-border" />

          {/* Content + Order */}
          <div className="grid grid-cols-1 gap-xl md:grid-cols-2">
            <section>
              <h3 className="mb-md font-h3-card-title text-h3-card-title text-on-surface dark:text-white">İçerik</h3>
              <div className="flex flex-col gap-sm">
                <Check checked={options.includeSourceExcerpt} onChange={(v) => setOptions((o) => ({ ...o, includeSourceExcerpt: v }))} label="Kaynak pasajları dahil et" />
                <Check checked={options.includeRawTranscript} onChange={(v) => setOptions((o) => ({ ...o, includeRawTranscript: v }))} label="Ham dökümleri dahil et" />
                <Check checked={options.includeTags} onChange={(v) => setOptions((o) => ({ ...o, includeTags: v }))} label="Etiketleri dahil et" />
              </div>
            </section>
            <section>
              <h3 className="mb-md font-h3-card-title text-h3-card-title text-on-surface dark:text-white">Sıralama</h3>
              <div className="flex rounded-lg border border-border bg-surface-muted p-1 dark:bg-slate-800">
                {([['source', 'Kaynak sırası'], ['created', 'Eklenme zamanı']] as const).map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => setOptions((o) => ({ ...o, order: val }))}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      options.order === val ? 'bg-surface text-on-surface shadow-sm dark:bg-slate-900 dark:text-white' : 'text-text-muted hover:text-on-surface'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <label className="mt-md flex cursor-pointer items-center gap-2 font-small text-small text-text-muted">
                <input type="checkbox" checked={selectMode} onChange={(e) => setSelectMode(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                Yalnızca seçili notları aktar
              </label>
            </section>
          </div>

          {selectMode && (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {notes.map((n) => (
                <label key={n.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 font-small text-small text-text hover:bg-surface-muted dark:text-slate-300">
                  <input type="checkbox" checked={selectedIds.has(n.id)} onChange={() => toggleSelected(n.id)} className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary" />
                  <span className="font-label-mono text-label-mono text-text-muted">#{n.ordinal}</span>
                  <span className="truncate">{n.finalNote}</span>
                </label>
              ))}
            </div>
          )}

          {error && <p className="font-small text-small text-danger">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-lg py-md">
          <span className="font-small text-small text-text-muted">{exportCount} not dışa aktarılacak</span>
          <div className="flex items-center gap-sm">
            <button onClick={onClose} className="rounded-btn px-4 py-2 font-medium text-text-muted transition-colors hover:bg-surface-muted">İptal</button>
            <button
              onClick={handleExport}
              disabled={isExporting || exportCount === 0}
              className="inline-flex items-center gap-1.5 rounded-btn bg-primary px-5 py-2 font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
            >
              <Icon name={isExporting ? 'progress_activity' : 'file_download'} className={isExporting ? 'animate-spin text-[18px]' : 'text-[18px]'} />
              Dışa Aktar
            </button>
          </div>
        </div>
      </div>
    </div>
    </Portal>
  );
}
