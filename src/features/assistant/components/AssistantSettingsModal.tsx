import { useEffect, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';
import {
  type AssistantPreferences,
  normalizeAssistantPrefs,
} from '../services/assistantPreferences';
import { COMMANDS } from '../services/commands';

export interface AssistantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: AssistantPreferences;
  onSave: (prefs: AssistantPreferences) => void;
}

/** Configure the assistant name, wake phrase, language, and hands-free options (Beta spec §15). */
export default function AssistantSettingsModal({ isOpen, onClose, prefs, onSave }: AssistantSettingsModalProps) {
  const [draft, setDraft] = useState<AssistantPreferences>(prefs);

  useEffect(() => {
    if (isOpen) setDraft(prefs);
  }, [isOpen, prefs]);

  if (!isOpen) return null;

  const save = () => {
    onSave(normalizeAssistantPrefs(draft));
    onClose();
  };

  const exampleCommands = COMMANDS[draft.language === 'en' ? 'en' : 'tr'];

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/20 p-md backdrop-blur-md sm:p-lg" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-title"
          className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-lg py-md">
            <h2 id="assistant-title" className="flex items-center gap-sm font-h3-card-title text-h3-card-title text-on-surface dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon name="assistant" className="text-[20px]" />
              </span>
              Asistan Ayarları
            </h2>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-on-surface" aria-label="Kapat">
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <div className="space-y-lg overflow-y-auto p-lg">
            <div className="flex flex-col gap-xs">
              <label className="font-small text-small font-medium text-text dark:text-slate-300">Asistan adı</label>
              <input
                value={draft.assistantName}
                onChange={(e) => setDraft((d) => ({ ...d, assistantName: e.target.value }))}
                placeholder="Sokrates"
                className="rounded-btn border border-border bg-surface px-3 py-2 font-small text-small outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring dark:bg-slate-950 dark:text-slate-200"
              />
              <p className="font-label-mono text-label-mono text-text-muted">
                Bu ad uyandırma sözcüğü olarak da kullanılır. Örn: &ldquo;{draft.assistantName || 'Sokrates'}, dur not alalım&rdquo;.
              </p>
            </div>

            <div className="flex flex-col gap-xs">
              <span className="font-small text-small font-medium text-text dark:text-slate-300">Dil</span>
              <div className="flex rounded-lg border border-border bg-surface-muted p-1 dark:bg-slate-800">
                {(['tr', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setDraft((d) => ({ ...d, language: l }))}
                    className={`flex-1 rounded-md px-3 py-1.5 font-small text-small font-medium transition-all ${draft.language === l ? 'bg-surface text-on-surface shadow-sm dark:bg-slate-900 dark:text-white' : 'text-text-muted'}`}
                  >
                    {l === 'tr' ? 'Türkçe' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-md">
              <span className="font-small text-small text-text dark:text-slate-300">Eller serbest sesli komutlar</span>
              <input type="checkbox" checked={draft.handsFreeEnabled} onChange={(e) => setDraft((d) => ({ ...d, handsFreeEnabled: e.target.checked }))} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-md">
              <span className="font-small text-small text-text dark:text-slate-300">Sesli geri bildirim</span>
              <input type="checkbox" checked={draft.spokenFeedbackEnabled} onChange={(e) => setDraft((d) => ({ ...d, spokenFeedbackEnabled: e.target.checked }))} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            </label>

            <div className="rounded-xl bg-surface-muted p-md">
              <p className="mb-xs font-small text-small font-medium text-text dark:text-slate-300">Örnek komutlar</p>
              <p className="font-label-mono text-label-mono text-text-muted">
                {exampleCommands.take_note[0]} · {exampleCommands.stop_reading[0]} · {exampleCommands.continue_reading[0]} · {exampleCommands.go_home[0]}
              </p>
            </div>

            <p className="font-label-mono text-label-mono leading-relaxed text-text-muted">
              Uyandırma sözcüğü yalnızca uygulama açıkken ve mikrofon izni verildiğinde çalışır;
              tarayıcı arka plandayken veya ekran kilitliyken çalışmayabilir. Bu, tarayıcı tabanlı bir
              özelliktir — sürekli arka plan dinleme yalnızca gelecekteki yerel uygulamada hedeflenmektedir.
            </p>
          </div>

          <div className="flex items-center justify-end gap-sm border-t border-border px-lg py-md">
            <button onClick={onClose} className="rounded-btn px-4 py-2 font-small text-small font-medium text-text-muted hover:bg-surface-muted">İptal</button>
            <button onClick={save} className="rounded-btn bg-primary px-5 py-2 font-small text-small font-medium text-on-primary hover:bg-primary-hover">Kaydet</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
