import { useState, useEffect, useRef, useCallback } from 'react';
import { ParsedLine, SpeechSettings, Note, AppVoice } from '../types';

function spellingTurkishNumber(num: number): string {
  if (num === 0) return 'sıfır';
  
  const units = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
  const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
  const hundreds = ['', 'yüz', 'iki yüz', 'üç yüz', 'dört yüz', 'beş yüz', 'altı yüz', 'yedi yüz', 'sekiz yüz', 'dokuz yüz'];
  
  function parseLessThanThousand(n: number): string {
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;
    
    let res = '';
    if (h > 0) res += hundreds[h] + ' ';
    if (t > 0) res += tens[t] + ' ';
    if (u > 0) res += units[u];
    return res.trim();
  }
  
  const billionGroup = Math.floor(num / 1000000000);
  const millionGroup = Math.floor((num % 1000000000) / 1000000);
  const thousandGroup = Math.floor((num % 1000000) / 1000);
  const unitGroup = num % 1000;
  
  let result = '';
  if (billionGroup > 0) {
    result += parseLessThanThousand(billionGroup) + ' milyar ';
  }
  if (millionGroup > 0) {
    result += parseLessThanThousand(millionGroup) + ' milyon ';
  }
  if (thousandGroup > 0) {
    if (thousandGroup === 1) {
      result += 'bin ';
    } else {
      result += parseLessThanThousand(thousandGroup) + ' bin ';
    }
  }
  if (unitGroup > 0) {
    result += parseLessThanThousand(unitGroup);
  }
  return result.trim();
}

/**
 * Converts fully-uppercase words of length >= 2 into title case/lowercase
 * and spells out numbers/percentages in Turkish and English to make TTS sound 10x more human.
 */
