import { Settings, Volume2, Mic, SlidersHorizontal, Trash2 } from 'lucide-react';
import { SpeechSettings, AppVoice } from '../types';

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

// Helper to rank voices by estimated quality
function rankVoice(voice: AppVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  
  // Prefer natural, neural, online or premium cloud voices
  if (name.includes('natural') || name.includes('neural') || name.includes('online') || name.includes('premium')) {
    score += 500;
  }
  
  if (voice.localService === false) {
    score += 100;
  }

  // Prioritize Turkish high-quality male voices (Tolga/Cem are male, Dilara is premium female)
  if (name.includes('tolga') || name.includes('cem') || name.includes('dilara')) {
    score += 300;
  }
  if (name.includes('male') || name.includes('erkek') || name.includes('man') || name.includes('guy')) {
    score += 150;
  }
  
  if (name.includes('google')) {
    score += 60;
  }
  if (name.includes('siri')) {
    score += 50;
  }
  if (name.includes('microsoft')) {
    score += 40;
  }
  if (name.includes('enhanced')) {
    score += 30;
  }
  if (name.includes('apple')) {
    score += 20;
  }
  
  return score;
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
  
  // Combine all with a much larger limit to ensure zero truncation of premium voices
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
            <h1 className="font-sans font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Sesli Makale Asistanı
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Interaktif Okuma & Not Ortamı
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
              title="Okuma Sesini Değiştir"
              id="voice-select"
            >
              <option value="" disabled>--- Okuyucu Sesi ---</option>
              {displayVoices.map((v) => {
                const nameLower = v.name.toLowerCase();
                const isPremium = nameLower.includes('natural') || 
                                  nameLower.includes('google') || 
                                  nameLower.includes('siri') || 
                                  nameLower.includes('neural') ||
                                  nameLower.includes('premium') ||
                                  nameLower.includes('enhanced');
                
                // Try to identify voice gender/accent
                let genderLabel = '';
                if (nameLower.includes('male') || nameLower.includes('tolga') || nameLower.includes('cem') || nameLower.includes('guy') || nameLower.includes('erkek')) {
                  genderLabel = ' [Erkek - Male]';
                } else if (nameLower.includes('female') || nameLower.includes('yelda') || nameLower.includes('dilara') || nameLower.includes('sibel')) {
                  genderLabel = ' [Kadın - Female]';
                }

                return (
                  <option 
                    key={v.voiceURI} 
                    value={v.voiceURI}
                    className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {isPremium ? '🌟 ' : ''}{v.name}{genderLabel} ({v.lang})
                  </option>
                );
              })}
              {displayVoices.length === 0 && (
                <option value="">Sistem Sesleri Yükleniyor...</option>
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
                <option value="0.75" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">0.75x</option>
                <option value="1" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">1.0x</option>
                <option value="1.0" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">1.0x</option>
                <option value="1.25" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">1.25x</option>
                <option value="1.5" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">1.5x</option>
                <option value="1.75" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">1.75x</option>
                <option value="2" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">2.0x</option>
                <option value="2.0" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">2.0x</option>
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
