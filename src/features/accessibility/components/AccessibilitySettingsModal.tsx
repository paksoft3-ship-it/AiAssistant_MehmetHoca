import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';
import type { AccessibilityPreferences } from '../services/accessibilityPreferences';

export interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: AccessibilityPreferences;
  onChange: (prefs: AccessibilityPreferences) => void;
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-md">
      <span>
        <span className="block font-small text-small text-text dark:text-slate-300">{label}</span>
        {hint && <span className="block font-label-mono text-label-mono text-text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none rounded border-border text-primary focus:ring-primary"
      />
    </label>
  );
}

/** Accessibility mode panel (Beta spec §27). Core features stay free in this mode. */
export default function AccessibilitySettingsModal({ isOpen, onClose, prefs, onChange }: AccessibilitySettingsModalProps) {
  if (!isOpen) return null;
  const set = (patch: Partial<AccessibilityPreferences>) => onChange({ ...prefs, ...patch });

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/20 p-md backdrop-blur-md sm:p-lg" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
          className="flex max-h-[92vh] w-full max-w-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-lg py-md">
            <h2 id="a11y-title" className="flex items-center gap-sm font-h3-card-title text-h3-card-title text-on-surface dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon name="accessibility_new" className="text-[20px]" />
              </span>
              Erişilebilirlik
            </h2>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-on-surface" aria-label="Kapat">
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <div className="space-y-lg overflow-y-auto p-lg">
            <Toggle
              label="Erişilebilirlik modunu aç"
              hint="Aşağıdaki ayarları etkinleştirir. Tüm temel okuma ve not özellikleri ücretsiz kalır."
              checked={prefs.enabled}
              onChange={(v) => set({ enabled: v })}
            />
            <hr className="border-border" />
            <fieldset disabled={!prefs.enabled} className={prefs.enabled ? 'space-y-lg' : 'space-y-lg opacity-50'}>
              <Toggle label="Yüksek kontrast" hint="Daha belirgin kenarlıklar ve metin kontrastı." checked={prefs.highContrast} onChange={(v) => set({ highContrast: v })} />
              <Toggle label="Büyük metin" hint="Arayüz yazı boyutunu artırır." checked={prefs.largeText} onChange={(v) => set({ largeText: v })} />
              <Toggle label="Hareketi azalt" hint="Animasyon ve geçişleri kapatır." checked={prefs.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
              <Toggle label="Sesli arayüz ipuçları" hint="Durum değişikliklerini sesli olarak da bildirir." checked={prefs.spokenInterfaceHints} onChange={(v) => set({ spokenInterfaceHints: v })} />
              <Toggle label="Şekilleri otomatik betimle" hint="Yeterli metin olduğunda grafik/şekil açıklaması üretir." checked={prefs.autoDescribeFigures} onChange={(v) => set({ autoDescribeFigures: v })} />
            </fieldset>
            <p className="font-label-mono text-label-mono leading-relaxed text-text-muted">
              Bu uygulama ekran okuyucu desteğinin yerini almaz; cihazınızın ekran okuyucusuyla birlikte çalışır.
            </p>
          </div>

          <div className="flex items-center justify-end border-t border-border px-lg py-md">
            <button onClick={onClose} className="rounded-btn bg-primary px-5 py-2 font-small text-small font-medium text-on-primary hover:bg-primary-hover">Kapat</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
