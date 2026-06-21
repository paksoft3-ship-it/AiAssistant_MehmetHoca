import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, Quote, Sparkles, Save, Wand2, Loader2 } from 'lucide-react';
import type { NoteOrigin } from '../../../types/domain';
import { parseTagInput } from '../services/noteFactory';

const DICTATION_LANGS: { code: string; label: string }[] = [
  { code: 'tr', label: 'TR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
];

export interface NoteEditorSaveData {
  rawTranscript: string;
  finalNote: string;
  cleanedAcademicNote?: string;
  tags: string[];
  origin: NoteOrigin;
}

export interface CleanNoteResponse {
  cleanedNote: string;
  suggestedTags?: string[];
  warnings?: string[];
}

export interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The exact source passage the note is linked to. */
  sourceExcerpt: string;
  pageNumber: number;
  /** True when the excerpt came from a user text selection (vs the active line). */
  isSelectionBased: boolean;
  // Dictation bindings (from useSpeechEngine).
  isSpeechListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  onStartSpeech: () => void;
  onStopSpeech: () => void;
  dictationLanguage: string;
  onChangeDictationLanguage: (code: string) => void;
  onClearTranscript: () => void;
  onSave: (data: NoteEditorSaveData) => void;
  /**
   * Optional AI cleaning handler (Phase 3). When omitted, the AI cleaning
   * affordance is hidden so the editor works fully without AI.
   */
  onRequestClean?: (raw: string, excerpt: string) => Promise<CleanNoteResponse>;
}

/**
 * Source-linked note editor (CLAUDE.md §11.1). Shows the exact source excerpt,
 * preserves the raw transcript separately from the final note, supports tags,
 * and always allows saving without AI.
 */
export default function NoteEditorModal({
  isOpen,
  onClose,
  sourceExcerpt,
  pageNumber,
  isSelectionBased,
  isSpeechListening,
  interimTranscript,
  finalTranscript,
  onStartSpeech,
  onStopSpeech,
  dictationLanguage,
  onChangeDictationLanguage,
  onClearTranscript,
  onSave,
  onRequestClean,
}: NoteEditorModalProps) {
  const [rawText, setRawText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [cleanedNote, setCleanedNote] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanWarning, setCleanWarning] = useState<string | null>(null);
  const usedMicRef = useRef(false);

  // Reset everything when the editor opens.
  useEffect(() => {
    if (isOpen) {
      setRawText('');
      setFinalText('');
      setTagsInput('');
      setCleanedNote(null);
      setCleanWarning(null);
      setIsCleaning(false);
      usedMicRef.current = false;
    }
  }, [isOpen]);

  // Reflect the live dictation transcript into the raw-transcript field.
  useEffect(() => {
    if (!isOpen) return;
    const combined = `${finalTranscript} ${interimTranscript}`.trim();
    if (combined) {
      usedMicRef.current = true;
      setRawText(combined);
    }
  }, [isOpen, finalTranscript, interimTranscript]);

  if (!isOpen) return null;

  const handleCopyRawToFinal = () => setFinalText(rawText);

  const handleClean = async () => {
    if (!onRequestClean || !rawText.trim()) return;
    setIsCleaning(true);
    setCleanWarning(null);
    try {
      const result = await onRequestClean(rawText.trim(), sourceExcerpt);
      setCleanedNote(result.cleanedNote);
      setFinalText(result.cleanedNote);
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        setTagsInput((prev) => (prev ? prev : result.suggestedTags!.join(', ')));
      }
      if (result.warnings && result.warnings.length > 0) {
        setCleanWarning(result.warnings.join(' '));
      }
    } catch (err) {
      setCleanWarning(
        'Akademik düzenleme şu anda yapılamadı. Notunuzu olduğu gibi kaydedebilirsiniz.',
      );
      console.error('[EidosUs] Note cleaning failed:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSave = () => {
    const raw = rawText.trim();
    const final = (finalText.trim() || raw).trim();
    if (!final) return;
    onSave({
      rawTranscript: raw,
      finalNote: final,
      cleanedAcademicNote: cleanedNote ?? undefined,
      tags: parseTagInput(tagsInput),
      origin: usedMicRef.current ? 'voice' : 'typed',
    });
  };

  const canSave = (finalText.trim() || rawText.trim()).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="flex items-center gap-2 font-sans text-base font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Kaynağa Bağlı Not
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Sayfa {pageNumber} · {isSelectionBased ? 'Seçili metne bağlı' : 'Aktif cümleye bağlı'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            title="Kapat"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Source excerpt card */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="mb-1 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              <Quote className="h-3.5 w-3.5" />
              Kaynak Pasaj
            </div>
            <p className="text-xs italic leading-relaxed text-slate-700 dark:text-slate-300">
              &ldquo;{sourceExcerpt || 'Pasaj bulunamadı'}&rdquo;
            </p>
          </div>

          {/* Dictation controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={isSpeechListening ? onStopSpeech : onStartSpeech}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                isSpeechListening
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
              }`}
              aria-pressed={isSpeechListening}
            >
              {isSpeechListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isSpeechListening ? 'Dinleniyor — Durdur' : 'Sesle Yazdır'}
            </button>
            <div className="flex items-center gap-1">
              {DICTATION_LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onChangeDictationLanguage(l.code)}
                  className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                    dictationLanguage === l.code
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Ses tanıma davranışı tarayıcınıza ve cihazınıza bağlıdır; bazı tarayıcılar konuşmayı
            çevrim içi hizmetlerle işleyebilir.
          </p>

          {/* Raw transcript */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-2xs font-bold uppercase tracking-wide text-slate-500">
                Ham Döküm
              </label>
              <button
                onClick={() => {
                  setRawText('');
                  onClearTranscript();
                }}
                className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
              >
                Temizle
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Konuşun veya buraya fikrinizi yazın. Ham döküm olduğu gibi saklanır."
              className="min-h-[80px] w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* AI cleaning (Phase 3) — only when a handler is supplied */}
          {onRequestClean && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClean}
                disabled={isCleaning || !rawText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-950/30 dark:text-violet-300"
              >
                {isCleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Akademik Olarak Düzenle
              </button>
              {cleanedNote && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Düzenlenmiş öneri nihai nota eklendi
                </span>
              )}
            </div>
          )}
          {cleanWarning && <p className="text-[11px] text-amber-600">{cleanWarning}</p>}

          {/* Final note */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-2xs font-bold uppercase tracking-wide text-slate-500">
                Düzenlenmiş Akademik Not
              </label>
              <button
                onClick={handleCopyRawToFinal}
                className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700"
              >
                Ham dökümü kopyala
              </button>
            </div>
            <textarea
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              placeholder="Nihai notunuz. Boş bırakırsanız ham döküm kaydedilir."
              className="min-h-[80px] w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-2xs font-bold uppercase tracking-wide text-slate-500">
              Etiketler (virgülle ayırın)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="örn. yöntem, hipotez, literatür"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            <Save className="h-4 w-4" />
            Notu Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
