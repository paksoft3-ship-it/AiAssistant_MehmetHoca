import { Volume2, Mic, SlidersHorizontal, Trash2 } from 'lucide-react';
import { SpeechSettings, AppVoice } from '../types';
import { PRODUCT } from '../config/product';
import { rankVoice } from '../features/speech/services/voiceRanking';
import { SPEED_OPTIONS, formatSpeedLabel } from '../features/speech/services/speechOptions';

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
}: NavbarProps) {
  // Normalize language tags (e.g., tr-TR, tr_TR -> tr-tr)
  const normalize = (lang: string) => lang.toLowerCase().replace('_', '-');
  const targetLangNorm = normalize(articleLanguage);

  // Filter voices:
  // 1. Precise match to active article language
  const langMatchVoices = [...voices]
    .filter(v => normalize(v.lang) === targetLangNorm || normalize(v.lang).startsWith(targetLangNorm))
    .sort((a, b) => rankVoice(b) - rankVoice(a));
  
  // 2. Turkish fallback (if active article is not Turkish but user wants Turkish option)
  const trVoices = [...voices]
    .filter(v => {
      const vLang = normalize(v.lang);
      const isTr = vLang.startsWith('tr') || vLang.includes('tr');
      const isAlreadyMatched = normalize(v.lang) === targetLangNorm || normalize(v.lang).startsWith(targetLangNorm);
      return isTr && !isAlreadyMatched;
    })
    .sort((a, b) => rankVoice(b) - rankVoice(a));
  
  // 3. Extra major voices
  const extraVoices = [...voices]
    .filter(v => {
      const vLang = normalize(v.lang);
      const isMatched = vLang === targetLangNorm || vLang.startsWith(targetLangNorm);
      const isTr = vLang.startsWith('tr') || vLang.includes('tr');
      return !isMatched && !isTr && (vLang.startsWith('en') || vLang.startsWith('de') || vLang.startsWith('fr') || vLang.startsWith('es') || vLang.startsWith('it'));
    })
    .sort((a, b) => rankVoice(b) - rankVoice(a));
  
  // Show the matched language voices first, then Turkish, then other major languages.
  const displayVoices = [...langMatchVoices, ...trVoices, ...extraVoices].slice(0, 100);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* App Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none">
            <Volume2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg tracking-tight text-ink dark:text-white">
              {PRODUCT.name}
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {PRODUCT.taglineTr}
            </p>
          </div>
        </div>

        {/* Configurations Bar */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Hands Free Helper */}
          <button
            onClick={onHandsFreeToggle}
            className={`flex items-center space-x-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer ${
              isHandsFreeActive
                ? 'bg-red-50 text-red-700 ring-2 ring-red-100 animate-pulse dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
            title="Aralarda 'Dur, not alalım!' dediğinizde sistemi otomatik ses kaydına geçirir."
            id="hands-free-toggle"
          >
            <Mic className={`h-3.5 w-3.5 ${isHandsFreeActive ? 'text-red-600 dark:text-red-400' : ''}`} />
            <span className="hidden sm:inline">
              Hands-free: {isHandsFreeActive ? 'Aktif' : 'Pasif'}
            </span>
            <span className="sm:hidden">
              {isHandsFreeActive ? 'Seste' : 'Sustu'}
            </span>
          </button>

          {/* Voice Engine controls inside a neat trigger */}
          <div className="flex items-center space-x-2 rounded-xl bg-slate-50 p-1 dark:bg-slate-800/60">
            {/* Voice select */}
            <select
              value={settings.voiceURI}
              onChange={(e) => onSettingsChange({ ...settings, voiceURI: e.target.value })}
              className="max-w-[130px] sm:max-w-[200px] bg-transparent pl-2 pr-1 py-1 text-xs font-medium text-slate-700 focus:outline-hidden dark:text-slate-300"
              title="Okuma sesi (cihazınızda yüklü seslere göre değişir)"
              id="voice-select"
            >
              <option value="" disabled>--- Okuyucu Sesi ---</option>
              {displayVoices.map((v) => (
                <option
                  key={v.voiceURI}
                  value={v.voiceURI}
                  className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                >
                  {v.name} ({v.lang})
                </option>
              ))}
              {displayVoices.length === 0 && (
                <option value="">Sistem sesleri yükleniyor...</option>
              )}
            </select>

            {/* Separator */}
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />

            {/* Speed selection */}
            <div className="flex items-center space-x-1 px-1.5" title={`Okuma Hızı: ${settings.rate}x`}>
              <SlidersHorizontal className="h-3 w-3 text-slate-400" />
              <select
                value={String(settings.rate)}
                onChange={(e) => onSettingsChange({ ...settings, rate: parseFloat(e.target.value) })}
                className="bg-transparent py-0.5 text-xs text-slate-600 focus:outline-hidden dark:text-slate-400 cursor-pointer font-medium"
                id="rate-select"
              >
                {SPEED_OPTIONS.map((speed) => (
                  <option
                    key={speed}
                    value={String(speed)}
                    className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {formatSpeedLabel(speed)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clean Article Exit */}
          {hasArticle && onClearArticle && (
            <button
              onClick={onClearArticle}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-200 p-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer dark:border-slate-800 dark:hover:bg-red-950/20"
              title="Makaleyi Kapat ve Ana Menüye Dön"
              id="clear-article-btn"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden md:inline">Kapat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
