import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent, DragEvent, type ReactNode } from 'react';
import {
  FileText, Upload, Mic, Trash2, ArrowRight, Activity,
  Sparkles, BookOpen, AlertCircle, Info, ShieldCheck, Search, NotebookPen
} from 'lucide-react';

import { Article } from './types';
import type { ResearchNote, SourceAnchor } from './types/domain';
import { parseFile, compilePagesAndLines, formatFileSize } from './utils/documentParser';
import { useSpeechEngine } from './hooks/useSpeechEngine';

import { useLibrary } from './features/documents/hooks/useLibrary';
import { documentService } from './features/documents/services/documentService';
import { useResearchNotes } from './features/notes/hooks/useResearchNotes';
import { buildSourceAnchor } from './features/notes/services/sourceAnchor';
import { requestCleanNote } from './features/notes/services/aiNoteCleaning';
import { translateText, translateBatch } from './features/translation/services/translationService';
import {
  searchLibrary,
  filterByLanguage,
  sortLibrary,
  listLanguages,
  type LibrarySortKey,
} from './features/library/services/libraryQueries';
import { resetAllData, PREF_KEYS } from './db/reset';
import { PRODUCT } from './config/product';
import { featureFlags } from './config/featureFlags';

// Subcomponents
import Navbar from './components/Navbar';
import ReaderPanel from './components/ReaderPanel';
import ResearchNotesPanel from './features/notes/components/ResearchNotesPanel';
import NoteEditorModal, { type NoteEditorSaveData } from './features/notes/components/NoteEditorModal';
import ExportDialog from './features/export/components/ExportDialog';

