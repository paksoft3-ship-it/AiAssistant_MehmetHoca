import { useState } from 'react';
import { X, Download, FileText, FileType2, FileCode2, Loader2 } from 'lucide-react';
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

const FORMATS: { value: ExportFormat; label: string; icon: typeof FileText }[] = [
  { value: 'markdown', label: 'Markdown', icon: FileCode2 },
  { value: 'docx', label: 'Word (DOCX)', icon: FileType2 },
  { value: 'txt', label: 'Düz Metin (TXT)', icon: FileText },
];

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

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCount = selectMode ? selectedIds.size : notes.length;

  const handleExport = async () => {
    if (exportCount === 0) return;
    setIsExporting(true);
    setError(null);
    try {
      const result = await exportNotes(
        documentId,
        { title: documentTitle },
        notes,
        { ...options, selectedNoteIds: selectMode ? [...selectedIds] : null },
      );
      onExported?.(result);
      onClose();
    } catch (err) {
      console.error('[EidosUs] Export failed:', err);
      setError('Dışa aktarma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  };

  const Checkbox = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
      {label}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 font-sans text-base font-bold text-slate-900 dark:text-white">
            <Download className="h-4 w-4 text-indigo-600" />
            Notları Dışa Aktar
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Format */}
          <div>
            <label className="mb-2 block text-2xs font-bold uppercase tracking-wide text-slate-500">Biçim</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setOptions((o) => ({ ...o, format: f.value }))}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${
                    options.format === f.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <f.icon className="h-5 w-5" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content options */}
          <div>
            <label className="mb-2 block text-2xs font-bold uppercase tracking-wide text-slate-500">İçerik</label>
            <div className="space-y-2">
              <Checkbox
                checked={options.includeSourceExcerpt}
                onChange={(v) => setOptions((o) => ({ ...o, includeSourceExcerpt: v }))}
                label="Kaynak pasajları dahil et"
              />
              <Checkbox
                checked={options.includeRawTranscript}
                onChange={(v) => setOptions((o) => ({ ...o, includeRawTranscript: v }))}
                label="Ham dökümleri dahil et"
              />
              <Checkbox
                checked={options.includeTags}
                onChange={(v) => setOptions((o) => ({ ...o, includeTags: v }))}
                label="Etiketleri dahil et"
              />
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="mb-2 block text-2xs font-bold uppercase tracking-wide text-slate-500">Sıralama</label>
            <div className="flex gap-2">
              {(['source', 'created'] as const).map((ord) => (
                <button
                  key={ord}
                  onClick={() => setOptions((o) => ({ ...o, order: ord }))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    options.order === ord
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {ord === 'source' ? 'Kaynak sırası' : 'Eklenme zamanı'}
                </button>
              ))}
            </div>
          </div>

          {/* Selection */}
          <div>
            <Checkbox
              checked={selectMode}
              onChange={(v) => setSelectMode(v)}
              label="Yalnızca seçili notları dışa aktar"
            />
            {selectMode && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                {notes.map((n) => (
                  <label
                    key={n.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-2xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(n.id)}
                      onChange={() => toggleSelected(n.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-mono font-bold text-slate-400">#{n.ordinal}</span>
                    <span className="truncate">{n.finalNote}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <span className="text-xs text-slate-400">{exportCount} not dışa aktarılacak</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              İptal
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || exportCount === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Dışa Aktar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
