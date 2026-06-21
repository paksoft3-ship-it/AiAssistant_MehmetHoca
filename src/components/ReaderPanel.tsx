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
    <div className="relative mx-auto flex h-full w-full max-w-[820px] flex-col overflow-hidden border-x border-border bg-surface dark:bg-slate-900 dark:border-slate-800">
      
      {/* Article Header Details */}
      {(isTranslated || (article.language !== 'tr' && onTranslateToTurkish)) && (
      <div className="border-b border-border bg-surface px-6 py-2.5">
        {isTranslated && (
          <div className="mb-2 flex items-center justify-end gap-2">
            {isReadingOriginal && (
              <span className="mr-auto rounded-full bg-warning-soft px-2 py-0.5 font-label-mono text-label-mono text-warning">Orijinal Metin</span>
            )}
            <div className="flex rounded-lg bg-surface-muted p-0.5">
              <button onClick={() => onToggleOriginal(false)} className={`rounded-md px-2.5 py-1 font-small text-small font-medium transition ${!isReadingOriginal ? 'bg-surface text-primary shadow-sm' : 'text-text-muted'}`}>Türkçe</button>
              <button onClick={() => onToggleOriginal(true)} className={`rounded-md px-2.5 py-1 font-small text-small font-medium transition ${isReadingOriginal ? 'bg-surface text-warning shadow-sm' : 'text-text-muted'}`}>Orijinal</button>
            </div>
          </div>
        )}

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
      )}

      {/* Toolbar: page tabs + search + progress (merged, design style) */}
      <div className="flex items-center space-x-1 border-b border-border bg-surface px-4 py-2 overflow-x-auto dark:bg-slate-900">
        <span className="mr-2 flex-none select-none font-label-mono text-label-mono uppercase text-text-muted">
          Sayfalar:
        </span>
        {article.pages.map((p) => (
          <button
            key={p.pageNumber}
            onClick={() => setCurrentPageFilter(p.pageNumber)}
            className={`rounded-md px-3 py-1 font-label-mono text-label-mono transition ${
              currentPageFilter === p.pageNumber
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-text-muted hover:bg-surface-muted'
            }`}
          >
            S. {p.pageNumber}
          </button>
        ))}
      </div>

      {/* In-document search + reading progress toolbar */}
      <div className="border-b border-border bg-surface px-4 py-2 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-text-muted" />
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
              className="w-full rounded-lg border border-border bg-canvas py-1.5 pl-8 pr-3 font-body-ui text-body-ui text-text focus:border-focus-ring focus:outline-none focus:ring-1 focus:ring-focus-ring dark:bg-slate-950 dark:text-slate-200"
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
          <span className="flex-none font-label-mono text-label-mono text-text-muted">
            Okuma: %{readingProgress}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full bg-primary transition-all duration-300"
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
        className="relative flex-1 overflow-y-auto bg-surface px-10 py-8 pb-32 dark:bg-slate-900"
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
        <div className="mx-auto min-h-[400px] max-w-[65ch]">

          {/* Virtual Top margin metadata */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 font-label-mono text-label-mono text-text-muted">
            <div className="flex items-center space-x-2">
              <span>Sayfa {currentPageFilter} / {totalPages}</span>
              <span>•</span>
              <span>Aktif Satır: {currentLine ? `S. ${currentLine.lineNumber}` : 'Yok'}</span>
            </div>

            <button
               onClick={() => setShowOnlyActiveSnippet(!showOnlyActiveSnippet)}
               className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 font-small text-small font-medium transition ${
                 showOnlyActiveSnippet
                   ? 'border border-primary/20 bg-primary-soft text-primary'
                   : 'border border-border bg-surface-muted text-text-muted hover:bg-surface-container'
               }`}
               id="toggle-focused-view-btn"
               title="Okunacak tüm satırları göstermek yerine sadece aktif satırı, bir öncesini ve bir sonrasını gösterir."
            >
              <span>{showOnlyActiveSnippet ? '👁️ Tüm Sayfayı Göster' : '🎯 Odaklanmış Görünüm'}</span>
            </button>
          </div>

          {/* Interactive lines list */}
          <div className="space-y-4 text-slate-800 dark:text-slate-200 text-[17px] leading-relaxed">
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
                    className={`group relative cursor-pointer rounded-r-lg transition duration-150 ${
                      isGraph
                        ? isActive
                          ? 'rounded-xl border-2 border-primary bg-primary-soft p-4 font-h3-card-title text-h3-card-title text-primary'
                          : 'rounded-xl border border-dashed border-outline-variant p-4 font-h3-card-title text-h3-card-title text-text-muted hover:bg-surface-muted'
                        : isHeading
                          ? isActive
                            ? 'mt-6 mb-2 border-l-4 border-primary bg-primary-soft py-3 pl-4 pr-3.5 font-serif font-bold text-h1-page-title text-deep-navy'
                            : 'mt-6 mb-2 block border-b border-border py-3 px-3.5 pb-1.5 font-serif font-bold text-h1-page-title text-deep-navy hover:bg-surface-muted dark:text-white'
                          : isActive
                            ? 'border-l-4 border-primary bg-primary-soft py-3 pl-4 pr-3.5 font-body-reading text-body-reading text-on-surface'
                            : 'block py-2 px-3 font-body-reading text-body-reading text-on-surface hover:bg-surface-muted dark:text-slate-200'
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

      {/* Floating "DUR, NOT ALALIM!" pill (playback now lives in the top bar) */}
      <button
        onClick={triggerNoteWithSelection}
        className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-danger/20 bg-danger px-6 py-3 font-h3-card-title text-h3-card-title uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        title="Okumayı durdurur ve notunuzu kaydeder"
        id="trigger-voice-note-panel"
      >
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span>DUR, NOT ALALIM!</span>
      </button>
      {isHandsFreeActive && (
        <div className="absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 font-small text-small text-danger">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" />
          Sistem kelimelerinizi dinliyor
        </div>
      )}


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