// High Craft Premium Turkish Sample Article Content for testing out of the box
const SAMPLE_ARTICLE: Article = {
  id: 'academic-demo-artificial-intelligence',
  title: 'Yapay Zeka Destekli Kişiselleştirilmiş Eğitimin Geleceği',
  fileName: 'yapay_zeka_ve_mufredat_analizi.pdf (Örnek Makale)',
  fileSize: '42.8 KB',
  fileType: 'pdf',
  text: 'Yapay zeka sistemleri eğitimde fırsat eşitliği için yeni pencereler açmaktadır. Bu sayede her birey kendi öğrenme hızına en uygun müfredata kavuşabilir.',
  language: 'tr',
  pages: [
    {
      pageNumber: 1,
      text: "Yapay zeka teknolojilerinin eğitim sistemlerine entegrasyonu, kişiselleştirilmiş öğrenme deneyimini yeni bir boyuta taşımaktadır. Geleneksel sınıf yöntemlerinde her öğrencinin farklı hızlarda öğrenmesi odağın dağılmasına yol açabilmektedir. Oysa yapay zeka destekli akıllı öğrenme sistemleri, her bir öğrencinin güçlü ve zayıf yönlerini anlık olarak tespit ederek müfredatı ona göre uyarlayabilir.",
      lines: [
        "Yapay zeka teknolojilerinin eğitim sistemlerine entegrasyonu, kişiselleştirilmiş öğrenme deneyimini yeni bir boyuta taşımaktadır.",
        "Geleneksel sınıf yöntemlerinde her öğrencinin farklı hızlarda öğrenmesi odağın dağılmasına yol açabilmektedir.",
        "Oysa yapay zeka destekli akıllı öğrenme sistemleri, her bir öğrencinin güçlü ve zayıf yönlerini anlık olarak tespit ederek müfredatı ona göre uyarlayabilir."
      ]
    },
    {
      pageNumber: 2,
      text: "Makalenin ikinci sayfasındaki analizlere göre, adaptif öğrenme yazılımları kullanan sınıflarda genel başarı ortalaması %24 oranında artış göstermiştir. Bu durum öğretmenlerin de idari ve rutin iş yüklerini hafifleterek doğrudan öğrencilerle kaliteli zaman geçirmelerine olanak tanımaktadır. Öğretmenler ders hazırlığı veya ödev kontrolü yerine doğrudan mentorluk süreçlerine odaklanabilmektedirler. Grafik 1: Adaptif Öğrenme Sistemlerinin Sınıf İçi Başarı Oranına Etkisi.",
      lines: [
        "Makalenin ikinci sayfasındaki analizlere göre, adaptif öğrenme yazılımları kullanan sınıflarda genel başarı ortalaması %24 oranında artış göstermiştir.",
        "Bu durum öğretmenlerin de idari ve rutin iş yüklerini hafifleterek doğrudan öğrencilerle kaliteli zaman geçirmelerine olanak tanımaktadır.",
        "Öğretmenler ders hazırlığı veya ödev kontrolü yerine doğrudan mentorluk süreçlerine odaklanabilmektedirler.",
        "Grafik 1: Adaptif Öğrenme Sistemlerinin Sınıf İçi Başarı Oranına Etkisi."
      ]
    },
    {
      pageNumber: 3,
      text: "Akıllı eğitim asistanlarının diğer önemli bir boyutu ise engelsiz erişim imkanları sunmasıdır. Görme engelli bir öğrenci için görsellerin sesli betimlenmesi veya işitme engelli bir öğrenci için canlı altyazı desteği gibi akıllı asistan araçları eğitimde fırsat eşitliğini tam olarak hayata geçirebilir.",
      lines: [
        "Akıllı eğitim asistanlarının diğer önemli bir boyutu ise engelsiz erişim imkanları sunmasıdır.",
        "Görme engelli bir öğrenci için görsellerin sesli betimlenmesi veya işitme engelli bir öğrenci için canlı altyazı desteği gibi akıllı asistan araçları eğitimde fırsat eşitliğini tam olarak hayata geçirebilir."
      ]
    },
    {
      pageNumber: 4,
      text: "Gelecekte yapay zekanın rolü sadece yardımcı araç olmaktan çıkıp aktif bir öğrenme ortağı olmaya doğru evrilecektir. Kuantum bilgisayarlar ve büyük dil modellerinin ortaklaşa çalışmasıyla, her bireyin kendi hızında uzmanlaşabileceği küresel ve erişilebilir bir akademi kurulması hayal olmaktan uzak görünmektedir.",
      lines: [
        "Gelecekte yapay zekanın rolü sadece yardımcı araç olmaktan çıkıp aktif bir öğrenme ortağı olmaya doğru evrilecektir.",
        "Kuantum bilgisayarlar ve büyük dil modellerinin ortaklaşa çalışmasıyla, her bireyin kendi hızında uzmanlaşabileceği küresel ve erişilebilir bir akademi kurulması hayal olmaktan uzak görünmektedir."
      ]
    }
  ],
  lines: [
    { text: "Yapay zeka teknolojilerinin eğitim sistemlerine entegrasyonu, kişiselleştirilmiş öğrenme deneyimini yeni bir boyuta taşımaktadır.", pageNumber: 1, lineNumber: 1, globalIndex: 0 },
    { text: "Geleneksel sınıf yöntemlerinde her öğrencinin farklı hızlarda öğrenmesi odağın dağılmasına yol açabilmektedir.", pageNumber: 1, lineNumber: 2, globalIndex: 1 },
    { text: "Oysa yapay zeka destekli akıllı öğrenme sistemleri, her bir öğrencinin güçlü ve zayıf yönlerini anlık olarak tespit ederek müfredatı ona göre uyarlayabilir.", pageNumber: 1, lineNumber: 3, globalIndex: 2 },

    { text: "Makalenin ikinci sayfasındaki analizlere göre, adaptif öğrenme yazılımları kullanan sınıflarda genel başarı ortalaması %24 oranında artış göstermiştir.", pageNumber: 2, lineNumber: 1, globalIndex: 3 },
    { text: "Bu durum öğretmenlerin de idari ve rutin iş yüklerini hafifleterek doğrudan öğrencilerle kaliteli zaman geçirmelerine olanak tanımaktadır.", pageNumber: 2, lineNumber: 2, globalIndex: 4 },
    { text: "Öğretmenler ders hazırlığı veya ödev kontrolü yerine doğrudan mentorluk süreçlerine odaklanabilmektedirler.", pageNumber: 2, lineNumber: 3, globalIndex: 5 },
    { text: "Grafik 1: Adaptif Öğrenme Sistemlerinin Sınıf İçi Başarı Oranına Etkisi.", pageNumber: 2, lineNumber: 4, globalIndex: 6, isHeading: true, isGraph: true },

    { text: "Akıllı eğitim asistanlarının diğer önemli bir boyutu ise engelsiz erişim imkanları sunmasıdır.", pageNumber: 3, lineNumber: 1, globalIndex: 7 },
    { text: "Görme engelli bir öğrenci için görsellerin sesli betimlenmesi veya işitme engelli bir öğrenci için canlı altyazı desteği gibi akıllı asistan araçları eğitimde fırsat eşitliğini tam olarak hayata geçirebilir.", pageNumber: 3, lineNumber: 2, globalIndex: 8 },

    { text: "Gelecekte yapay zekanın rolü sadece yardımcı araç olmaktan çıkıp aktif bir öğrenme ortağı olmaya doğru evrilecektir.", pageNumber: 4, lineNumber: 1, globalIndex: 9 },
    { text: "Kuantum bilgisayarlar ve büyük dil modellerinin ortaklaşa çalışmasıyla, her bireyin kendi hızında uzmanlaşabileceği küresel ve erişilebilir bir akademi kurulması hayal olmaktan uzak görünmektedir.", pageNumber: 4, lineNumber: 2, globalIndex: 10 }
  ]
};

