import { useEffect, useRef, useState } from 'react';
import type { NoteOrigin } from '../../../types/domain';
import { parseTagInput, normalizeTags } from '../services/noteFactory';
import { suggestTags } from '../services/tagCatalog';
import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';
import { isSpeechRecognitionSupported } from '../../speech/services/capabilities';

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
  sourceExcerpt: string;
  pageNumber: number;
  isSelectionBased: boolean;
  isSpeechListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  onStartSpeech: () => void;
  onStopSpeech: () => void;
  dictationLanguage: string;
  onChangeDictationLanguage: (code: string) => void;
  onClearTranscript: () => void;
  onSave: (data: NoteEditorSaveData) => void;
  onRequestClean?: (raw: string, excerpt: string) => Promise<CleanNoteResponse>;
  /** Tags already used across the user's notes, for autocomplete/quick-add. */
  knownTags?: string[];
}

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
  knownTags = [],
}: NoteEditorModalProps) {
  const [rawText, setRawText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [cleanedNote, setCleanedNote] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanWarning, setCleanWarning] = useState<string | null>(null);
  const usedMicRef = useRef(false);
  const recognitionSupported = isSpeechRecognitionSupported();

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

  useEffect(() => {
    if (!isOpen) return;
    const combined = `${finalTranscript} ${interimTranscript}`.trim();
    if (combined) {
      usedMicRef.current = true;
      setRawText(combined);
    }
  }, [isOpen, finalTranscript, interimTranscript]);

  if (!isOpen) return null;

  const handleClean = async () => {
    if (!onRequestClean || !rawText.trim()) return;
    setIsCleaning(true);
    setCleanWarning(null);
    try {
      const result = await onRequestClean(rawText.trim(), sourceExcerpt);
      setCleanedNote(result.cleanedNote);
      setFinalText(result.cleanedNote);
      if (result.suggestedTags?.length) setTagsInput((p) => (p ? p : result.suggestedTags!.join(', ')));
      if (result.warnings?.length) setCleanWarning(result.warnings.join(' '));
    } catch (err) {
      setCleanWarning('Akademik düzenleme şu anda yapılamadı. Notunuzu olduğu gibi kaydedebilirsiniz.');
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
  const selectedTags = parseTagInput(tagsInput);
  // Quick-add suggestions: user's own tags first, then the academic catalog,
  // filtered by what's already typed after the last comma.
  const lastToken = tagsInput.split(',').pop()?.trim() ?? '';
  const tagSuggestions = suggestTags(lastToken, { selected: selectedTags, existing: knownTags, limit: 10 });
  const addTag = (tag: string) => setTagsInput(normalizeTags([...selectedTags, tag]).join(', '));
  const labelCls = 'font-small text-small font-medium text-text dark:text-slate-300';
  const textareaCls =
    'w-full resize-none rounded-xl border border-border bg-surface p-md font-body-ui text-body-ui text-text transition-shadow focus:border-focus-ring focus:ring-2 focus:ring-focus-ring dark:bg-slate-950 dark:text-slate-100';

  return (
    <Portal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-on-surface/20 p-md backdrop-blur-md sm:p-lg">
      <div className="relative my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-surface px-lg py-md dark:bg-slate-900">
          <div>
            <h2 className="font-h3-card-title text-h3-card-title text-on-surface dark:text-white">Kaynağa Bağlı Not</h2>
            <p className="mt-xs flex items-center gap-xs font-small text-small text-text-muted">
              Sayfa {pageNumber}
              <span className="inline-block h-1 w-1 rounded-full bg-outline-variant" />
              {isSelectionBased ? 'Seçili metne bağlı' : 'Aktif cümleye bağlı'}
            </p>
          </div>
          <button onClick={onClose} className="-mr-sm rounded-lg p-sm text-outline transition-colors hover:bg-surface-muted hover:text-text" aria-label="Kapat">
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex max-h-[calc(100vh-160px)] flex-col gap-xl overflow-y-auto p-lg">
          {/* Source excerpt */}
          <div className="rounded-xl border border-primary-fixed-dim bg-primary-soft p-md">
            <div className="mb-sm flex items-center gap-sm">
              <Icon name="format_quote" className="text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} />
              <span className="font-label-mono text-label-mono uppercase tracking-wider text-primary">Kaynak Pasaj</span>
            </div>
            <p className="ml-sm border-l-2 border-primary/30 pl-sm font-body-reading text-body-reading italic text-text">
              &ldquo;{sourceExcerpt || 'Pasaj bulunamadı'}&rdquo;
            </p>
          </div>

          {/* Dictation */}
          {recognitionSupported ? (
            <div className="flex flex-col gap-sm">
              <div className="flex flex-wrap items-center justify-between gap-md">
                <button
                  onClick={isSpeechListening ? onStopSpeech : onStartSpeech}
                  className={`flex items-center gap-xs rounded-lg px-md py-sm font-small text-small transition-colors ${
                    isSpeechListening
                      ? 'border border-danger/30 bg-danger-soft text-danger shadow-sm'
                      : 'border border-border bg-surface text-text hover:bg-surface-muted'
                  }`}
                >
                  {isSpeechListening ? (
                    <span className="mr-xs h-2 w-2 animate-pulse rounded-full bg-danger" />
                  ) : (
                    <Icon name="mic" className="text-[18px]" />
                  )}
                  {isSpeechListening ? 'Dinleniyor — Durdur' : 'Sesle Yazdır'}
                </button>
                <div className="flex items-center gap-xs">
                  <span className="mr-xs font-small text-small text-text-muted">Dil:</span>
                  {DICTATION_LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => onChangeDictationLanguage(l.code)}
                      className={`rounded-full px-2 py-1 font-small text-small transition-colors ${
                        dictationLanguage === l.code
                          ? 'border border-primary-fixed-dim bg-primary-soft text-primary'
                          : 'border border-transparent bg-surface-muted text-text-muted hover:border-border hover:text-text'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-xs flex items-start gap-xs font-label-mono text-label-mono text-outline">
                <Icon name="info" className="text-[14px]" />
                Ses tanıma davranışı tarayıcınıza ve cihazınıza bağlıdır; bazı tarayıcılar konuşmayı çevrim içi hizmetlerle işleyebilir.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-sm rounded-xl bg-surface-muted p-md font-small text-small text-text-muted">
              <Icon name="keyboard" className="text-[18px]" />
              Tarayıcınız ses tanımayı desteklemiyor. Notunuzu aşağıya klavyeyle yazabilirsiniz.
            </div>
          )}

          {/* Raw transcript */}
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Ham Döküm</label>
              <button onClick={() => { setRawText(''); onClearTranscript(); }} className="font-small text-small text-text-muted transition-colors hover:text-primary">Temizle</button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={3}
              placeholder="Sesle yazdırılan veya elle girilen ham notlarınız burada görünür..."
              className={textareaCls}
            />
          </div>

          {/* AI refinement */}
          {onRequestClean && (
            <div className="-my-sm flex flex-col items-center gap-xs">
              <button
                onClick={handleClean}
                disabled={isCleaning || !rawText.trim()}
                className="group flex items-center gap-sm rounded-full border border-primary/40 bg-surface px-lg py-sm font-small text-small text-primary shadow-sm transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name={isCleaning ? 'progress_activity' : 'auto_awesome'} className={`text-[18px] ${isCleaning ? 'animate-spin' : 'transition-transform group-hover:rotate-12'}`} />
                Akademik Olarak Düzenle
              </button>
              {cleanWarning && <p className="text-center font-label-mono text-label-mono text-warning">{cleanWarning}</p>}
            </div>
          )}

          {/* Refined note */}
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <label className={`${labelCls} flex items-center gap-xs`}>
                Düzenlenmiş Akademik Not
                {cleanedNote && <Icon name="check_circle" className="text-[14px] text-success" />}
              </label>
              <button onClick={() => setFinalText(rawText)} className="flex items-center gap-xs font-small text-small text-text-muted transition-colors hover:text-primary">
                <Icon name="content_copy" className="text-[14px]" /> Ham dökümü kopyala
              </button>
            </div>
            <textarea
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              rows={4}
              placeholder="Nihai notunuz. Boş bırakırsanız ham döküm kaydedilir."
              className={`${textareaCls} leading-relaxed`}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-xs">
            <label className={labelCls}>Etiketler</label>
            <div className="relative flex items-center">
              <Icon name="sell" className="pointer-events-none absolute left-md text-[18px] text-text-muted" />
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Örn: yöntem, hipotez, literatür (virgülle ayırın)"
                className="w-full rounded-xl border border-border bg-surface py-sm pl-[40px] pr-md font-small text-small text-text transition-shadow focus:border-focus-ring focus:ring-2 focus:ring-focus-ring dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            {tagSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-xs pt-xs">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 font-small text-small text-text-muted transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
                  >
                    <Icon name="add" className="text-[14px]" />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-sm border-t border-border px-lg py-md">
          <button onClick={onClose} className="rounded-btn px-4 py-2 font-small text-small font-medium text-text-muted transition-colors hover:bg-surface-muted">İptal</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 rounded-btn bg-primary px-5 py-2 font-small text-small font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
          >
            <Icon name="save" className="text-[18px]" />
            Notu Kaydet
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
