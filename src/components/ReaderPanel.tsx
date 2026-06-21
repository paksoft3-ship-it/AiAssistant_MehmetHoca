import { useState, useMemo } from 'react';
import {
  Play, Pause, Square, ChevronLeft, ChevronRight,
  HelpCircle, Sparkles, BookOpen, AlertTriangle,
  Save, LogOut, Check, Activity, RefreshCw, Quote, Search, ChevronUp, ChevronDown
} from 'lucide-react';
import { Article, ParsedLine } from '../types';
import { searchLines } from '../features/reader/services/documentSearch';

interface ReaderPanelProps {
  article: Article;
  isPlaying: boolean;
  currentLineIdx: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSentenceClick: (index: number) => void;
  /** Opens the note editor. Pass the user's selected source text when present. */
  onTriggerNote: (selectedText?: string) => void;
  isHandsFreeActive: boolean;
  isSavedInLibrary?: boolean;
  onSaveToLibrary?: () => void;
  onCloseArticle?: () => void;
  
  // Graph Encounter Props
  activeGraphLine?: ParsedLine | null;
  isAwaitingGraphApproval?: boolean;
  graphSummaryText?: string | null;
  isSummarizingGraph?: boolean;
  graphSpeechRecActive?: boolean;
  approveGraphSummary?: () => void;
  declineGraphSummary?: () => void;

  // Translation Props
  isTranslating?: boolean;
  translationProgress?: string | null;
  onTranslateToTurkish?: (startPage?: number, endPage?: number) => void;

  // Dynamic Original/Translated Toggle variables
  isReadingOriginal?: boolean;
  isTranslated?: boolean;
  onToggleOriginal?: (original: boolean) => void;
}

