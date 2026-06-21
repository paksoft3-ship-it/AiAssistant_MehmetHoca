import { SpeechSettings, AppVoice } from '../types';
import { PRODUCT } from '../config/product';
import { rankVoice } from '../features/speech/services/voiceRanking';
import { SPEED_OPTIONS, formatSpeedLabel } from '../features/speech/services/speechOptions';
import { Icon } from './ui/Icon';

interface NavbarProps {
  voices: AppVoice[];
  settings: SpeechSettings;
  onSettingsChange: (settings: SpeechSettings) => void;
  isHandsFreeActive: boolean;
  onHandsFreeToggle: () => void;
  hasArticle: boolean;
  onClearArticle?: () => void;
  articleTitle?: string;
  articleLanguage?: string;
  // Playback (reader mode) — rendered in the top bar centre, matching the design.
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onStop?: () => void;
}

export default function Navbar({
  voices,
  settings,
  onSettingsChange,
  isHandsFreeActive,
  onHandsFreeToggle,
  hasArticle,
  onClearArticle,
  articleTitle,
  articleLanguage = 'tr',
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onStop,
}: NavbarProps) {
  const normalize = (lang: string) => lang.toLowerCase().replace('_', '-');
  const targetLangNorm = normalize(articleLanguage);

  const langMatchVoices = [...voices]
    .filter((v) => normalize(v.lang) === targetLangNorm || normalize(v.lang).startsWith(targetLangNorm))
    .sort((a, b) => rankVoice(b) - rankVoice(a));
  const trVoices = [...voices]
    .filter((v) => {
      const vLang = normalize(v.lang);
      const isTr = vLang.startsWith('tr');
      const matched = vLang === targetLangNorm || vLang.startsWith(targetLangNorm);
      return isTr && !matched;
    })
    .sort((a, b) => rankVoice(b) - rankVoice(a));
  const extraVoices = [...voices]
    .filter((v) => {
      const vLang = normalize(v.lang);
      const matched = vLang === targetLangNorm || vLang.startsWith(targetLangNorm);
      const isTr = vLang.startsWith('tr');
      return !matched && !isTr && ['en', 'de', 'fr', 'es', 'it'].some((p) => vLang.startsWith(p));
    })
    .sort((a, b) => rankVoice(b) - rankVoice(a));
  const displayVoices = [...langMatchVoices, ...trVoices, ...extraVoices].slice(0, 100);

  // Compact "trigger-style" select used in the top bar.
  const triggerSelect =
    'appearance-none bg-transparent text-sm text-text-muted hover:text-primary-hover focus:text-text focus:outline-none cursor-pointer max-w-[160px] truncate';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-lg py-md">
        {/* Brand */}
        <div className="flex items-center gap-md">
          <img alt="EidosUs" src="/logo.png" className="h-8 w-8 rounded-lg object-contain" />
          <div className="flex flex-col">
            <span className="font-h1-page-title text-h1-page-title text-primary tracking-tight leading-none">
              {PRODUCT.name}
            </span>
            <span className="font-label-mono text-label-mono text-text-muted dark:text-slate-400">
              {PRODUCT.taglineTr}
            </span>
          </div>
          {hasArticle && articleTitle && (
            <>
              <div className="mx-sm hidden h-6 w-px bg-border md:block" />
              <span className="hidden max-w-[260px] truncate text-sm font-medium text-text dark:text-slate-300 md:inline">
                {articleTitle}
              </span>
            </>
          )}
        </div>

        {/* Centre: playback controls (reader mode) */}
        {hasArticle && onPlay && (
          <div className="flex items-center justify-center gap-sm">
            <button onClick={onPrev} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted" title="Önceki Cümle">
              <Icon name="skip_previous" />
            </button>
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm transition-colors hover:bg-primary-hover"
              title="Oynat / Duraklat"
            >
              <Icon name={isPlaying ? 'pause' : 'play_arrow'} className="text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }} />
            </button>
            <button onClick={onNext} className="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted" title="Sonraki Cümle">
              <Icon name="skip_next" />
            </button>
            <button onClick={onStop} className="ml-sm flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted" title="Durdur">
              <Icon name="stop" />
            </button>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-lg">
          {/* Marketing nav (landing only) */}
          {!hasArticle && (
            <nav className="hidden items-center gap-lg text-body-ui md:flex">
              <a href="#library" className="text-text-muted transition-colors hover:text-primary">Kütüphane</a>
              <a href="#how" className="text-text-muted transition-colors hover:text-primary">Nasıl Çalışır</a>
              <a href="#faq" className="text-text-muted transition-colors hover:text-primary">SSS</a>
            </nav>
          )}

          <div className="hidden h-6 w-px bg-border md:block" />

          {/* Voice selector */}
          <div className="flex items-center gap-sm" title="Okuma sesi (cihazınızdaki seslere bağlıdır)">
            <Icon name="record_voice_over" className="text-[18px] text-text-muted" />
            <select
              value={settings.voiceURI}
              onChange={(e) => onSettingsChange({ ...settings, voiceURI: e.target.value })}
              className={triggerSelect}
            >
              <option value="" disabled>Okuyucu Sesi</option>
              {displayVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
              ))}
              {displayVoices.length === 0 && <option value="">Sesler yükleniyor…</option>}
            </select>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-sm" title="Okuma hızı">
            <Icon name="speed" className="text-[18px] text-text-muted" />
            <select
              value={String(settings.rate)}
              onChange={(e) => onSettingsChange({ ...settings, rate: parseFloat(e.target.value) })}
              className={triggerSelect}
            >
              {SPEED_OPTIONS.map((s) => (
                <option key={s} value={String(s)}>{formatSpeedLabel(s)}</option>
              ))}
            </select>
          </div>

          {hasArticle ? (
            <>
              {/* Hands-free toggle */}
              <button
                onClick={onHandsFreeToggle}
                className={`hidden items-center gap-sm rounded-full px-3 py-1.5 text-sm font-medium transition-all sm:flex ${
                  isHandsFreeActive
                    ? 'bg-danger-soft text-danger ring-1 ring-danger/20'
                    : 'bg-surface-muted text-text-muted hover:text-primary'
                }`}
                title="Eller serbest sesli komut"
              >
                <Icon name="mic" className="text-[18px]" />
                {isHandsFreeActive ? 'Dinleniyor' : 'Eller Serbest'}
              </button>
              {/* Close */}
              {onClearArticle && (
                <button
                  onClick={onClearArticle}
                  className="flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:border-danger/30 hover:bg-danger-soft hover:text-danger"
                  title="Belgeyi kapat"
                >
                  <Icon name="close" className="text-[18px]" />
                  <span className="hidden md:inline">Kapat</span>
                </button>
              )}
            </>
          ) : (
            <a
              href="#waitlist"
              className="ml-sm rounded-btn bg-primary px-4 py-2 font-medium text-on-primary transition-colors hover:bg-primary-hover"
            >
              Beta'ya Katıl
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
