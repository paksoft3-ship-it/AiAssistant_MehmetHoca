import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';
import { PRODUCT } from '../../../config/product';
import { HOW_IT_WORKS_STEPS, buildHowItWorksScript } from '../services/howItWorksSteps';

export interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Speaks the given text aloud, invoking `onEnd` when playback finishes or is
   * cancelled. Provided by the host so the read-aloud honours the user's chosen
   * voice/speed. When omitted, the read-aloud control is hidden (no TTS).
   */
  onSpeak?: (text: string, onEnd: () => void) => void;
  onStopSpeak?: () => void;
}

/**
 * Accessible "Nasıl Çalışır?" (How It Works) guide.
 *
 * Beyond the visual step list it supports the accessibility / hands-free use
 * cases from CLAUDE.md: the whole guide can be read aloud ("Sesli Dinle"), the
 * dialog is keyboard reachable (Esc to close, focus moved in on open and
 * restored on close), and it is announced as a modal dialog to screen readers.
 */
export default function HowItWorksModal({ isOpen, onClose, onSpeak, onStopSpeak }: HowItWorksModalProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Move focus into the dialog on open and restore it to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // Esc closes the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Stop any in-flight narration when the dialog closes.
  useEffect(() => {
    if (!isOpen && isSpeaking) {
      onStopSpeak?.();
      setIsSpeaking(false);
    }
  }, [isOpen, isSpeaking, onStopSpeak]);

  if (!isOpen) return null;

  const handleReadAloud = () => {
    if (!onSpeak) return;
    if (isSpeaking) {
      onStopSpeak?.();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    onSpeak(buildHowItWorksScript(), () => setIsSpeaking(false));
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/20 p-md backdrop-blur-md sm:p-lg"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
          className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-surface px-lg py-md dark:bg-slate-900">
            <h2 id="how-it-works-title" className="flex items-center gap-sm font-h3-card-title text-h3-card-title text-on-surface dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon name="menu_book" className="text-[20px]" />
              </span>
              {PRODUCT.name} Nasıl Çalışır?
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-on-surface"
              aria-label="Kapat"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          {/* Read-aloud control */}
          {onSpeak && (
            <div className="flex items-center justify-between gap-sm border-b border-border bg-surface-muted px-lg py-sm">
              <p className="font-small text-small text-text-muted">
                Bakmadan dinlemek ister misiniz? Adımları sesli olarak okuyalım.
              </p>
              <button
                onClick={handleReadAloud}
                aria-pressed={isSpeaking}
                className="inline-flex flex-none items-center gap-1.5 rounded-btn bg-primary px-3 py-2 font-small text-small font-medium text-on-primary transition-colors hover:bg-primary-hover"
              >
                <Icon name={isSpeaking ? 'stop' : 'volume_up'} className="text-[18px]" />
                {isSpeaking ? 'Durdur' : 'Sesli Dinle'}
              </button>
            </div>
          )}

          {/* Steps */}
          <ol className="flex-1 space-y-md overflow-y-auto p-lg">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-md">
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-soft font-bold text-primary"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="flex items-center gap-1.5 font-small text-small font-bold text-on-surface dark:text-white">
                    <Icon name={step.icon} className="text-[18px] text-text-muted" />
                    {step.title}
                  </h3>
                  <p className="mt-0.5 font-small text-small text-text-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-border px-lg py-md">
            <button
              onClick={onClose}
              className="rounded-btn bg-primary px-5 py-2 font-small text-small font-medium text-on-primary transition-colors hover:bg-primary-hover"
            >
              Başlayalım
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
