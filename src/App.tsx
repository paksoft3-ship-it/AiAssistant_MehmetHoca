import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent, DragEvent } from 'react';
import { 
  FileText, Upload, Mic, Trash2, ArrowRight, Activity, 
  HelpCircle, Sparkles, BookOpen, AlertCircle, Info, RefreshCw 
} from 'lucide-react';

import { Article, Note, SpeechSettings } from './types';
import { parseFile, formatFileSize, compilePagesAndLines } from './utils/documentParser';
import { useSpeechEngine } from './hooks/useSpeechEngine';

// Subcomponents
import Navbar from './components/Navbar';
import ReaderPanel from './components/ReaderPanel';
import NotesPanel from './components/NotesPanel';
import SpeechRecordingModal from './components/SpeechRecordingModal';

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
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingPercent, setParsingPercent] = useState(0);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<string | null>(null);
  const [isReadingOriginal, setIsReadingOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset read-mode defaults when active article shifts
  useEffect(() => {
    setIsReadingOriginal(false);
  }, [activeArticle?.id]);

  // --- PERSISTENCE STATE ENGINE ---
  // Load initial caching databases from local storage
  useEffect(() => {
    const savedArticle = localStorage.getItem('sesli_makale_aktif');
    const savedNotes = localStorage.getItem('sesli_makale_notlar');
    const savedArchive = localStorage.getItem('sesli_makale_arsiv');
    
    if (savedArticle) {
      try {
        setActiveArticle(JSON.parse(savedArticle));
      } catch (e) {
        console.error('Failed to parse cached article:', e);
      }
    }
    
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse cached notes:', e);
      }
    }

    if (savedArchive) {
      try {
        setArticlesList(JSON.parse(savedArchive));
      } catch (e) {
        console.error('Failed to parse cached archive:', e);
      }
    }
  }, []);

  // Sync state data as things change
  const saveArticleToCache = (article: Article | null) => {
    setActiveArticle(article);
    if (article) {
      localStorage.setItem('sesli_makale_aktif', JSON.stringify(article));
    } else {
      localStorage.removeItem('sesli_makale_aktif');
    }
  };

  const saveNotesToCache = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem('sesli_makale_notlar', JSON.stringify(newNotes));
  };

  const saveArchiveToCache = (newArchive: Article[]) => {
    setArticlesList(newArchive);
    localStorage.setItem('sesli_makale_arsiv', JSON.stringify(newArchive));
  };


  // --- DOCUMENT PARSING PIPELINE ---
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParsingPercent(0);
    setParsingError(null);

    try {
      const parsed = await parseFile(file, (percent) => {
        setParsingPercent(percent);
      });
      saveArticleToCache(parsed);
    } catch (err: any) {
      console.error(err);
      setParsingError(err.message || 'Dosya çözümlenirken bilinmeyen bir hata oluştu.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleTranslateToTurkish = async (startPage?: number, endPage?: number) => {
    if (!activeArticle) return;
    
    // Stop speaking if playing
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsTranslating(true);
    setTranslationProgress("Başlık Türkçeye çevriliyor...");

    try {
      // 1. Translate Title
      let translatedTitle = activeArticle.title;
      let titleTranslatedSuccessfully = false;
      try {
        const titleRes = await fetch('/api/gemini/translate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: activeArticle.title })
        });
        const titleData = await titleRes.json();
        if (titleData.translatedText && !titleData.isFallback) {
          translatedTitle = titleData.translatedText;
          titleTranslatedSuccessfully = true;
        }
      } catch (err) {
        console.error("Title translation failed:", err);
      }

      // 2. Select pages to translate based on custom user range (startPage to endPage, 1-based)
      const totalPages = activeArticle.pages.length;
      const sPage = startPage || 1;
      const ePage = endPage || totalPages;

      const pagesToTranslate = activeArticle.pages.map(page => {
        const isWithinRange = page.pageNumber >= sPage && page.pageNumber <= ePage;
        return {
          ...page,
          isWithinRange
        };
      });

      // We translate pages in efficient batches to avoid hitting API rate limits
      // To satisfy user desire for completing the whole thing or custom ranges,
      // we only prompt Gemini for pages within the user's requested range!
      const chunkBatchSize = 5;
      const translatedPagesText: string[] = [];
      let anyPageTranslatedSuccessfully = false;

      for (let i = 0; i < pagesToTranslate.length; i += chunkBatchSize) {
        const currentBatch = pagesToTranslate.slice(i, i + chunkBatchSize);
        const activeBatchInTranslation = currentBatch.filter(p => p.isWithinRange);
        
        if (activeBatchInTranslation.length > 0) {
          const startNum = activeBatchInTranslation[0].pageNumber;
          const endNum = activeBatchInTranslation[activeBatchInTranslation.length - 1].pageNumber;
          
          setTranslationProgress(`Sayfalar [${startNum}-${endNum}] çevriliyor...`);
          
          try {
            const batchTexts = activeBatchInTranslation.map(p => p.text);
            const batchRes = await fetch('/api/gemini/translate-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ texts: batchTexts })
            });
            const batchData = await batchRes.json();
            
            if (batchData.translatedTexts && Array.isArray(batchData.translatedTexts) && !batchData.isFallback) {
              anyPageTranslatedSuccessfully = true;
              
              // Map translated back to respective indices in currentBatch
              let transIdx = 0;
              currentBatch.forEach(page => {
                if (page.isWithinRange) {
                  translatedPagesText.push(batchData.translatedTexts[transIdx]);
                  transIdx++;
                } else {
                  translatedPagesText.push(page.text);
                }
              });
            } else {
              // Fallback to original
              currentBatch.forEach(p => translatedPagesText.push(p.text));
            }
          } catch (err) {
            console.error(`Batch translation failed:`, err);
            currentBatch.forEach(p => translatedPagesText.push(p.text));
          }
        } else {
          // If no pages in range, preserve original layout texts perfectly
          currentBatch.forEach(p => translatedPagesText.push(p.text));
        }
      }

      // If translation completely failed/fell back on active portions
      if (!anyPageTranslatedSuccessfully && !titleTranslatedSuccessfully) {
        alert("Yapay zeka Türkçe çeviri motoru kota aşımı veya bağlantı hatası nedeniyle başlatılamadı. Makaleyi orijinal dilinde okuyup dinlemeye devam edebilirsiniz.");
        setIsTranslating(false);
        setTranslationProgress(null);
        return;
      }

      setTranslationProgress("Türkçe yapısı yapılandırılıyor...");

      // 3. Compile translated pages back to Structured Pages and Lines
      const compiled = compilePagesAndLines(translatedPagesText, activeArticle.id);

      const translatedArticle: Article = {
        ...activeArticle,
        title: translatedTitle,
        text: translatedPagesText.join('\n\n'),
        pages: compiled.pages,
        lines: compiled.lines,
        language: 'tr',
        
        // Preserve original content!
        originalTitle: activeArticle.originalTitle || activeArticle.title,
        originalText: activeArticle.originalText || activeArticle.text,
        originalPages: activeArticle.originalPages || activeArticle.pages,
        originalLines: activeArticle.originalLines || activeArticle.lines,
        originalLanguage: activeArticle.originalLanguage || activeArticle.language || 'en',
      };

      // 4. Save to cache
      saveArticleToCache(translatedArticle);

      // If already saved in library, update its record
      const isSaved = articlesList.some(a => a.id === activeArticle.id);
      if (isSaved) {
        const updatedArchive = articlesList.map(a => a.id === activeArticle.id ? { ...translatedArticle, serialNumber: a.serialNumber } : a);
        saveArchiveToCache(updatedArchive);
      }

      // Reset speech engine state to the beginning
      setLineIndex(0);

    } catch (err: any) {
      console.error("Article translation workflow failure:", err);
      alert("Yapay zeka ile Türkçe dil çevirisi yapılırken bir hata oluştu.");
    } finally {
      setIsTranslating(false);
      setTranslationProgress(null);
    }
  };

  const handleInputFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Launch pre-loaded high fidelity Turkish template
  const handleLoadSample = () => {
    saveArticleToCache(SAMPLE_ARTICLE);
    setParsingError(null);
  };

  // --- LIBRARY ACTIONS ---
  const handleSaveToLibrary = () => {
    if (!activeArticle) return;
    
    // Check if already archived
    const exists = articlesList.some(a => a.id === activeArticle.id);
    if (exists) return;
    
    const nextSerialNumber = articlesList.length + 1;
    const articleToSave: Article = {
      ...activeArticle,
      serialNumber: nextSerialNumber
    };
    
    const updated = [...articlesList, articleToSave];
    saveArchiveToCache(updated);
    
    // Mirror inside active state so header reflects saved status
    saveArticleToCache(articleToSave);
  };

  const handleCloseArticle = () => {
    // Stop synthesis Speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // If the article we are closing was NEVER saved to the archive library, 
    // garbage collect its notes to keep localStorage memory uncluttered
    if (activeArticle) {
      const isSaved = articlesList.some(a => a.id === activeArticle.id);
      if (!isSaved) {
        const cleanedNotes = notes.filter(n => n.articleId !== activeArticle.id);
        saveNotesToCache(cleanedNotes);
      }
    }
    
    saveArticleToCache(null);
  };

  const handleDeleteArticleFromLibrary = (id: string) => {
    const remaining = articlesList.filter(a => a.id !== id);
    // Renumber surviving items consecutively starting from #1
    const renumbered = remaining.map((art, index) => ({
      ...art,
      serialNumber: index + 1
    }));
    saveArchiveToCache(renumbered);
    
    // Trash notes corresponding to this specific deleted document
    const remainingNotes = notes.filter(n => n.articleId !== id);
    saveNotesToCache(remainingNotes);
    
    // If deleted document is current focused read, exit cleanly
    if (activeArticle && activeArticle.id === id) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      saveArticleToCache(null);
    }
  };

  const handleLoadArticleFromLibrary = (article: Article) => {
    saveArticleToCache(article);
    setParsingError(null);
  };


  // --- NOTES TAKING PIPELINE ---
  const handleNoteTaken = useCallback((
    noteText: string, 
    pageNum: number, 
    lineNum: number, 
    context: string
  ) => {
    if (!activeArticle) return;

    const currentArticleId = activeArticle.id;
    // Count notes scoped only to this specific article to provide local sequential numbering
    const currentNotesCount = notes.filter(n => n.articleId === currentArticleId).length;

    const newNote: Note = {
      id: crypto.randomUUID(),
      number: currentNotesCount + 1,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pageNumber: pageNum,
      lineNumber: lineNum,
      contextText: context,
      noteText: noteText,
      createdAt: new Date().toISOString(),
      articleId: currentArticleId,
      articleTitle: activeArticle.title,
    };

    const updated = [...notes, newNote];
    saveNotesToCache(updated);
  }, [activeArticle, notes]);

  const handleEditNote = (id: string, newText: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, noteText: newText } : n);
    saveNotesToCache(updated);
  };

  const handleDeleteNote = (id: string) => {
    const targetNote = notes.find(n => n.id === id);
    if (!targetNote) return;
    
    const remaining = notes.filter(n => n.id !== id);
    
    // Re-number surviving notes for the affected article only!
    const updated = remaining.map(n => {
      if (n.articleId === targetNote.articleId) {
        const articleSurvivorsPrior = remaining.filter(
          res => res.articleId === targetNote.articleId && res.createdAt < n.createdAt
        );
        return {
          ...n,
          number: articleSurvivorsPrior.length + 1
        };
      }
      return n;
    });
    
    saveNotesToCache(updated);
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

  const activeLines = useMemo(() => {
    return displayArticle ? displayArticle.lines : [];
  }, [displayArticle]);

  const activeLanguage = useMemo(() => {
    return displayArticle ? (displayArticle.language || 'tr') : 'tr';
  }, [displayArticle]);

  // --- INTEGRATED SPEECH HOOK BINDINGS ---
  
  const handleLineIndexChangeInSpeech = useCallback((index: number) => {
    // 1. Update active article's lastReadIndex state & cache
    setActiveArticle(prev => {
      if (!prev) return null;
      if (prev.lastReadIndex === index) return prev;
      const updated = { ...prev, lastReadIndex: index };
      localStorage.setItem('sesli_makale_aktif', JSON.stringify(updated));
      return updated;
    });

    // 2. Also locate if this article exists inside archive (library list) and update its lastReadIndex there
    setArticlesList(prevList => {
      if (!activeArticle?.id) return prevList;
      const exists = prevList.some(a => a.id === activeArticle.id);
      if (!exists) return prevList;
      const updatedList = prevList.map(a => 
        a.id === activeArticle.id ? { ...a, lastReadIndex: index } : a
      );
      localStorage.setItem('sesli_makale_arsiv', JSON.stringify(updatedList));
      return updatedList;
    });

    // 3. Scroll active highlighted line into view in Reader viewport
    const activeTextElt = document.querySelector('#document-reading-viewport');
    if (activeTextElt) {
      setTimeout(() => {
        const activeLineElt = activeTextElt.querySelector('.border-l-4');
        if (activeLineElt) {
          activeLineElt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [activeArticle?.id]);

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
    saveRecordedNote,
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
    handleNoteTaken,
    activeLanguage,
    activeArticle?.lastReadIndex || 0
  );


  // --- SINGLE & MASS NOTE REPLAY OUT LOUD ---
  const handlePlaySingleNote = (note: Note) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Cancel underlying reader speech first
    window.speechSynthesis.cancel();

    // Read single note elegantly as requested
    const textStr = `Not numara ${note.number}. Sayfa ${note.pageNumber}, satır ${note.lineNumber} için notunuz: ${note.noteText}`;
    const utterance = new SpeechSynthesisUtterance(textStr);
    
    // Load custom settings
    if (settings.voiceURI) {
      const activeVoice = voices.find(v => v.voiceURI === settings.voiceURI);
      if (activeVoice) {
        utterance.voice = activeVoice;
        utterance.lang = activeVoice.lang;
      }
    } else {
      const trFallback = voices.find(v => v.lang.startsWith('tr'));
      if (trFallback) {
        utterance.voice = trFallback;
        utterance.lang = 'tr-TR';
      }
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayAllNotes = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || notes.length === 0) return;
    
    // Pause underlying reader speech first
    window.speechSynthesis.cancel();

    const activeNotes = notes.filter(n => n.articleId === activeArticle?.id);
    if (activeNotes.length === 0) return;

    let textStr = `Makaleniz için tutulan toplam ${activeNotes.length} adet not seslendiriliyor. `;
    activeNotes.forEach(n => {
      textStr += `Not ${n.number}. Sayfa ${n.pageNumber}, satır ${n.lineNumber} notu: ${n.noteText}. `;
    });

    const utterance = new SpeechSynthesisUtterance(textStr);
    
    if (settings.voiceURI) {
      const activeVoice = voices.find(v => v.voiceURI === settings.voiceURI);
      if (activeVoice) {
        utterance.voice = activeVoice;
        utterance.lang = activeVoice.lang;
      }
    } else {
      const trFallback = voices.find(v => v.lang.startsWith('tr'));
      if (trFallback) {
        utterance.voice = trFallback;
        utterance.lang = 'tr-TR';
      }
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;

    window.speechSynthesis.speak(utterance);
  };


  // Filter notes representing the active article (if active)
  const currentArticleNotes = activeArticle 
    ? notes.filter(n => n.articleId === activeArticle.id)
    : [];

  const handleJumpToSentence = (pageNumber: number, lineNumber: number) => {
    if (!activeArticle) return;
    // Find matching global index for designated sentence
    const matchedLine = activeArticle.lines.find(l => l.pageNumber === pageNumber && l.lineNumber === lineNumber);
    if (matchedLine) {
      setLineIndex(matchedLine.globalIndex);
      
      // Let it automatically scroll to center
      setTimeout(() => {
        handleLineIndexChangeInSpeech(matchedLine.globalIndex);
      }, 50);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      
      {/* Top sticky navbar */}
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

      {/* Main Workspace Layout block */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeArticle ? (
          
          /* ACTIVE READING VIEW PANEL SPLIT SCREEN */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 h-[calc(100vh-12rem)] min-h-[550px]">
            
            {/* Left Column: Academic Page Reader Sheet (Takes up 7/12 layout) */}
            <div className="lg:col-span-7 xl:col-span-8 h-full">
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
                onTriggerNote={triggerNoteTaking}
                isHandsFreeActive={isHandsFreeActive}
                isSavedInLibrary={
                  activeArticle ? articlesList.some(a => a.id === activeArticle.id) : false
                }
                onSaveToLibrary={handleSaveToLibrary}
                onCloseArticle={handleCloseArticle}
                
                // Graph integration bindings
                activeGraphLine={activeGraphLine}
                isAwaitingGraphApproval={isAwaitingGraphApproval}
                graphSummaryText={graphSummaryText}
                isSummarizingGraph={isSummarizingGraph}
                graphSpeechRecActive={graphSpeechRecActive}
                approveGraphSummary={approveGraphSummary}
                declineGraphSummary={declineGraphSummary}

                // Translation bindings
                isTranslating={isTranslating}
                translationProgress={translationProgress}
                onTranslateToTurkish={handleTranslateToTurkish}

                // Dynamic Original/Translated Toggle variables
                isReadingOriginal={isReadingOriginal}
                isTranslated={isTranslated}
                onToggleOriginal={setIsReadingOriginal}
              />
            </div>

            {/* Right Column: Active Interactive Notes Stream Timeline (3/12 Layout) */}
            <div className="lg:col-span-5 xl:col-span-4 h-full">
              <NotesPanel
                notes={currentArticleNotes}
                onPlaySingleNote={handlePlaySingleNote}
                onPlayAllNotes={handlePlayAllNotes}
                onJumpToSentence={handleJumpToSentence}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                currentArticleTitle={activeArticle.title}
              />
            </div>
          </div>

        ) : (
          
          /* UNLOADED LANDING PAGE DASHBOARD LAYOUT */
          <div className="mx-auto max-w-4xl space-y-12">
            
            {/* Landing Hero Headings */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Sesli Okuma ve Konuşmayla Not Alabilen Eğitim Asistanı</span>
              </div>
              <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-950 tracking-tight dark:text-white leading-tight">
                Makaleleri Dinleyin, Söylediğiniz Anda <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500">
                  Zaman Damgalı Not Defteri
                </span> Oluşsun.
              </h2>
              <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                PDF, DOCX ve TXT dosyalarınızı yükleyin, dilediğiniz hız ve ses seçeneğiyle makalenizi baştan sona dinleyin. Aralarda durmak istediğinizde seslenerek veya tek tuşla, sayfa ve satır bilgisiyle konuşarak not tutun.
              </p>
            </div>

            {/* Standard Dropzone Loader layout */}
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
                  /* Parsing indicator screen */
                  <div className="space-y-4 py-6">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
                      <FileText className="absolute h-6 w-6 text-indigo-600 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-sans font-bold text-slate-800 text-sm dark:text-white">
                        Belge Analiz Ediliyor...
                      </p>
                      <p className="text-2xs text-slate-400 mt-1 font-mono">
                        Seçilen döküman içerikleri, sayfalar ve cümle yapıları ayrıştırılıyor
                      </p>
                    </div>
                    
                    {/* Linear Parsing Percentage Progress */}
                    <div className="w-48 mx-auto">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>İŞLENİYOR</span>
                        <span>%{parsingPercent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${parsingPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Empty drag area */
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none dark:bg-indigo-950/40 dark:text-indigo-400">
                      <Upload className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 font-sans font-bold text-slate-800 text-base dark:text-white">
                      Makale Dosyasını Buraya Bırakın veya Seçin
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed max-w-sm">
                      Desteklenen formatlar: <strong className="text-slate-600 dark:text-slate-300">PDF, DOCX</strong> veya <strong className="text-slate-600 dark:text-slate-300">TXT</strong>. 
                    </p>

                    {/* Choose file buttons */}
                    <div className="mt-6">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-5  py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition duration-150 cursor-pointer dark:shadow-none"
                        id="select-file-button"
                      >
                        <span>Cihazdan Dosya Seç</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleInputFileChange}
                        accept=".pdf,.docx,.doc,.txt"
                        className="hidden"
                      />
                    </div>
                  </>
                )}

                {/* Parsing error notifications if there's any */}
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

            {/* Quick Demo Pre-loader option */}
            <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-indigo-100/60 bg-indigo-50/15 p-5 dark:border-indigo-900/30 dark:bg-indigo-950/10">
              <div className="flex items-center space-x-3 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileText className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
                    Bilgisayarımda makale dökümanı yok
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Eğitim, yapay zeka ve müfredatla ilgili hazır Türkçe akademik makaleyi anında yükleyin.
                  </p>
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

            {/* PERSISTENT ARTICLES ARCHIVE LIBRARY PANEL */}
            {articlesList.length > 0 && (
              <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
                      Makale Kütüphaneniz
                    </h3>
                    <p className="text-2xs font-mono text-slate-500 dark:text-slate-400">
                      Sıra numarasıyla kayıtlı toplam {articlesList.length} adet belgeniz bulunuyor
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {articlesList.map((art) => {
                    const articleNotesCount = notes.filter(n => n.articleId === art.id).length;
                    return (
                      <div key={art.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3 group text-left">
                        <div className="flex items-start space-x-3 text-left">
                          {/* Serial No label */}
                          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-indigo-50 font-mono text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                            #{art.serialNumber}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-200">
                              {art.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="uppercase">{art.fileType} • {art.fileSize}</span>
                              <span>•</span>
                              <span>DİL: {
                                art.language === 'tr' ? 'Türkçe' :
                                art.language === 'en' ? 'English' :
                                art.language ? art.language.toUpperCase() : 'Bilinmiyor'
                              }</span>
                              {articleNotesCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-500 font-extrabold flex items-center gap-0.5">
                                    🎙️ {articleNotesCount} Not/Alıntı
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <button
                            onClick={() => handleLoadArticleFromLibrary(art)}
                            className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-2xs font-bold text-indigo-750 hover:bg-indigo-100 transition duration-150 cursor-pointer dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                          >
                            <BookOpen className="h-4 w-4" />
                            <span>Okumaya Başla</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteArticleFromLibrary(art.id)}
                            className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-105 transition duration-150 cursor-pointer dark:border-slate-800 dark:hover:bg-red-950/20"
                            title="Kütüphaneden ve notlarıyla birlikte sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Bento Feature Grid description */}
            <div className="space-y-4">
              <h3 className="font-sans font-bold text-sm uppercase tracking-widest text-slate-400 text-center select-none">
                NASIL ÇALIŞIR?
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                
                {/* 1 */}
                <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-3xs hover:shadow-2xs transition duration-150 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="mt-3 font-sans font-bold text-xs text-slate-800 dark:text-white">
                    1. Hızlı ve Akıllı Okuyucu
                  </h4>
                  <p className="mt-1 text-2xs text-slate-400 leading-relaxed">
                    Yüklediğiniz dökümanlar sisteme alınır ve sayfalara bölünür. İstediğiniz ses hızını ayarlayarak makalenin tamamını dilediğinizce dinleyebilirsiniz.
                  </p>
                </div>

                {/* 2 */}
                <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-3xs hover:shadow-2xs transition duration-150 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    <Mic className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="mt-3 font-sans font-bold text-xs text-slate-800 dark:text-white">
                    2. Kesintisiz Sesli Notasyon &ldquo;Dur!&rdquo;
                  </h4>
                  <p className="mt-1 text-2xs text-slate-400 leading-relaxed">
                    Eşzamanlı eller serbest (hands-free) modunu açarak konuşurken veya yeşil butonla <strong className="text-red-500">Dur, Not Alalım!</strong> dediğiniz an okuyucu ses durur ve notunuzu sesle yazdırabilirsiniz.
                  </p>
                </div>

                {/* 3 */}
                <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-3xs hover:shadow-2xs transition duration-150 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="mt-3 font-sans font-bold text-xs text-slate-800 dark:text-white">
                    3. Konum ve Detay İndisleme
                  </h4>
                  <p className="mt-1 text-2xs text-slate-400 leading-relaxed">
                    Tuttuğunuz her not; o sırada okunmakta olan cümlenin tam Sayfa, Satır numarasını ve Zaman damgasını tutarak ardışık numaralarla fihriste kilitlenir.
                  </p>
                </div>

                {/* 4 */}
                <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-3xs hover:shadow-2xs transition duration-150 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <Info className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="mt-3 font-sans font-bold text-xs text-slate-800 dark:text-white">
                    4. Geri Dinle, Düzenle ve İndir
                  </h4>
                  <p className="mt-1 text-2xs text-slate-400 leading-relaxed">
                    Listenizdeki tüm notları tek tek okutabilir, dilediğiniz cümleye tıklayarak makale metnine ışınlanabilir ve çalışmalarınızı toplu TXT olarak indirebilirsiniz.
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>

      {/* OVERLAY MICROPHONE DICTATION MODAL */}
      <SpeechRecordingModal
        isOpen={isRecordingNote}
        onClose={cancelRecording}
        interimTranscript={interimTranscript}
        finalTranscript={finalTranscript}
        contextText={activeArticle && activeLines[currentLineIdx] ? activeLines[currentLineIdx].text : ''}
        onSave={saveRecordedNote}
        pageNumber={activeArticle && activeLines[currentLineIdx] ? activeLines[currentLineIdx].pageNumber : 1}
        lineNumber={activeArticle && activeLines[currentLineIdx] ? activeLines[currentLineIdx].lineNumber : 1}
        isSpeechListening={isSpeechListening}
        onStartSpeech={startSpeechRecognition}
        onStopSpeech={stopSpeechRecognition}
        dictationLanguage={dictationLanguage}
        onChangeDictationLanguage={changeDictationLanguage}
        voices={voices}
        settings={settings}
        onClearTranscript={() => {
          setInterimTranscript('');
          setFinalTranscript('');
        }}
        articleTitle={activeArticle?.title || ''}
      />
    </div>
  );
}
