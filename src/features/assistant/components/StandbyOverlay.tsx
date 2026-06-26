import { useEffect } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';

export interface StandbyOverlayProps {
  isOpen: boolean;
  onExit: () => void;
  assistantName: string;
  documentTitle?: string;
  positionLabel?: string;
  isPlaying: boolean;
  /** Whether hands-free listening is currently active. */
  isListening: boolean;
}

/**
 * Standby interface (Beta spec §16). This is NOT true OS background mode — it is
 * a dimmed, low-distraction screen that keeps the web page active. The honest
 * limitation messaging is part of the UI, not buried elsewhere.
 */
export default function StandbyOverlay({
  isOpen,
  onExit,
  assistantName,
  documentTitle,
  positionLabel,
  isPlaying,
  isListening,
}: StandbyOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onExit]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bekleme modu"
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-slate-950 px-6 text-center text-slate-200"
      >
        {/* Listening status */}
        <div className="flex flex-col items-center gap-3">
          <span
            className={`flex h-24 w-24 items-center justify-center rounded-full ${
              isListening ? 'bg-red-500/15 ring-2 ring-red-500/40' : 'bg-white/5 ring-1 ring-white/10'
            }`}
          >
            <Icon
              name={isListening ? 'mic' : 'mic_off'}
              className={`text-[44px] ${isListening ? 'animate-pulse text-red-400' : 'text-slate-500'}`}
            />
          </span>
          <p className="font-label-mono text-label-mono uppercase tracking-widest text-slate-400">
            {isListening ? `${assistantName} dinliyor` : 'Mikrofon kapalı'}
          </p>
        </div>

        {/* Current document + position */}
        <div className="flex flex-col items-center gap-1">
          <h2 className="max-w-xl text-2xl font-semibold text-white">{documentTitle || 'Belge yok'}</h2>
          <p className="font-small text-small text-slate-400">
            {isPlaying ? 'Dinleniyor' : 'Duraklatıldı'}
            {positionLabel ? ` · ${positionLabel}` : ''}
          </p>
        </div>

        {/* Exit */}
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20"
        >
          <Icon name="close_fullscreen" className="text-[20px]" />
          Bekleme Modundan Çık
        </button>

        {/* Honest limitations (Beta spec §16, §5 P3) */}
        <p className="max-w-md font-label-mono text-label-mono leading-relaxed text-slate-500">
          Bekleme modu yalnızca bu sayfa açıkken çalışır. Tarayıcı arka plana alındığında veya ekran
          kilitlendiğinde dinleme cihaz/tarayıcıya bağlı olarak durabilir. Sürekli mikrofon kullanımı
          pil tüketimini artırır.
        </p>
      </div>
    </Portal>
  );
}
