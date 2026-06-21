import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent, DragEvent } from 'react';
import { BookOpen, NotebookPen } from 'lucide-react';

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
import PrivacyNotice from './components/PrivacyNotice';
import LandingView from './components/LandingView';

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
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
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
    <div className="flex min-h-screen flex-col bg-canvas dark:bg-slate-950">
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

      {activeArticle ? (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Mobile panel switcher (desktop shows both panels side by side) */}
          <div className="mb-4 flex gap-2 lg:hidden">
            <button
              onClick={() => setMobileTab('reader')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-btn px-3 py-2 text-sm font-medium transition ${
                mobileTab === 'reader'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-text-muted border border-border dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <BookOpen className="h-4 w-4" /> Okuma
            </button>
            <button
              onClick={() => setMobileTab('notes')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-btn px-3 py-2 text-sm font-medium transition ${
                mobileTab === 'notes'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-text-muted border border-border dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <NotebookPen className="h-4 w-4" /> Notlar ({notes.length})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 h-[calc(100vh-12rem)] lg:h-[calc(100vh-9rem)] min-h-[550px]">
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
          </main>
        ) : (
          <LandingView
            isParsing={isParsing}
            parsingPercent={parsingPercent}
            parsingError={parsingError}
            fileInputRef={fileInputRef}
            onInputFileChange={handleInputFileChange}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onLoadSample={handleLoadSample}
            libraryEntries={visibleLibrary}
            totalLibraryCount={libraryEntries.length}
            librarySearch={librarySearch}
            onLibrarySearch={setLibrarySearch}
            libraryLang={libraryLang}
            onLibraryLang={setLibraryLang}
            libraryLanguages={libraryLanguages}
            librarySort={librarySort}
            onLibrarySort={setLibrarySort}
            onOpenDocument={handleOpenFromLibrary}
            onRemoveDocument={handleRemoveFromLibrary}
          />
        )}

      {/* Marketing footer — only on the landing/dashboard. The reader is a
          full-height workspace (no footer), matching the approved design. */}
      {!activeArticle && (
        <footer className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-2xs text-slate-400 sm:flex-row">
            <span>
              {PRODUCT.name} — {PRODUCT.subtitle} · Beta
            </span>
            <button onClick={() => setIsPrivacyOpen(true)} className="font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
              Gizlilik ve Verileriniz
            </button>
          </div>
        </footer>
      )}

      <PrivacyNotice
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onClearData={() => {
          setIsPrivacyOpen(false);
          void handleClearAllData();
        }}
      />

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