export default function App() {
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingPercent, setParsingPercent] = useState(0);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<string | null>(null);
  const [isReadingOriginal, setIsReadingOriginal] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  // Library controls (dashboard).
  const [librarySearch, setLibrarySearch] = useState('');
  const [librarySort, setLibrarySort] = useState<LibrarySortKey>('recent');
  const [libraryLang, setLibraryLang] = useState('');
  // Mobile panel switch (reader vs notes) — both show side-by-side on desktop.
  const [mobileTab, setMobileTab] = useState<'reader' | 'notes'>('reader');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Holds the exact text the user selected when triggering a note (null = use active line).
  const pendingSelectionRef = useRef<string | null>(null);

  // IndexedDB-backed library + notes for the active document.
  const { entries: libraryEntries, saveArticle, openArticle, removeDocument, reload: reloadLibrary } = useLibrary();
  const { notes, addNote, updateNote, deleteNote } = useResearchNotes(activeArticle?.id ?? null);

  // Reset read-mode defaults when active article shifts
  useEffect(() => {
    setIsReadingOriginal(false);
  }, [activeArticle?.id]);

  // Restore the last-opened document on startup (session continuity across reload).
  useEffect(() => {
    const lastId = typeof localStorage !== 'undefined' ? localStorage.getItem(PREF_KEYS.lastActiveDocument) : null;
    if (!lastId) return;
    let cancelled = false;
    void documentService.openArticle(lastId).then((article) => {
      if (!cancelled && article) setActiveArticle(article);
    });
    return () => { cancelled = true; };
  }, []);

  // Refresh library (and note counts) whenever we return to the dashboard.
  useEffect(() => {
    if (!activeArticle) void reloadLibrary();
  }, [activeArticle, reloadLibrary]);

  const rememberActive = (id: string | null) => {
    if (typeof localStorage === 'undefined') return;
    if (id) localStorage.setItem(PREF_KEYS.lastActiveDocument, id);
    else localStorage.removeItem(PREF_KEYS.lastActiveDocument);
  };

  // --- DOCUMENT PARSING PIPELINE ---
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParsingPercent(0);
    setParsingError(null);

    try {
      const parsed = await parseFile(file, (percent) => setParsingPercent(percent));
      await saveArticle(parsed, 'upload');
      setActiveArticle(parsed);
      rememberActive(parsed.id);
    } catch (err: any) {
      console.error(err);
      setParsingError(err.message || 'Dosya çözümlenirken bilinmeyen bir hata oluştu.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleInputFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  };

  const handleDragOver = (e: DragEvent) => e.preventDefault();
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  };

  const handleLoadSample = async () => {
    await saveArticle(SAMPLE_ARTICLE, 'sample');
    setActiveArticle(SAMPLE_ARTICLE);
    rememberActive(SAMPLE_ARTICLE.id);
    setParsingError(null);
  };

  // --- LIBRARY ACTIONS ---
  const handleOpenFromLibrary = async (documentId: string) => {
    const article = await openArticle(documentId);
    if (article) {
      setActiveArticle(article);
      rememberActive(article.id);
      setParsingError(null);
    }
  };

  const handleRemoveFromLibrary = async (documentId: string) => {
    await removeDocument(documentId);
    if (activeArticle?.id === documentId) {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      setActiveArticle(null);
      rememberActive(null);
    }
  };

  const handleCloseArticle = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setActiveArticle(null);
    rememberActive(null);
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      'Tüm yerel verileriniz (belgeler ve notlar) kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?',
    );
    if (!confirmed) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    await resetAllData({ includeLegacy: true });
    setActiveArticle(null);
    rememberActive(null);
    await reloadLibrary();
  };

  // --- TRANSLATION (in-memory for this session; base document stays original) ---
  const handleTranslateToTurkish = async (startPage?: number, endPage?: number) => {
    if (!activeArticle) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();

    setIsTranslating(true);
    setTranslationProgress('Başlık Türkçeye çevriliyor...');

    try {
      const titleResult = await translateText(activeArticle.title);
      const translatedTitle = titleResult.value;
      const titleTranslatedSuccessfully = !titleResult.isFallback;

      const sPage = startPage || 1;
      const ePage = endPage || activeArticle.pages.length;
      const pagesToTranslate = activeArticle.pages.map((page) => ({
        ...page,
        isWithinRange: page.pageNumber >= sPage && page.pageNumber <= ePage,
      }));

      const chunkBatchSize = 5;
      const translatedPagesText: string[] = [];
      let anyPageTranslatedSuccessfully = false;

      for (let i = 0; i < pagesToTranslate.length; i += chunkBatchSize) {
        const currentBatch = pagesToTranslate.slice(i, i + chunkBatchSize);
        const activeBatch = currentBatch.filter((p) => p.isWithinRange);

        if (activeBatch.length > 0) {
          const startNum = activeBatch[0].pageNumber;
          const endNum = activeBatch[activeBatch.length - 1].pageNumber;
          setTranslationProgress(`Sayfalar [${startNum}-${endNum}] çevriliyor...`);
          const batchResult = await translateBatch(activeBatch.map((p) => p.text));
          if (!batchResult.isFallback) {
            anyPageTranslatedSuccessfully = true;
            let transIdx = 0;
            currentBatch.forEach((page) => {
              if (page.isWithinRange) translatedPagesText.push(batchResult.value[transIdx++]);
              else translatedPagesText.push(page.text);
            });
          } else {
            currentBatch.forEach((p) => translatedPagesText.push(p.text));
          }
        } else {
          currentBatch.forEach((p) => translatedPagesText.push(p.text));
        }
      }

      if (!anyPageTranslatedSuccessfully && !titleTranslatedSuccessfully) {
        alert('Yapay zeka Türkçe çeviri motoru kota aşımı veya bağlantı hatası nedeniyle başlatılamadı. Makaleyi orijinal dilinde okuyup dinlemeye devam edebilirsiniz.');
        return;
      }

      setTranslationProgress('Türkçe yapısı yapılandırılıyor...');
      const compiled = compilePagesAndLines(translatedPagesText, activeArticle.id);

      const translatedArticle: Article = {
        ...activeArticle,
        title: translatedTitle,
        text: translatedPagesText.join('\n\n'),
        pages: compiled.pages,
        lines: compiled.lines,
        language: 'tr',
        originalTitle: activeArticle.originalTitle || activeArticle.title,
        originalText: activeArticle.originalText || activeArticle.text,
        originalPages: activeArticle.originalPages || activeArticle.pages,
        originalLines: activeArticle.originalLines || activeArticle.lines,
        originalLanguage: activeArticle.originalLanguage || activeArticle.language || 'en',
      };

      setActiveArticle(translatedArticle);
      setLineIndex(0);
    } catch (err: any) {
      console.error('Article translation workflow failure:', err);
      alert('Yapay zeka ile Türkçe dil çevirisi yapılırken bir hata oluştu.');
    } finally {
      setIsTranslating(false);
      setTranslationProgress(null);
    }
  };

  // --- DYNAMICALLY COMPUTED ARTICLE VIEWS (ORIGINAL VS. TRANSLATED) ---
  const isTranslated = !!activeArticle?.originalLines;

  const displayArticle = useMemo(() => {
    if (!activeArticle) return null;
    const hasOriginal = !!activeArticle.originalLines;
    if (hasOriginal && isReadingOriginal) {
      return {
        ...activeArticle,
        title: activeArticle.originalTitle || activeArticle.title,
        text: activeArticle.originalText || activeArticle.text,
        pages: activeArticle.originalPages || activeArticle.pages,
        lines: activeArticle.originalLines || activeArticle.lines,
        language: activeArticle.originalLanguage || 'en',
      };
    }
    return activeArticle;
  }, [activeArticle, isReadingOriginal]);

  const activeLines = useMemo(() => (displayArticle ? displayArticle.lines : []), [displayArticle]);
  const activeLanguage = useMemo(() => (displayArticle ? displayArticle.language || 'tr' : 'tr'), [displayArticle]);

  // --- INTEGRATED SPEECH HOOK BINDINGS ---
  const handleLineIndexChangeInSpeech = useCallback((index: number) => {
    setActiveArticle((prev) => {
      if (!prev) return null;
      if (prev.lastReadIndex === index) return prev;
      const updated = { ...prev, lastReadIndex: index };
      // Persist reading position to IndexedDB (fire-and-forget).
      const page = updated.lines[index]?.pageNumber ?? 1;
      void documentService.setReadingPosition(updated.id, index, page);
      return updated;
    });

    const viewport = document.querySelector('#document-reading-viewport');
    if (viewport) {
      setTimeout(() => {
        const activeLineElt = viewport.querySelector('.border-l-4');
        if (activeLineElt) activeLineElt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, []);

  // Notes are persisted through useResearchNotes; the speech hook's callback is a no-op.
  const noopNoteTaken = useCallback(() => {}, []);

  const {
    voices,
    settings,
    setSettings,
    isPlaying,
    currentLineIdx,
    isRecordingNote,
    isSpeechListening,
    interimTranscript,
    finalTranscript,
    setInterimTranscript,
    setFinalTranscript,
    isHandsFreeActive,
    setIsHandsFreeActive,
    dictationLanguage,
    changeDictationLanguage,
    play,
    pause,
    stop,
    nextSentence,
    prevSentence,
    setLineIndex,
    triggerNoteTaking,
    cancelRecording,
    startSpeechRecognition,
    stopSpeechRecognition,

    // Graph variables
    activeGraphLine,
    isAwaitingGraphApproval,
    graphSummaryText,
    isSummarizingGraph,
    graphSpeechRecActive,
    approveGraphSummary,
    declineGraphSummary,
  } = useSpeechEngine(
    activeLines,
    handleLineIndexChangeInSpeech,
    noopNoteTaken,
    activeLanguage,
    activeArticle?.lastReadIndex || 0,
  );

  // --- SOURCE-LINKED NOTE WORKFLOW ---
  const handleTriggerNote = useCallback((selectedText?: string) => {
    pendingSelectionRef.current = selectedText ?? null;
    triggerNoteTaking();
  }, [triggerNoteTaking]);

  // Anchor computed live at render time (depends on the selection ref set at trigger).
  const noteAnchor: SourceAnchor | null = activeArticle
    ? buildSourceAnchor({
        documentId: activeArticle.id,
        lines: activeLines,
        activeIndex: currentLineIdx,
        selectedText: pendingSelectionRef.current,
      })
    : null;

  const handleSaveResearchNote = async (data: NoteEditorSaveData) => {
    if (!noteAnchor) return;
    await addNote({
      sourceAnchor: noteAnchor,
      origin: data.origin,
      rawTranscript: data.rawTranscript,
      finalNote: data.finalNote,
      cleanedAcademicNote: data.cleanedAcademicNote,
      tags: data.tags,
    });
    pendingSelectionRef.current = null;
    cancelRecording();
    setMobileTab('notes');
  };

  // AI note cleaning (Phase 3). Gated by feature flags; the editor hides the
  // affordance entirely when this handler is not provided.
  const aiCleaningEnabled = featureFlags.aiFeatures && featureFlags.aiNoteCleaning;
  const handleRequestClean = useCallback(
    async (raw: string, excerpt: string) => {
      const result = await requestCleanNote({
        documentTitle: activeArticle?.title,
        sourceExcerpt: excerpt,
        rawTranscript: raw,
        language: activeLanguage,
      });
      return {
        cleanedNote: result.cleanedNote,
        suggestedTags: result.suggestedTags,
        warnings: result.warnings,
      };
    },
    [activeArticle?.title, activeLanguage],
  );

  const handleCloseNoteEditor = () => {
    pendingSelectionRef.current = null;
    cancelRecording();
  };

  const handleJumpToSource = (anchor: SourceAnchor) => {
    if (anchor.globalIndex == null) return;
    setLineIndex(anchor.globalIndex);
    setTimeout(() => handleLineIndexChangeInSpeech(anchor.globalIndex!), 50);
  };

  // --- NOTE PLAYBACK ---
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const activeVoice = settings.voiceURI
      ? voices.find((v) => v.voiceURI === settings.voiceURI)
      : voices.find((v) => v.lang.startsWith('tr'));
    if (activeVoice) {
      utterance.voice = activeVoice as unknown as SpeechSynthesisVoice;
      utterance.lang = activeVoice.lang;
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    window.speechSynthesis.speak(utterance);
  }, [settings, voices]);

  const handlePlayNote = (note: ResearchNote) => {
    speakText(`Not ${note.ordinal}, sayfa ${note.sourceAnchor.pageNumber}: ${note.finalNote}`);
  };

  // --- LIBRARY FILTER / SORT (dashboard) ---
  const libraryLanguages = useMemo(() => listLanguages(libraryEntries), [libraryEntries]);
  const visibleLibrary = useMemo(() => {
    const byLang = filterByLanguage(libraryEntries, libraryLang);
    const searched = searchLibrary(byLang, librarySearch);
    return sortLibrary(searched, librarySort);
  }, [libraryEntries, libraryLang, librarySearch, librarySort]);

  const languageLabel = (lang: string) =>
    lang === 'tr' ? 'Türkçe' : lang === 'en' ? 'English' : lang.toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar
        voices={voices}
        settings={settings}
        onSettingsChange={setSettings}
        isHandsFreeActive={isHandsFreeActive}
        onHandsFreeToggle={() => setIsHandsFreeActive(!isHandsFreeActive)}
        hasArticle={!!activeArticle}
        onClearArticle={handleCloseArticle}
        articleTitle={displayArticle?.title || activeArticle?.title}
        articleLanguage={activeLanguage}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeArticle ? (
          <>
          {/* Mobile panel switcher (desktop shows both panels side by side) */}
          <div className="mb-4 flex gap-2 lg:hidden">
            <button
              onClick={() => setMobileTab('reader')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                mobileTab === 'reader'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <BookOpen className="h-4 w-4" /> Okuma
            </button>
            <button
              onClick={() => setMobileTab('notes')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                mobileTab === 'notes'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <NotebookPen className="h-4 w-4" /> Notlar ({notes.length})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 h-[calc(100vh-12rem)] min-h-[550px]">
            <div className={`lg:col-span-7 xl:col-span-8 h-full ${mobileTab === 'reader' ? 'block' : 'hidden'} lg:block`}>
              <ReaderPanel
                article={displayArticle || activeArticle}
                isPlaying={isPlaying}
                currentLineIdx={currentLineIdx}
                onPlay={play}
                onPause={pause}
                onStop={stop}
                onNext={nextSentence}
                onPrev={prevSentence}
                onSentenceClick={setLineIndex}
                onTriggerNote={handleTriggerNote}
                isHandsFreeActive={isHandsFreeActive}
                isSavedInLibrary
                onSaveToLibrary={() => {}}
                onCloseArticle={handleCloseArticle}
                activeGraphLine={activeGraphLine}
                isAwaitingGraphApproval={isAwaitingGraphApproval}
                graphSummaryText={graphSummaryText}
                isSummarizingGraph={isSummarizingGraph}
                graphSpeechRecActive={graphSpeechRecActive}
                approveGraphSummary={approveGraphSummary}
                declineGraphSummary={declineGraphSummary}
                isTranslating={isTranslating}
                translationProgress={translationProgress}
                onTranslateToTurkish={handleTranslateToTurkish}
                isReadingOriginal={isReadingOriginal}
                isTranslated={isTranslated}
                onToggleOriginal={setIsReadingOriginal}
              />
            </div>

            <div className={`lg:col-span-5 xl:col-span-4 h-full ${mobileTab === 'notes' ? 'block' : 'hidden'} lg:block`}>
              <ResearchNotesPanel
                notes={notes}
                documentTitle={activeArticle.title}
                onJumpToSource={handleJumpToSource}
                onUpdateNote={(id, patch) => void updateNote(id, patch)}
                onDeleteNote={(id) => void deleteNote(id)}
                onPlayNote={handlePlayNote}
                onExport={() => setIsExportOpen(true)}
              />
            </div>
          </div>
          </>
        ) : (
          <div className="mx-auto max-w-4xl space-y-12">
            {/* Landing Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Sparkles className="h-4 w-4" />
                <span>{PRODUCT.name} — {PRODUCT.taglineTr}</span>
              </div>
              <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-950 tracking-tight dark:text-white leading-tight">
                Makaleyi dinleyin, durun, düşüncenizi söyleyin <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500">
                  kaynağa bağlı araştırma notuna
                </span> dönüşsün.
              </h2>
              <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                PDF, DOCX ve TXT akademik belgelerinizi yükleyin; dinlerken önemli bir pasajı seçin, fikrinizi sesli ya da yazılı kaydedin, ham düşünceyi koruyun ve düzenlenmiş notunuzu tam kaynak bağlamıyla saklayın.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`rounded-3xl border-2 border-dashed p-10 text-center transition duration-200 bg-white shadow-xs ${
                isParsing
                  ? 'border-indigo-400 bg-indigo-50/5 dark:border-indigo-800'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
              }`}
            >
              <div className="mx-auto flex max-w-xl flex-col items-center justify-center">
                {isParsing ? (
                  <div className="space-y-4 py-6">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
                      <FileText className="absolute h-6 w-6 text-indigo-600 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-sans font-bold text-slate-800 text-sm dark:text-white">Belge Analiz Ediliyor...</p>
                      <p className="text-2xs text-slate-400 mt-1 font-mono">Sayfalar ve cümle yapıları ayrıştırılıyor</p>
                    </div>
                    <div className="w-48 mx-auto">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>İŞLENİYOR</span>
                        <span>%{parsingPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${parsingPercent}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none dark:bg-indigo-950/40 dark:text-indigo-400">
                      <Upload className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 font-sans font-bold text-slate-800 text-base dark:text-white">Akademik Belgeyi Buraya Bırakın veya Seçin</h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed max-w-sm">
                      Desteklenen formatlar: <strong className="text-slate-600 dark:text-slate-300">PDF, DOCX</strong> veya <strong className="text-slate-600 dark:text-slate-300">TXT</strong>.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition duration-150 cursor-pointer dark:shadow-none"
                        id="select-file-button"
                      >
                        <span>Cihazdan Dosya Seç</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleInputFileChange} accept=".pdf,.docx,.txt" className="hidden" />
                    </div>
                  </>
                )}

                {parsingError && (
                  <div className="mt-6 flex items-start space-x-2 rounded-xl bg-red-50 p-4.5 text-left border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400 flex-none" />
                    <div>
                      <h4 className="text-xs font-bold text-red-800 dark:text-red-300">Ayrıştırma Hatası</h4>
                      <p className="mt-0.5 text-2xs text-red-600 dark:text-red-400">{parsingError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sample loader */}
            <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-indigo-100/60 bg-indigo-50/15 p-5 dark:border-indigo-900/30 dark:bg-indigo-950/10">
              <div className="flex items-center space-x-3 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileText className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">Bilgisayarımda makale dökümanı yok</h4>
                  <p className="text-[11px] text-slate-400">Eğitim ve yapay zeka üzerine hazır Türkçe akademik makaleyi anında yükleyin.</p>
                </div>
              </div>
              <button
                onClick={handleLoadSample}
                className="mt-4 sm:mt-0 inline-flex items-center space-x-1 rounded-xl bg-white px-4 py-2 border border-indigo-200 text-indigo-700 text-2xs font-bold hover:bg-slate-50 transition cursor-pointer shadow-3xs dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                id="load-sample-btn"
              >
                <span>Örnek Makaleyle Dene</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Library */}
            {libraryEntries.length > 0 && (
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600" />
                        Belge Kütüphaneniz
                      </h3>
                      <p className="text-2xs font-mono text-slate-500 dark:text-slate-400">
                        Yerelde (tarayıcınızda) kayıtlı {libraryEntries.length} belge
                      </p>
                    </div>
                  </div>

                  {/* Search / filter / sort controls */}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        placeholder="Belgelerde ara..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/40 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      />
                    </div>
                    {libraryLanguages.length > 1 && (
                      <select
                        value={libraryLang}
                        onChange={(e) => setLibraryLang(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                        title="Dile göre süz"
                      >
                        <option value="">Tüm diller</option>
                        {libraryLanguages.map((l) => (
                          <option key={l} value={l}>{languageLabel(l)}</option>
                        ))}
                      </select>
                    )}
                    <select
                      value={librarySort}
                      onChange={(e) => setLibrarySort(e.target.value as LibrarySortKey)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      title="Sırala"
                    >
                      <option value="recent">Son açılan</option>
                      <option value="title">Başlık</option>
                      <option value="notes">Not sayısı</option>
                      <option value="progress">İlerleme</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleLibrary.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-400">Eşleşen belge bulunamadı.</p>
                  )}
                  {visibleLibrary.map(({ document: doc, noteCount }, idx) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3 group text-left">
                      <div className="flex items-start space-x-3 text-left">
                        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-indigo-50 font-mono text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-200">
                            {doc.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="uppercase">{doc.fileType} • {formatFileSize(doc.fileSizeBytes)}</span>
                            <span>•</span>
                            <span>DİL: {doc.language === 'tr' ? 'Türkçe' : doc.language === 'en' ? 'English' : doc.language.toUpperCase()}</span>
                            {noteCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-extrabold dark:text-indigo-400">{noteCount} Not</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenFromLibrary(doc.id)}
                          className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-2xs font-bold text-indigo-700 hover:bg-indigo-100 transition duration-150 cursor-pointer dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>Okumaya Devam Et</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFromLibrary(doc.id)}
                          className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition duration-150 cursor-pointer dark:border-slate-800 dark:hover:bg-red-950/20"
                          title="Belgeyi ve notlarıyla birlikte sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-sm uppercase tracking-widest text-slate-400 text-center select-none">NASIL ÇALIŞIR?</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FeatureCard icon={<BookOpen className="h-4.5 w-4.5" />} tone="indigo" title="1. Dinle ve Aktif Oku" body="Belgeniz sayfalara ve cümlelere bölünür. Hızı ve sesi ayarlayıp dilediğiniz cümleden dinlemeye başlayın." />
                <FeatureCard icon={<Mic className="h-4.5 w-4.5" />} tone="red" title="2. Pasaj Seç, Notunu Söyle" body="Bir metni seçip 'Bu Metne Not Ekle' deyin ya da dinlerken durup fikrinizi sesli/yazılı kaydedin. Ham döküm korunur." />
                <FeatureCard icon={<Activity className="h-4.5 w-4.5" />} tone="emerald" title="3. Kaynağa Bağla" body="Her not, seçtiğiniz pasaja, sayfasına ve çevresel bağlamına bağlanır; tek tıkla kaynağa geri dönebilirsiniz." />
                <FeatureCard icon={<Info className="h-4.5 w-4.5" />} tone="amber" title="4. Düzenle ve Sakla" body="Notu etiketleyin, nihai akademik biçimine getirin; her şey tarayıcınızda yerel olarak saklanır." />
              </div>
            </div>

            {/* Privacy / data control */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3 text-left">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                <div>
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">Verileriniz yerelde kalır</h4>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Belgeleriniz ve notlarınız tarayıcınızda saklanır. Tarayıcı verilerini temizlemek bunları silebilir; önemli notları dışa aktarmanız önerilir.
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearAllData}
                className="flex-none rounded-xl border border-red-200 px-4 py-2 text-2xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/20"
              >
                Verilerimi Sil
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Source-linked note editor */}
      {activeArticle && noteAnchor && (
        <NoteEditorModal
          isOpen={isRecordingNote}
          onClose={handleCloseNoteEditor}
          sourceExcerpt={noteAnchor.selectedText}
          pageNumber={noteAnchor.pageNumber}
          isSelectionBased={!!pendingSelectionRef.current}
          isSpeechListening={isSpeechListening}
          interimTranscript={interimTranscript}
          finalTranscript={finalTranscript}
          onStartSpeech={startSpeechRecognition}
          onStopSpeech={stopSpeechRecognition}
          dictationLanguage={dictationLanguage}
          onChangeDictationLanguage={changeDictationLanguage}
          onClearTranscript={() => {
            setInterimTranscript('');
            setFinalTranscript('');
          }}
          onSave={handleSaveResearchNote}
          onRequestClean={aiCleaningEnabled ? handleRequestClean : undefined}
        />
      )}

      {/* Export dialog */}
      {activeArticle && (
        <ExportDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          documentId={activeArticle.id}
          documentTitle={activeArticle.title}
          notes={notes}
        />
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  tone: 'indigo' | 'red' | 'emerald' | 'amber';
}) {
  const tones: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  };
  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-3xs hover:shadow-2xs transition duration-150 dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <h4 className="mt-3 font-sans font-bold text-xs text-slate-800 dark:text-white">{title}</h4>
      <p className="mt-1 text-2xs text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}