export default function ReaderPanel({
  article,
  isPlaying,
  currentLineIdx,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onSentenceClick,
  onTriggerNote,
  isHandsFreeActive,
  isSavedInLibrary = false,
  onSaveToLibrary,
  onCloseArticle,
  
  // Destructure Graph Props
  activeGraphLine = null,
  isAwaitingGraphApproval = false,
  graphSummaryText = null,
  isSummarizingGraph = false,
  graphSpeechRecActive = false,
  approveGraphSummary = () => {},
  declineGraphSummary = () => {},

  // Translation Props
  isTranslating = false,
  translationProgress = null,
  onTranslateToTurkish,

  // Dynamic Original/Translated Toggle variables
  isReadingOriginal = false,
  isTranslated = false,
  onToggleOriginal = () => {},
}: ReaderPanelProps) {
  const [currentPageFilter, setCurrentPageFilter] = useState<number>(1);
  const [showOnlyActiveSnippet, setShowOnlyActiveSnippet] = useState<boolean>(true);
  // Exact text the user has selected within the reading viewport (for source-linked notes).
  const [selectedText, setSelectedText] = useState<string>('');
  // In-document search state.
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [matchCursor, setMatchCursor] = useState<number>(0);

  const searchMatches = useMemo(
    () => searchLines(article.lines, searchQuery),
    [article.lines, searchQuery],
  );

  const totalSegments = article.lines.length;
  const readingProgress =
    totalSegments > 0 ? Math.round(((currentLineIdx + 1) / totalSegments) * 100) : 0;

  const gotoMatch = (cursor: number) => {
    if (searchMatches.length === 0) return;
    const wrapped = (cursor + searchMatches.length) % searchMatches.length;
    setMatchCursor(wrapped);
    const match = searchMatches[wrapped];
    setCurrentPageFilter(match.pageNumber);
    onSentenceClick(match.globalIndex);
  };

  // Capture the current selection when the user finishes selecting text in the reader.
  const captureSelection = () => {
    const text = window.getSelection()?.toString().trim() ?? '';
    setSelectedText(text);
  };

  const triggerNoteWithSelection = () => {
    const sel = selectedText.trim();
    onTriggerNote(sel || undefined);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };
  const totalPages = article.pages.length;

  // Custom AI translation range selection states
  const [showTranslateConfig, setShowTranslateConfig] = useState<boolean>(false);
  const [translateRangeType, setTranslateRangeType] = useState<'all' | 'half' | 'quarter' | 'custom'>('all');
  const [customStartPage, setCustomStartPage] = useState<number>(1);
  const [customEndPage, setCustomEndPage] = useState<number>(totalPages);

  const currentLine = useMemo(() => {
    return article.lines[currentLineIdx] || null;
  }, [article.lines, currentLineIdx]);

  // Sync current page filter when voice advances line
  useMemo(() => {
    if (currentLine) {
      setCurrentPageFilter(currentLine.pageNumber);
    }
  }, [currentLine]);

  // Filter sentences visible on current active page
  const visibleLines = useMemo(() => {
    return article.lines.filter(l => l.pageNumber === currentPageFilter);
  }, [article.lines, currentPageFilter]);

  const activeLineInPageIdx = useMemo(() => {
    return visibleLines.findIndex(l => l.globalIndex === currentLineIdx);
  }, [visibleLines, currentLineIdx]);

  // Focused viewport showing only previous, active, and next sentence
  const linesToRender = useMemo(() => {
    if (!showOnlyActiveSnippet) {
      return visibleLines;
    }
    if (visibleLines.length === 0) return [];
    
    if (activeLineInPageIdx === -1) {
      // If the active line is on another page, showcase first 3 sentences of this page
      return visibleLines.slice(0, 3);
    }
    
    const startIdx = Math.max(0, activeLineInPageIdx - 1);
    const endIdx = Math.min(visibleLines.length - 1, activeLineInPageIdx + 1);
    return visibleLines.slice(startIdx, endIdx + 1);
  }, [visibleLines, activeLineInPageIdx, showOnlyActiveSnippet]);

  const hasHiddenBefore = useMemo(() => {
    if (!showOnlyActiveSnippet || visibleLines.length === 0) return false;
    return activeLineInPageIdx > 1;
  }, [showOnlyActiveSnippet, visibleLines, activeLineInPageIdx]);

  const hasHiddenAfter = useMemo(() => {
    if (!showOnlyActiveSnippet || visibleLines.length === 0) return false;
    return activeLineInPageIdx !== -1 && activeLineInPageIdx < visibleLines.length - 2;
  }, [showOnlyActiveSnippet, visibleLines, activeLineInPageIdx]);

  // Compute read progress %
  const readProgress = useMemo(() => {
    if (article.lines.length === 0) return 0;
    return Math.round(((currentLineIdx + 1) / article.lines.length) * 100);
  }, [article.lines.length, currentLineIdx]);

  return (
    <div className="flex h-full flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      
      {/* Article Header Details */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-4.5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-4 w-4" />
              <span>{article.fileType.toUpperCase()} Belge</span>
              <span>•</span>
              <span>{article.fileSize}</span>
              <span>•</span>
              
              {isSavedInLibrary ? (
                <span className="inline-flex items-center space-x-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  <span>KÜTÜPHANEDE KAYITLI (MAKALE #{article.serialNumber})</span>
                </span>
              ) : (
                <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  <span>KÜTÜPHANEYE KAYDEDİLMEDİ</span>
                </span>
              )}
            </div>
            
            <h2 className="font-sans font-bold text-base text-slate-900 line-clamp-2 dark:text-white" title={article.title}>
              {article.title}
            </h2>
          </div>

          {/* Persistent Action Buttons for Saving / Closing */}
          <div className="flex items-center gap-2 self-start flex-wrap mt-2 md:mt-0">
            {!isSavedInLibrary && onSaveToLibrary && (
              <button
                onClick={onSaveToLibrary}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition duration-150 cursor-pointer"
                title="Makaleyi tüm notlarıyla kütüphanenize kaydeder"
                id="header-save-library-btn"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Kütüphaneye Kaydet</span>
              </button>
            )}
            
            {onCloseArticle && (
              <button
                onClick={onCloseArticle}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition duration-150 cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                title={isSavedInLibrary ? "Makaleyi kapatır ve ana sayfaya döner" : "Kütüphaneye kaydetmeden kapatıp siler"}
                id="header-close-btn"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
                <span>{isSavedInLibrary ? 'Kapat & Ana Sayfa' : 'Kaydetmeden Kapat'}</span>
              </button>
            )}
          </div>

        </div>
        
        {/* Language Info badge row only for visual clarity */}
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-dashed border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            {article.language && (
              <div className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span>DİL: {
                  article.language === 'tr' ? 'Türkçe' :
                  article.language === 'en' ? 'English' :
                  article.language === 'de' ? 'Deutsch' :
                  article.language === 'fr' ? 'Français' :
                  article.language === 'es' ? 'Español' :
                  article.language === 'it' ? 'Italiano' :
                  article.language.toUpperCase()
                }</span>
              </div>
            )}
            
            {isReadingOriginal && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 animate-fadeIn">
                Orijinal Metin
              </span>
            )}
          </div>

          {isTranslated && (
            <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 animate-fadeIn">
              <button
                type="button"
                onClick={() => onToggleOriginal(false)}
                className={`px-2.5 py-1 text-3xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  !isReadingOriginal
                    ? 'bg-indigo-600 text-white shadow-xs animate-fadeIn'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Türkçe Çeviri
              </button>
              <button
                type="button"
                onClick={() => onToggleOriginal(true)}
                className={`px-2.5 py-1 text-3xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  isReadingOriginal
                    ? 'bg-amber-600 text-white shadow-xs animate-fadeIn'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Orijinal Metin
              </button>
            </div>
          )}
        </div>

        {article.language !== 'tr' && onTranslateToTurkish && (
          <div className="w-full mt-3 block">
            {!showTranslateConfig && !isTranslating ? (
              <button
                onClick={() => {
                  setCustomEndPage(totalPages);
                  setShowTranslateConfig(true);
                }}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-2xs font-bold transition duration-150 cursor-pointer shadow-xs"
                title="Bu makaleyi Yapay Zeka ile kısmen veya tamamen Türkçeye çevirmek için tıklayın"
                id="translate-to-tr-config-trigger"
              >
                <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300 animate-pulse" />
                <span>Türkçeye Çevir & Türkçe Oku</span>
              </button>
            ) : isTranslating ? (
              <div className="w-full rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-center dark:border-indigo-950/20 dark:bg-indigo-950/10 animate-pulse">
                <div className="flex items-center justify-center space-x-2 text-indigo-600 dark:text-indigo-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-bold tracking-wide">{translationProgress}</span>
                </div>
                <div className="mt-1 text-3xs text-slate-400">Yapay Zeka (Gemini) dil katmanı üzerinde çeviri yapılandırılıyor...</div>
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-extrabold">Yapay Zeka Türkçe Çeviri Seçenekleri</span>
                  </div>
                  <button
                    onClick={() => setShowTranslateConfig(false)}
                    className="text-2xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Kapat
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setTranslateRangeType('all')}
                    className={`rounded-xl border p-2 text-center transition ${
                      translateRangeType === 'all'
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold">100% Tümü</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Tüm Makale</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTranslateRangeType('half')}
                    className={`rounded-xl border p-2 text-center transition ${
                      translateRangeType === 'half'
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold">50% Yarısı</div>
                    <div className="text-[10px] opacity-80 mt-0.5">İlk 50% Sayfa</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTranslateRangeType('quarter')}
                    className={`rounded-xl border p-2 text-center transition ${
                      translateRangeType === 'quarter'
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold">25% Çeyrek</div>
                    <div className="text-[10px] opacity-80 mt-0.5">İlk 25% Sayfa</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTranslateRangeType('custom')}
                    className={`rounded-xl border p-2 text-center transition border-slate-200 dark:border-slate-800 ${
                      translateRangeType === 'custom'
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold">Aralık Seç</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Özel Sayfalar</div>
                  </button>
                </div>

                {translateRangeType === 'custom' && (
                  <div className="mt-4 flex items-center justify-center space-x-4 border-t border-slate-50 pt-3 dark:border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Başlangıç:</label>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={customStartPage}
                        onChange={(e) => setCustomStartPage(Math.min(totalPages, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-bold focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Bitiş:</label>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={customEndPage}
                        onChange={(e) => setCustomEndPage(Math.min(totalPages, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-bold focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <span className="text-2xs text-slate-400">/ toplam {totalPages} sayfa</span>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowTranslateConfig(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      let start = 1;
                      let end = totalPages;
                      if (translateRangeType === 'half') {
                        end = Math.ceil(totalPages * 0.5);
                      } else if (translateRangeType === 'quarter') {
                        end = Math.ceil(totalPages * 0.25);
                      } else if (translateRangeType === 'custom') {
                        start = customStartPage;
                        end = customEndPage;
                      }
                      if (onTranslateToTurkish) {
                        onTranslateToTurkish(start, end);
                      }
                      setShowTranslateConfig(false);
                    }}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 fill-amber-300 text-amber-300 animate-pulse" />
                    <span>Çeviriyi Başlat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pages switcher tabs / bookmarks */}
      <div className="flex items-center space-x-1 border-b border-slate-100 px-4 py-2 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
        <span className="text-2xs font-bold text-slate-400 uppercase tracking-widest mr-2 select-none flex-none">
          Sayfalar:
        </span>
        {article.pages.map((p) => (
          <button
            key={p.pageNumber}
            onClick={() => setCurrentPageFilter(p.pageNumber)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
              currentPageFilter === p.pageNumber
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            S. {p.pageNumber}
          </button>
        ))}
      </div>

      {/* In-document search + reading progress toolbar */}
      <div className="border-b border-slate-100 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setMatchCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchMatches.length > 0) gotoMatch(matchCursor);
              }}
              placeholder="Belge içinde ara..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/40 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              id="document-search-input"
            />
          </div>
          {searchQuery && (
            <div className="flex flex-none items-center gap-1">
              <span className="text-[10px] font-mono text-slate-400">
                {searchMatches.length > 0 ? `${matchCursor + 1}/${searchMatches.length}` : '0/0'}
              </span>
              <button
                onClick={() => gotoMatch(matchCursor - 1)}
                disabled={searchMatches.length === 0}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="Önceki eşleşme"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => gotoMatch(matchCursor + 1)}
                disabled={searchMatches.length === 0}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                title="Sonraki eşleşme"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        {/* Reading progress */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 flex-none">
            Okuma: %{readingProgress}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
              role="progressbar"
              aria-valuenow={readingProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      {/* Main Page Panel Document viewport */}
      <div
        className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/20 relative"
        id="document-reading-viewport"
        onMouseUp={captureSelection}
        onTouchEnd={captureSelection}
      >
        {/* Source-selection action bar — appears when the user highlights text */}
        {selectedText && (
          <div className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur dark:border-indigo-800 dark:bg-slate-900/95">
            <div className="flex min-w-0 items-center gap-2">
              <Quote className="h-3.5 w-3.5 flex-none text-indigo-600" />
              <span className="truncate text-2xs italic text-slate-500 dark:text-slate-400">
                &ldquo;{selectedText}&rdquo;
              </span>
            </div>
            <button
              onClick={triggerNoteWithSelection}
              className="flex-none rounded-lg bg-indigo-600 px-3 py-1.5 text-2xs font-bold text-white transition hover:bg-indigo-700"
            >
              Bu Metne Not Ekle
            </button>
          </div>
        )}
        <div className="mx-auto max-w-2xl min-h-[400px] rounded-xl border border-slate-200/60 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          
          {/* Virtual Top margin metadata */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-2xs font-mono text-slate-400 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span>Sayfa {currentPageFilter} / {totalPages}</span>
              <span>•</span>
              <span>Aktif Satır: {currentLine ? `S. ${currentLine.lineNumber}` : 'Yok'}</span>
            </div>
            
            <button
               onClick={() => setShowOnlyActiveSnippet(!showOnlyActiveSnippet)}
               className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition font-sans cursor-pointer ${
                 showOnlyActiveSnippet
                   ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'
                   : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
               }`}
               id="toggle-focused-view-btn"
               title="Okunacak tüm satırları göstermek yerine sadece aktif satırı, bir öncesini ve bir sonrasını gösterir."
            >
              <span>{showOnlyActiveSnippet ? '👁️ Tüm Sayfayı Göster' : '🎯 Odaklanmış Görünüm'}</span>
            </button>
          </div>

          {/* Interactive lines list */}
          <div className="space-y-4 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
            {hasHiddenBefore && (
              <div 
                onClick={() => setShowOnlyActiveSnippet(false)}
                className="py-2 px-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-xl transition border border-dashed border-slate-200 dark:border-slate-800 mb-2"
                title="Tüm sayfa satırlarını listelemek için tıklayın"
              >
                <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wider hover:text-indigo-600 dark:hover:text-indigo-400 transition select-none">
                  ▲ Yukarıda döküman satırları gizlendi (Tümünü Görmek İçin Tıklayın)
                </span>
              </div>
            )}

            {linesToRender.map((line) => {
              const isActive = currentLineIdx === line.globalIndex;
              const isHeading = !!line.isHeading;
              const isGraph = !!line.isGraph;
              return (
                <div key={line.globalIndex} className="space-y-2">
                  <div
                    onClick={() => onSentenceClick(line.globalIndex)}
                    className={`relative rounded-xl cursor-pointer group select-text transition duration-150 ${
                      isGraph
                        ? isActive
                          ? 'border-2 border-indigo-500 bg-indigo-50/70 p-4 shadow-sm text-indigo-950 font-sans font-extrabold text-base tracking-tight select-text dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700'
                          : 'border border-dashed border-slate-300 hover:bg-slate-50 hover:border-slate-400 p-4 text-slate-700 font-sans font-bold text-base tracking-tight select-text dark:border-slate-700 dark:hover:bg-slate-800/50 dark:text-slate-300'
                        : isHeading
                          ? isActive
                            ? 'bg-indigo-50/90 border-l-4 border-indigo-600 pl-4 py-3 px-3.5 text-indigo-900 shadow-2xs font-sans font-extrabold text-lg tracking-tight mt-6 mb-2 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'hover:bg-slate-50 py-3 px-3.5 mt-6 mb-2 block border-b pb-1.5 border-slate-100 font-sans font-bold text-lg tracking-tight text-slate-900 dark:text-white dark:border-slate-800'
                          : isActive
                            ? 'bg-indigo-50/90 border-l-4 border-indigo-600 pl-4 py-2 px-3 text-slate-950 shadow-2xs font-serif font-medium leading-loose dark:bg-indigo-950/30 dark:text-indigo-100'
                            : 'hover:bg-slate-50 py-2 px-3 block font-serif leading-loose text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Heading or Graph label indicators built to increase professional styling */}
                    {isGraph ? (
                      <div className="flex items-center space-x-1 text-[9px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-sans font-semibold mb-1 select-none">
                        <span>📊 BELGE İÇİ GRAFİK / TABLO</span>
                      </div>
                    ) : isHeading ? (
                      <div className="text-[9px] font-mono uppercase tracking-widest text-indigo-500 font-semibold mb-0.5 select-none">
                        • BAŞLIK
                      </div>
                    ) : null}

                    {/* Sentence text */}
                    <span>{line.text}</span>

                    {/* Marginal line counter */}
                    <span className="absolute -left-10 top-2.5 hidden lg:inline font-mono text-[10px] text-slate-300 group-hover:text-slate-400 select-none">
                      {line.lineNumber}
                    </span>
                  </div>

                  {/* Inline Graph verbal interactive prompt card */}
                  {isActive && isGraph && isAwaitingGraphApproval && (
                    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-850 dark:bg-indigo-950/30 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="rounded-lg bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400">
                          <Activity className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-2.5">
                          <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 leading-snug">
                            Bu grafiğin özetini dinlemek ister misiniz? 
                            {graphSpeechRecActive && (
                              <span className="ml-2 inline-flex items-center text-rose-500 font-bold font-sans text-[10px] animate-pulse">
                                🎙️ SESİNİZ DİNLENİYOR...
                              </span>
                            )}
                          </p>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={approveGraphSummary}
                              disabled={isSummarizingGraph}
                              className="inline-flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 cursor-pointer disabled:opacity-50 transition"
                            >
                              {isSummarizingGraph ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>Özet Hazırlanıyor...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Evet, Özetle</span>
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={declineGraphSummary}
                              disabled={isSummarizingGraph}
                              className="inline-flex items-center space-x-1 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                            >
                              <span>Hayır, Geç</span>
                            </button>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 font-mono leading-tight">
                            Mikrofon aktifken sesli olarak doğrudan <b>"evet"</b>, <b>"özetle"</b> veya <b>"hayır"</b>, <b>"geç"</b> sesli yanıtları verebilirsiniz.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Graph generated summary text block */}
                  {isActive && isGraph && graphSummaryText && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/20 p-4 shadow-sm dark:border-teal-850 dark:bg-teal-950/10 animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold font-sans tracking-widest text-teal-600 dark:text-teal-400 uppercase">
                            📊 YAPAY ZEKA GRAFİK ÖZETİ
                          </span>
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "{graphSummaryText}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {hasHiddenAfter && (
              <div 
                onClick={() => setShowOnlyActiveSnippet(false)}
                className="py-2 px-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-xl transition border border-dashed border-slate-200 dark:border-slate-800 mt-2"
                title="Tüm sayfa satırlarını listelemek için tıklayın"
              >
                <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wider hover:text-indigo-600 dark:hover:text-indigo-400 transition select-none">
                  ▼ Aşağıda döküman satırları gizlendi (Tümünü Görmek İçin Tıklayın)
                </span>
              </div>
            )}
          </div>

          {/* Virtual Bottom margin */}
          <div className="mt-8 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
            <span className="font-mono text-[10px] text-slate-300">--- Sayfa Sonu {currentPageFilter} ---</span>
          </div>
        </div>
      </div>

      {/* Bottom Floating Interactive Assistant HUD Controls */}
      <div className="border-t border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Progress reading bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-2xs font-mono text-slate-400 mb-1">
            <span>OKUMA İLERLEMESİ</span>
            <span>%{readProgress}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
              style={{ width: `${readProgress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Main Media playback controller */}
          <div className="flex items-center justify-center space-x-2">
            
            {/* Previous */}
            <button
              onClick={onPrev}
              disabled={currentLineIdx === 0}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer dark:hover:bg-slate-800"
              title="Önceki Cümle"
              id="media-prev-btn"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Play/Pause toggle */}
            {isPlaying ? (
              <button
                onClick={onPause}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 shadow-xs hover:bg-slate-200 transition duration-150 cursor-pointer dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                title="Okumayı Duraklat"
                id="media-pause-btn"
              >
                <Pause className="h-5.5 w-5.5" />
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition duration-150 cursor-pointer dark:shadow-none"
                title="Sesli Okumayı Başlat"
                id="media-play-btn"
              >
                <Play className="h-5.5 w-5.5 fill-white" />
              </button>
            )}

            {/* Next */}
            <button
              onClick={onNext}
              disabled={currentLineIdx >= article.lines.length - 1}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer dark:hover:bg-slate-800"
              title="Sonraki Cümle"
              id="media-next-btn"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Reset / Stop */}
            <button
              onClick={onStop}
              className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer dark:hover:bg-slate-800"
              title="Okumayı Sıfırla"
              id="media-stop-btn"
            >
              <Square className="h-4 w-4" />
            </button>
          </div>

          {/* MASSIVE INTERRUPT TRIGGER NOTE BUTTON */}
          <button
            onClick={triggerNoteWithSelection}
            className="flex-1 flex max-w-full md:max-w-xs items-center justify-center space-x-2 py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-100 transition duration-240 cursor-pointer hover:scale-102 active:scale-98 animate-pulse dark:shadow-none"
            title="Okumayı durdurur ve sesli notunuzu dinler"
            id="trigger-voice-note-panel"
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-white opacity-90 animate-ping" />
            <span>DUR, NOT ALALIM!</span>
          </button>
        </div>

        {/* Handsfree micro banner status */}
        {isHandsFreeActive && (
          <div className="mt-2.5 flex items-center justify-center space-x-1.5 text-2xs font-medium text-red-500 bg-red-50/50 py-1 rounded-lg dark:bg-red-950/20">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
            <span>Sistem kelimelerinizi dinliyor: Kulaklık kullanmanız önerilir</span>
          </div>
        )}
      </div>

      {/* Yapay Zeka translation workflow overlay blocker */}
      {isTranslating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95 p-6 text-center backdrop-blur-xs animate-in fade-in duration-200">
          <div className="rounded-2xl bg-indigo-50 p-4 mb-4 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
            Yapay Zeka Makaleyi Türkçeye Çeviriyor
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm font-sans">
            {translationProgress}
          </p>
          <div className="mt-4 text-2xs font-mono text-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/30 dark:bg-indigo-950/25 dark:border-indigo-900/30">
            Süper akıcı, akademik ve anlaşılır Türkçe dil modeli aktif...
          </div>
        </div>
      )}
    </div>
  );
}