function optimizeTextForTTS(text: string, lang: string = 'tr'): string {
  if (!text) return '';
  
  let formatted = text;
  
  // Normalize spaced-out English possessives or apostrophes (e.g. "Rowan ’ s", "Rowan ' s") to join as one word
  formatted = formatted.replace(/\b([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\s*['’`´‘ʼ᾽’'"’]\s*s\b/gi, '$1s');
  
  // Normalize other alphabetical possessives with apostrophes (e.g. "Rowan ’ ın") to join as one word
  formatted = formatted.replace(/\b([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\s*['’`´‘ʼ᾽’'"’]\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\b/g, '$1$2');

  // Normalize spaced suffix on numbers (e.g. "1923 ’ te" or "1923 ' te" to "1923'te")
  formatted = formatted.replace(/(\d+)\s*['’`´‘ʼ᾽’'"’]\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\b/g, '$1\'$2');

  
  // Format uppercase acronyms
  formatted = formatted.replace(/[A-ZÇĞİÖŞÜa-zçğıöşü]+/g, (word) => {
    if (word.length > 1 && word === word.toUpperCase()) {
      const lower = word.toLowerCase();
      return word.charAt(0) + lower.slice(1);
    }
    return word;
  });
  
  const isTr = lang.toLowerCase().startsWith('tr');
  if (isTr) {
    // Abbreviations mapping to human text
    const abbrevMap: Record<string, string> = {
      'pdf': 'pe de fe',
      'docx': 'dokiks',
      'txt': 'teks te',
      'ai': 'yapay zekâ',
      'tts': 'seslendirme',
      'api': 'a pi ay',
      'url': 'u re le',
      'gcp': 'ci si pi',
      'ui': 'kullanıcı arayüzü',
      'ux': 'kullanıcı deneyimi',
      'vs.': 've saire',
      'vb.': 've benzeri',
      'ms': 'milisaniye',
      'km': 'kilometre',
      'kg': 'kilogram',
      'mb': 'megabayt',
      'kb': 'kilobayt',
      'gb': 'giga bayt'
    };
    
    for (const [key, replacement] of Object.entries(abbrevMap)) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      formatted = formatted.replace(regex, replacement);
    }
    
    // Percentages %24
    formatted = formatted.replace(/%\s*(\d+)/g, (_, numStr) => {
      const num = parseInt(numStr, 10);
      return 'yüzde ' + spellingTurkishNumber(num);
    });
    
    // Decimals e.g. 3.5 or 3,5
    formatted = formatted.replace(/(\d+)[.,](\d+)/g, (_, p1, p2) => {
      const num1 = parseInt(p1, 10);
      const num2 = parseInt(p2, 10);
      return spellingTurkishNumber(num1) + ' virgül ' + spellingTurkishNumber(num2);
    });
    
    // Isolated integers
    formatted = formatted.replace(/\b\d+\b/g, (match) => {
      const num = parseInt(match, 10);
      if (isNaN(num) || num > 9999999999) return match;
      return spellingTurkishNumber(num);
    });
    
    // Core symbols
    formatted = formatted.replace(/&/g, ' ve ');
    formatted = formatted.replace(/\+/g, ' artı ');
    formatted = formatted.replace(/=/g, ' eşittir ');
    formatted = formatted.replace(/[-–]/g, ' eksi ');
  } else {
    // Percentages %24
    formatted = formatted.replace(/%\s*(\d+)/g, (_, numStr) => {
      return numStr + ' percent';
    });
    
    // Symbols
    formatted = formatted.replace(/&/g, ' and ');
    formatted = formatted.replace(/\+/g, ' plus ');
    formatted = formatted.replace(/=/g, ' equals ');
  }
  
  return formatted;
}

/**
 * Ranks a voice to prefer high-quality, neural, cloud, or natural sounding voices.
 */
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

/**
 * Filter and find the highest quality voice for a given language tag.
 */
function getBestVoiceForLanguage(voices: AppVoice[], targetLang: string): AppVoice | null {
  const matching = voices.filter(v => 
    v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase().replace('_', '-')) ||
    v.lang.toLowerCase().includes(targetLang.toLowerCase())
  );
  
  if (matching.length === 0) return null;
  
  return [...matching].sort((a, b) => rankVoice(b) - rankVoice(a))[0];
}

/**
 * Retrieves the absolute best aligned voice for target document language.
 * Ensures we NEVER read Turkish with English voices or vice versa, resolving the sticky English language state bug.
 */
export function getSpokenVoice(
  voices: AppVoice[],
  preferredVoiceURI: string,
  targetLang: string
): AppVoice | null {
  const normalizedTarget = (targetLang || 'tr').toLowerCase().split(/[-_]/)[0];
  
  // 1. If preferred voice exists, verify that its language aligns with the document's target language!
  if (preferredVoiceURI) {
    const preferred = voices.find(v => v.voiceURI === preferredVoiceURI);
    if (preferred) {
      const prefLangNorm = preferred.lang.toLowerCase().split(/[-_]/)[0];
      if (prefLangNorm === normalizedTarget) {
        return preferred;
      }
    }
  }
  
  // 2. Otherwise find the absolute highest-ranking voice of the targeted language
  const bestVoice = getBestVoiceForLanguage(voices, targetLang);
  if (bestVoice) return bestVoice;
  
  // 3. Last resort fallback
  return voices[0] || null;
}

/**
 * Resolves physical SpeechSynthesisVoice and custom pitch/rate parameters for virtual/simulated high-fidelity voices
 */
export function resolvePhysicalVoiceAndParams(
  selectedVoiceURI: string,
  baseRate: number,
  basePitch: number,
  voices: AppVoice[]
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { voice: null, rate: baseRate, pitch: basePitch };
  }
  
  const nativeVoices = window.speechSynthesis.getVoices();
  const matchedAppVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
  
  let resolvedPitch = basePitch;
  let resolvedRate = baseRate;
  let physicalURI = selectedVoiceURI;
  
  if (matchedAppVoice && matchedAppVoice.isVirtual) {
    resolvedPitch = matchedAppVoice.virtualPitch ?? basePitch;
    resolvedRate = baseRate * (matchedAppVoice.virtualRateMulti ?? 1.0);
    
    // Find absolute best native Turkish voice as the base physical voice for virtual Turkish voices
    // We prioritize native high quality, then general turkish, then first native voice
    const nativeTrVoice = nativeVoices.find(v => 
      v.lang.toLowerCase().replace('_', '-').startsWith('tr')
    ) || nativeVoices[0];
    
    if (nativeTrVoice) {
      physicalURI = nativeTrVoice.voiceURI;
    }
  }
  
  const physicalVoice = nativeVoices.find(v => v.voiceURI === physicalURI) || null;
  return {
    voice: physicalVoice,
    rate: resolvedRate,
    pitch: resolvedPitch
  };
}

export function useSpeechEngine(
  lines: ParsedLine[],
  onLineChange: (index: number) => void,
  onNoteTaken: (noteText: string, pageNum: number, lineNum: number, context: string) => void,
  articleLanguage?: string,
  initialLineIndex: number = 0
) {
  const [voices, setVoices] = useState<AppVoice[]>([]);
  // Adjusted default rate to 0.92 to ensure natural, calm, human cadence out-of-the-box
  const [settings, setSettings] = useState<SpeechSettings>({
    voiceURI: '',
    rate: 0.92,
    pitch: 1.0,
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIdx, setCurrentLineIdx] = useState(initialLineIndex);
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  const [dictationLanguage, setDictationLanguage] = useState<string>('tr');

  // Interactive Graph Encounter States
  const [activeGraphLine, setActiveGraphLine] = useState<ParsedLine | null>(null);
  const [isAwaitingGraphApproval, setIsAwaitingGraphApproval] = useState(false);
  const [graphSummaryText, setGraphSummaryText] = useState<string | null>(null);
  const [isSummarizingGraph, setIsSummarizingGraph] = useState(false);
  const [graphSpeechRecActive, setGraphSpeechRecActive] = useState(false);

  // Keep dictation language synchronized with the active document language initially
  useEffect(() => {
    if (articleLanguage) {
      setDictationLanguage(articleLanguage);
    }
  }, [articleLanguage]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isTransitioningRef = useRef(false);
  const currentLineIdxRef = useRef(initialLineIndex);
  const recognitionRef = useRef<any>(null);
  const handsFreeRecRef = useRef<any>(null);
  const graphApprovalRecRef = useRef<any>(null);

  // Sync index to ref to allow use in event handlers
  useEffect(() => {
    currentLineIdxRef.current = currentLineIdx;
  }, [currentLineIdx]);

  // Synchronize internal currentLineIdx when article lines or initial index changes
  useEffect(() => {
    if (lines.length > 0) {
      const idx = initialLineIndex >= 0 && initialLineIndex < lines.length ? initialLineIndex : 0;
      if (currentLineIdxRef.current !== idx) {
        setCurrentLineIdx(idx);
        currentLineIdxRef.current = idx;
      }
      // Always trigger callback to sync viewport scroll position when lines are loaded
      onLineChange(idx);
    } else {
      setCurrentLineIdx(0);
      currentLineIdxRef.current = 0;
    }
  }, [lines, initialLineIndex, onLineChange]);

  // Load and filter voices
  const updateVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const allVoices = window.speechSynthesis.getVoices();
    
    const mapped: AppVoice[] = allVoices.map(v => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      localService: v.localService,
      default: v.default,
    }));

    // Find the base Turkish voice
    const baseTr = allVoices.find(v => 
      v.lang.toLowerCase().replace('_', '-').startsWith('tr')
    ) || allVoices[0];

    if (baseTr) {
      // Prepend Turkish virtual premium voices
      const virtualVoices: AppVoice[] = [
        {
          voiceURI: 'virtual:tr:tolga',
          name: 'Yapay Zeka Erkek Sesi (Tolga - Derin)',
          lang: 'tr-TR',
          localService: baseTr.localService,
          default: false,
          isVirtual: true,
          virtualPitch: 0.68,
          virtualRateMulti: 0.95
        },
        {
          voiceURI: 'virtual:tr:cem',
          name: 'Yapay Zeka Erkek Sesi (Cem - Tok / Bilge)',
          lang: 'tr-TR',
          localService: baseTr.localService,
          default: false,
          isVirtual: true,
          virtualPitch: 0.58,
          virtualRateMulti: 0.88
        },
        {
          voiceURI: 'virtual:tr:dilara',
          name: 'Yapay Zeka Kadın Sesi (Dilara - Premium)',
          lang: 'tr-TR',
          localService: baseTr.localService,
          default: false,
          isVirtual: true,
          virtualPitch: 1.15,
          virtualRateMulti: 1.05
        },
        {
          voiceURI: 'virtual:tr:yelda',
          name: 'Yapay Zeka Kadın Sesi (Yelda - Doğal)',
          lang: 'tr-TR',
          localService: baseTr.localService,
          default: false,
          isVirtual: true,
          virtualPitch: 0.98,
          virtualRateMulti: 0.96
        }
      ];
      mapped.unshift(...virtualVoices);
    }
    
    setVoices(mapped);
  }, []);

  useEffect(() => {
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [updateVoices]);

  // Automatically switch voice lock when articleLanguage changes or voices are loaded
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis || voices.length === 0) return;
    
    const targetLang = articleLanguage || 'tr';
    const defaultVoice = 
      getBestVoiceForLanguage(voices, targetLang) || 
      getBestVoiceForLanguage(voices, 'tr') || 
      getBestVoiceForLanguage(voices, 'en') || 
      voices[0];
    
    if (defaultVoice) {
      setSettings(prev => {
        const currentVoice = prev.voiceURI ? voices.find(v => v.voiceURI === prev.voiceURI) : null;
        const matches = currentVoice && currentVoice.lang.toLowerCase().startsWith(targetLang.toLowerCase());
        
        if (!matches || !prev.voiceURI) {
          return {
            ...prev,
            voiceURI: defaultVoice.voiceURI,
          };
        }
        return prev;
      });
    }
  }, [articleLanguage, voices]);

  // Clear any active verbal graph response capturing session
  const clearGraphSession = useCallback(() => {
    if (graphApprovalRecRef.current) {
      try {
        graphApprovalRecRef.current.abort();
      } catch (e) {}
      graphApprovalRecRef.current = null;
    }
    setIsAwaitingGraphApproval(false);
    setActiveGraphLine(null);
    setGraphSummaryText(null);
    setGraphSpeechRecActive(false);
  }, []);

  // Map our language codes to full BCP-47 speech recognition locales
  const getRecognitionLocale = useCallback(() => {
    const speechRecognitionLangMap: Record<string, string> = {
      tr: 'tr-TR',
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      it: 'it-IT'
    };
    return speechRecognitionLangMap[dictationLanguage] || 'tr-TR';
  }, [dictationLanguage]);

  // Helper to trigger and process Graph Summarization
  const triggerGraphSummary = useCallback(async (line: ParsedLine, index: number) => {
    // Abort speech recognition actively listening
    if (graphApprovalRecRef.current) {
      try { graphApprovalRecRef.current.abort(); } catch (e) {}
      graphApprovalRecRef.current = null;
    }
    setGraphSpeechRecActive(false);

    if (line.graphSummary) {
      speakGraphSummary(line.graphSummary, index);
      return;
    }

    setIsSummarizingGraph(true);

    try {
      const response = await fetch("/api/gemini/summarize-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graphTitle: line.text,
          contextTitle: lines[0]?.text || '',
          language: articleLanguage || 'tr'
        })
      });
      const data = await response.json();
      const summary = data.summary;

      line.graphSummary = summary;
      setGraphSummaryText(summary);
      setIsSummarizingGraph(false);
      speakGraphSummary(summary, index);
    } catch (err) {
      console.error("Failed to fetch graph summary:", err);
      setIsSummarizingGraph(false);

      const isTr = (articleLanguage || 'tr').toLowerCase().startsWith('tr');
      const fallback = isTr
        ? `Bu görsel analiz grafiği, "${line.text}" verilerini göstermektedir. Geleneksel öğrenime karşı adaptif dijital asistan kullanımının başarı yüzdelerini karşılaştırmalı olarak incelemekte ve adaptif yazılım destekli sınıflarda genel akademik artış eğilimini açıkça göstermektedir.`
        : `This chart presents analytical trends regarding "${line.text}". It clearly indicates a measurable performance enhancement and efficiency rise corresponding with the adaptive assistance integrations detailed in the main text.`;

      line.graphSummary = fallback;
      setGraphSummaryText(fallback);
      speakGraphSummary(fallback, index);
    }
  }, [lines, articleLanguage]);

  // Handle graph skipping
  const skipGraphSummary = useCallback((index: number) => {
    if (graphApprovalRecRef.current) {
      try { graphApprovalRecRef.current.abort(); } catch (e) {}
      graphApprovalRecRef.current = null;
    }
    setGraphSpeechRecActive(false);
    setIsAwaitingGraphApproval(false);
    setActiveGraphLine(null);
    setGraphSummaryText(null);

    // Proceed directly to the next line
    const nextIdx = index + 1;
    if (nextIdx < lines.length) {
      setCurrentLineIdx(nextIdx);
      onLineChange(nextIdx);
      speakLine(nextIdx);
    } else {
      setIsPlaying(false);
      setCurrentLineIdx(0);
      onLineChange(0);
    }
  }, [lines, onLineChange]);

  // Natural audio presentation of the generated summary
  const speakGraphSummary = useCallback((summary: string, index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const isTr = (articleLanguage || 'tr').toLowerCase().startsWith('tr');
    const intro = isTr ? "Grafik Özeti: " : "Graph summary: ";
    
    // We pass language parameter so numbers inside summary are spelled out natively as well
    const utterance = new SpeechSynthesisUtterance(intro + optimizeTextForTTS(summary, articleLanguage || 'tr'));
    
    const resolved = resolvePhysicalVoiceAndParams(
      settings.voiceURI,
      settings.rate,
      settings.pitch,
      voices
    );
    if (resolved.voice) {
      utterance.voice = resolved.voice;
      utterance.lang = resolved.voice.lang;
    }
    
    utterance.rate = resolved.rate;
    utterance.pitch = resolved.pitch;

    utterance.onend = () => {
      // Clear visual graph blocks & advance
      setIsAwaitingGraphApproval(false);
      setActiveGraphLine(null);
      setGraphSummaryText(null);

      const nextIdx = index + 1;
      if (nextIdx < lines.length) {
        setCurrentLineIdx(nextIdx);
        onLineChange(nextIdx);
        speakLine(nextIdx);
      } else {
        setIsPlaying(false);
        setCurrentLineIdx(0);
        onLineChange(0);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voices, settings, lines, onLineChange, articleLanguage]);

  // Sub-handler to prompt the user out loud and spin recognition
  const handleGraphEncounter = useCallback((index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const line = lines[index];
    setActiveGraphLine(line);
    setIsAwaitingGraphApproval(true);

    const isTr = (articleLanguage || 'tr').toLowerCase().startsWith('tr');
    const promptText = isTr 
      ? "Grafiği sizin için özetlememi ister misiniz?" 
      : "Would you like me to summarize the graph for you?";

    const promptUtterance = new SpeechSynthesisUtterance(promptText);

    const resolved = resolvePhysicalVoiceAndParams(
      settings.voiceURI,
      settings.rate,
      settings.pitch,
      voices
    );
    if (resolved.voice) {
      promptUtterance.voice = resolved.voice;
      promptUtterance.lang = resolved.voice.lang;
    }
    
    promptUtterance.rate = resolved.rate;
    promptUtterance.pitch = resolved.pitch;

    promptUtterance.onend = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      try {
        if (graphApprovalRecRef.current) {
          graphApprovalRecRef.current.abort();
        }

        const rec = new SpeechRecognition();
        rec.lang = getRecognitionLocale();
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => {
          setGraphSpeechRecActive(true);
        };

        rec.onresult = (e: any) => {
          if (e.results.length > 0) {
            const txt = e.results[0][0].transcript.toLowerCase().trim();
            console.log("Graph verbal approval vote captured:", txt);

            const trYes = ['evet', 'özetle', 'lütfen', 'istiyorum', 'olur', 'anlat', 'olsun', 'tamam'];
            const enYes = ['yes', 'summarize', 'please', 'sure', 'okay', 'yep', 'yeah'];
            
            const trNo = ['hayır', 'geç', 'istemiyorum', 'hayir', 'atla', 'istemez', 'hayer'];
            const enNo = ['no', 'skip', 'ignore', 'stop', 'nope', 'pass'];

            const matchesYes = trYes.some(t => txt.includes(t)) || enYes.some(t => txt.includes(t)) || txt === 'evet';
            const matchesNo = trNo.some(t => txt.includes(t)) || enNo.some(t => txt.includes(t)) || txt === 'hayır' || txt === 'hayir';

            if (matchesYes) {
              rec.abort();
              triggerGraphSummary(line, index);
            } else if (matchesNo) {
              rec.abort();
              skipGraphSummary(index);
            }
          }
        };

        rec.onend = () => {
          setGraphSpeechRecActive(false);
          // Auto-timeout fallback: If silence lasts and user doesn't say anything, 
          // we do not block indefinitely. After 6 seconds, we continue normally.
          setTimeout(() => {
            // Checked if we are still stuck on this exact graph awaiting approval
            setActiveGraphLine(currentActive => {
              if (currentActive && currentActive.globalIndex === index && !graphSummaryText) {
                console.log("Graph vote timeout: skipping graph summary.");
                skipGraphSummary(index);
              }
              return currentActive;
            });
          }, 6500);
        };

        rec.onerror = () => {
          setGraphSpeechRecActive(false);
        };

        graphApprovalRecRef.current = rec;
        rec.start();
      } catch (inner) {
        console.error("Constructing approval recognition error:", inner);
        setGraphSpeechRecActive(false);
      }
    };

    window.speechSynthesis.speak(promptUtterance);
  }, [lines, settings, voices, articleLanguage, getRecognitionLocale, triggerGraphSummary, skipGraphSummary, graphSummaryText]);

  // Read sentence out loud
  const speakLine = useCallback((index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || lines.length === 0) return;

    if (index < 0 || index >= lines.length) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();

    const line = lines[index];
    // Optimize text for pronunciation with document correct language
    const utterance = new SpeechSynthesisUtterance(optimizeTextForTTS(line.text, articleLanguage || 'tr'));
    
    const resolved = resolvePhysicalVoiceAndParams(
      settings.voiceURI,
      settings.rate,
      settings.pitch,
      voices
    );
    if (resolved.voice) {
      utterance.voice = resolved.voice;
      utterance.lang = resolved.voice.lang;
    }

    utterance.rate = resolved.rate;
    utterance.pitch = resolved.pitch;

    utterance.onend = () => {
      if (isTransitioningRef.current) return;
      
      const isGraphLine = !!line.isGraph;
      if (isGraphLine) {
        // Intercept play flow and ask for verbal approval
        handleGraphEncounter(index);
      } else {
        const nextIdx = index + 1;
        if (nextIdx < lines.length) {
          setCurrentLineIdx(nextIdx);
          onLineChange(nextIdx);
          speakLine(nextIdx);
        } else {
          setIsPlaying(false);
          setCurrentLineIdx(0);
          onLineChange(0);
        }
      }
    };

    utterance.onerror = (e) => {
      console.warn('Utterance error or cancel context:', e.error);
      if (e.error !== 'interrupted') {
        setIsPlaying(false);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lines, settings, voices, onLineChange, articleLanguage, handleGraphEncounter]);

  // Play controls
  const play = useCallback(() => {
    if (lines.length === 0) return;
    clearGraphSession();
    setIsPlaying(true);
    speakLine(currentLineIdx);
  }, [lines, currentLineIdx, speakLine, clearGraphSession]);

  const pause = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    setIsPlaying(false);
    clearGraphSession();
    window.speechSynthesis.cancel();
  }, [clearGraphSession]);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    setIsPlaying(false);
    setCurrentLineIdx(0);
    onLineChange(0);
    clearGraphSession();
    window.speechSynthesis.cancel();
  }, [onLineChange, clearGraphSession]);

  const setLineIndex = useCallback((index: number) => {
    if (index < 0 || index >= lines.length) return;
    clearGraphSession();
    setCurrentLineIdx(index);
    onLineChange(index);
    if (isPlaying) {
      speakLine(index);
    }
  }, [lines, isPlaying, speakLine, onLineChange, clearGraphSession]);

  const nextSentence = useCallback(() => {
    const nextIdx = currentLineIdx + 1;
    if (nextIdx < lines.length) {
      setLineIndex(nextIdx);
    }
  }, [currentLineIdx, lines.length, setLineIndex]);

  const prevSentence = useCallback(() => {
    const prevIdx = currentLineIdx - 1;
    if (prevIdx >= 0) {
      setLineIndex(prevIdx);
    }
  }, [currentLineIdx, setLineIndex]);

  // Clean-up synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (graphApprovalRecRef.current) {
        graphApprovalRecRef.current.abort();
      }
    };
  }, []);

  const lastSettingsRef = useRef({ rate: settings.rate, voiceURI: settings.voiceURI });

  useEffect(() => {
    const rateChanged = lastSettingsRef.current.rate !== settings.rate;
    const voiceChanged = lastSettingsRef.current.voiceURI !== settings.voiceURI;

    lastSettingsRef.current = { rate: settings.rate, voiceURI: settings.voiceURI };

    if ((rateChanged || voiceChanged) && isPlaying && lines.length > 0) {
      speakLine(currentLineIdx);
    }
  }, [settings.rate, settings.voiceURI, isPlaying, lines.length, currentLineIdx, speakLine]);

  const lastLinesRef = useRef(lines);
  const lastLangRef = useRef(articleLanguage);

  useEffect(() => {
    const linesChanged = lastLinesRef.current !== lines;
    const langChanged = lastLangRef.current !== articleLanguage;
    
    lastLinesRef.current = lines;
    lastLangRef.current = articleLanguage;

    if ((linesChanged || langChanged) && isPlaying && lines.length > 0) {
      speakLine(currentLineIdx);
    }
  }, [lines, articleLanguage, isPlaying, currentLineIdx, speakLine]);

  // --- SPEECH RECORDING (STT) ---
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.lang = getRecognitionLocale();
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsSpeechListening(true);
      };

      rec.onresult = (e: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            currentFinal += e.results[i][0].transcript;
          } else {
            currentInterim += e.results[i][0].transcript;
          }
        }

        if (currentFinal) {
          setFinalTranscript(prev => prev + ' ' + currentFinal);
        }
        setInterimTranscript(currentInterim);
      };

      rec.onend = () => {
        setIsSpeechListening(false);
      };

      rec.onerror = (e: any) => {
        if (e.error === 'aborted' || e.error === 'no-speech') return;
        console.error('Speech recognition error:', e.error);
        setIsSpeechListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Failed to construct SpeechRecognition:', e);
      setIsSpeechListening(false);
    }
  }, [getRecognitionLocale]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsSpeechListening(false);
  }, []);

  const changeDictationLanguage = useCallback((lang: string) => {
    setDictationLanguage(lang);
    
    if (isSpeechListening) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      
      setTimeout(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        try {
          const rec = new SpeechRecognition();
          const speechRecognitionLangMap: Record<string, string> = {
            tr: 'tr-TR',
            en: 'en-US',
            de: 'de-DE',
            fr: 'fr-FR',
            es: 'es-ES',
            it: 'it-IT'
          };
          rec.lang = speechRecognitionLangMap[lang] || 'tr-TR';
          rec.continuous = true;
          rec.interimResults = true;

          rec.onstart = () => {
            setIsSpeechListening(true);
          };

          rec.onresult = (e: any) => {
            let currentInterim = '';
            let currentFinal = '';

            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) {
                currentFinal += e.results[i][0].transcript;
              } else {
                currentInterim += e.results[i][0].transcript;
              }
            }

            if (currentFinal) {
              setFinalTranscript(prev => prev + ' ' + currentFinal);
            }
            setInterimTranscript(currentInterim);
          };

          rec.onend = () => {
            setIsSpeechListening(false);
          };

          rec.onerror = (e: any) => {
            if (e.error === 'aborted' || e.error === 'no-speech') return;
            console.error('Speech recognition error on restart:', e.error);
            setIsSpeechListening(false);
          };

          recognitionRef.current = rec;
          rec.start();
        } catch (e) {
          console.error('Failed to reconstruct SpeechRecognition:', e);
          setIsSpeechListening(false);
        }
      }, 150);
    }
  }, [isSpeechListening]);

  // Custom trigger note-taking action
  const triggerNoteTaking = useCallback(() => {
    pause();
    setIsRecordingNote(true);
    setInterimTranscript('');
    setFinalTranscript('');
    startSpeechRecognition();
  }, [pause, startSpeechRecognition]);

  const cancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsRecordingNote(false);
    setIsSpeechListening(false);
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  const saveRecordedNote = useCallback((editedText?: string) => {
    const finalNoteText = (editedText || finalTranscript || interimTranscript).trim();
    if (!finalNoteText) return;

    const currentLine = lines[currentLineIdxRef.current];
    if (currentLine) {
      onNoteTaken(
        finalNoteText,
        currentLine.pageNumber,
        currentLine.lineNumber,
        currentLine.text
      );
    } else {
      onNoteTaken(
        finalNoteText,
        1,
        1,
        'Yüklenen Makale'
      );
    }

    cancelRecording();
  }, [lines, onNoteTaken, cancelRecording, finalTranscript, interimTranscript]);

  const approveGraphSummary = useCallback(() => {
    if (activeGraphLine) {
      triggerGraphSummary(activeGraphLine, activeGraphLine.globalIndex);
    }
  }, [activeGraphLine, triggerGraphSummary]);

  const declineGraphSummary = useCallback(() => {
    if (activeGraphLine) {
      skipGraphSummary(activeGraphLine.globalIndex);
    }
  }, [activeGraphLine, skipGraphSummary]);

  // --- HANDS-FREE continuous voice active listener ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !isHandsFreeActive) {
      if (handsFreeRecRef.current) {
        handsFreeRecRef.current.abort();
        handsFreeRecRef.current = null;
      }
      return;
    }

    let hfRec: any = null;
    
    const startHandsFree = () => {
      try {
        hfRec = new SpeechRecognition();
        hfRec.lang = getRecognitionLocale();
        hfRec.continuous = true;
        hfRec.interimResults = true;

        hfRec.onresult = (e: any) => {
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const txt = e.results[i][0].transcript.toLowerCase();
            
            const trTriggers = ['dur not', 'not alalım', 'dur yazalım', 'dur kaydet', 'dur', 'not'];
            const enTriggers = ['stop reading', 'pause reading', 'take note', 'stop note', 'pause', 'note'];
            const deTriggers = ['stopp', 'pause', 'notiz schreiben', 'halt', 'notiz'];
            const frTriggers = ['pause', 'arrêter', 'prendre note', 'arrête', 'note'];
            const esTriggers = ['pausa', 'parar', 'tomar nota', 'para', 'nota'];
            const itTriggers = ['pausa', 'ferma', 'prendi nota', 'nota'];

            const activeLang = articleLanguage || 'tr';
            const isTriggered = 
              (activeLang === 'tr' && trTriggers.some(t => txt.includes(t))) ||
              (activeLang === 'en' && enTriggers.some(t => txt.includes(t))) ||
              (activeLang === 'de' && deTriggers.some(t => txt.includes(t))) ||
              (activeLang === 'fr' && frTriggers.some(t => txt.includes(t))) ||
              (activeLang === 'es' && esTriggers.some(t => txt.includes(t))) ||
              (activeLang === 'it' && itTriggers.some(t => txt.includes(t))) ||
              txt.includes('dur not') || txt.includes('take note') || txt.includes('not');

            if (isTriggered) {
              hfRec.abort();
              triggerNoteTaking();
              return;
            }
          }
        };

        hfRec.onend = () => {
          if (isHandsFreeActive && !isRecordingNote) {
            try {
              hfRec.start();
            } catch (err) {}
          }
        };

        hfRec.onerror = (e: any) => {
          if (e.error === 'not-allowed') {
            setIsHandsFreeActive(false);
          }
        };

        handsFreeRecRef.current = hfRec;
        hfRec.start();
      } catch (err) {
        console.error('Hands Free initialization failed:', err);
      }
    };

    if (isHandsFreeActive && !isRecordingNote) {
      startHandsFree();
    } else {
      if (handsFreeRecRef.current) {
        handsFreeRecRef.current.abort();
        handsFreeRecRef.current = null;
      }
    }

    return () => {
      if (hfRec) {
        hfRec.abort();
      }
    };
  }, [isHandsFreeActive, isRecordingNote, triggerNoteTaking, getRecognitionLocale, articleLanguage]);

  return {
    voices,
    settings,
    setSettings,
    isPlaying,
    currentLineIdx,
    isRecordingNote,
    isSpeechListening,
    interimTranscript,
    finalTranscript,
    isHandsFreeActive,
    setIsHandsFreeActive,
    setInterimTranscript,
    setFinalTranscript,
    dictationLanguage,
    changeDictationLanguage,
    
    // Graph Integration Exposes
    activeGraphLine,
    isAwaitingGraphApproval,
    graphSummaryText,
    isSummarizingGraph,
    graphSpeechRecActive,
    approveGraphSummary,
    declineGraphSummary,
    
    // Controls
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
  };
}
