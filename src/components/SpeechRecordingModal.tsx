import { useEffect, useState, useRef } from 'react';
import { 
  Mic, Check, X, ShieldAlert, Edit, MicOff, RefreshCw, 
  Send, Volume2, VolumeX, MessageSquare, Trash2 
} from 'lucide-react';
import { getSpokenVoice } from '../hooks/useSpeechEngine';
import { SpeechSettings } from '../types';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface SpeechRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  interimTranscript: string;
  finalTranscript: string;
  contextText: string;
  onSave: (text: string) => void;
  pageNumber: number;
  lineNumber: number;
  isSpeechListening: boolean;
  onStartSpeech: () => void;
  onStopSpeech: () => void;
  dictationLanguage: string;
  onChangeDictationLanguage: (lang: string) => void;
  voices?: SpeechSynthesisVoice[];
  settings?: SpeechSettings;
  onClearTranscript?: () => void;
  articleTitle?: string;
}

export default function SpeechRecordingModal({
  isOpen,
  onClose,
  interimTranscript,
  finalTranscript,
  contextText,
  onSave,
  pageNumber,
  lineNumber,
  isSpeechListening,
  onStartSpeech,
  onStopSpeech,
  dictationLanguage = 'tr',
  onChangeDictationLanguage,
  voices = [],
  settings,
  onClearTranscript,
  articleTitle = '',
}: SpeechRecordingModalProps) {
  const [activeTab, setActiveTab] = useState<'note' | 'debate'>('note');
  const [editableNote, setEditableNote] = useState('');
  const [isTypingMode, setIsTypingMode] = useState(false);

  // AI debate parameters
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiSpeechEnabled, setIsAiSpeechEnabled] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize/Reset debate messages when modal opens or sentence changes
  useEffect(() => {
    if (isOpen) {
      setChatMessages([
        {
          role: 'model',
          content: `Merhaba! Durup düşünmek ve beyin fırtınası yapmak için harika bir yer. Bu cümle hakkında ne düşünüyorsunuz? Sorularınızı, katılmadığınız noktaları veya yorumlarınızı benimle özgürce paylaşabilirsiniz! 👇`
        }
      ]);
      setChatInput('');
      setIsAiLoading(false);
    }
  }, [isOpen, contextText]);

  // Sync incoming transcript values to local states depending on activeTab
  useEffect(() => {
    if (isOpen) {
      const fullTxt = (finalTranscript + ' ' + interimTranscript).trim();
      if (activeTab === 'note') {
        setEditableNote(fullTxt);
      } else {
        setChatInput(fullTxt);
      }
    }
  }, [finalTranscript, interimTranscript, isOpen, activeTab]);

  // Reset tab and editing flags when opening
  useEffect(() => {
    if (isOpen) {
      setIsTypingMode(false);
    }
  }, [isOpen]);

  // Handle auto-scroll inside chat
  useEffect(() => {
    if (activeTab === 'debate' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isAiLoading]);

  // Keep speech synthesis quiet when modal is closed
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveNoteDirectly = () => {
    onSave(editableNote);
  };

  const handleSaveWithDebate = () => {
    let finalNote = '';
    
    if (editableNote.trim()) {
      finalNote += `${editableNote.trim()}\n\n`;
    }
    
    // Compile and chain the chat debate dialogue chronological transcript
    const academicDiscussion = chatMessages
      .slice(1) // skip initial greeting welcome prompt
      .map(m => `${m.role === 'user' ? 'Siz' : 'Tartışma Arkadaşı (AI)'}: ${m.content}`)
      .join('\n\n');
      
    if (academicDiscussion) {
      finalNote += `=== Yapay Zeka Tartışma Kaydı ===\n${academicDiscussion}`;
    } else {
      if (!finalNote) {
        finalNote = editableNote;
      }
    }
    
    onSave(finalNote);
  };

  const speakDebateResponse = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      if (voices && voices.length > 0) {
        const targetVoice = getSpokenVoice(voices, settings?.voiceURI || '', 'tr');
        if (targetVoice) {
          utterance.voice = targetVoice;
          utterance.lang = targetVoice.lang;
        }
      }
      utterance.rate = settings?.rate || 0.95;
      utterance.pitch = settings?.pitch || 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendDebateMessage = async () => {
    const messageText = chatInput.trim();
    if (!messageText || isAiLoading) return;

    // Save user message to flow list
    const userMsg = { role: 'user' as const, content: messageText };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsAiLoading(true);

    // Call callback to clear live transcript in the parent speech engine immediately,
    // so user can record their next question cleanly from zero
    if (onClearTranscript) {
      onClearTranscript();
    }

    try {
      const response = await fetch('/api/gemini/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          contextText,
          articleTitle
        })
      });

      if (!response.ok) {
        throw new Error('Yapay zeka tartışma yanıtı alınamadı.');
      }

      const data = await response.json();
      const aiReply = data.text || 'Anlaşılamadı.';
      
      const newMessages = [...updatedMessages, { role: 'model' as const, content: aiReply }];
      setChatMessages(newMessages);

      if (isAiSpeechEnabled) {
        speakDebateResponse(aiReply);
      }
    } catch (err) {
      console.error('Error during AI debate:', err);
      setChatMessages(prev => [
        ...prev,
        { role: 'model', content: 'Üzgünüm, şu an bağlantıda veya yapay zeka servisinde bir sorun oluştu. Lütfen tekrar dener misiniz?' }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearDebate = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setChatMessages([
      {
        role: 'model',
        content: `Diyalog sıfırlandı. Bu cümle hakkında beyin fırtınasına baştan başlayabilirsiniz: "${contextText}"`
      }
    ]);
    setChatInput('');
    if (onClearTranscript) {
      onClearTranscript();
    }
  };

  const hasSpeechSupport = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        
        {/* Animated Background Progress line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600 animate-pulse" />

        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-sans font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <span>🎙️ Dur! Not Alalım</span>
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Konum: Sayfa {pageNumber}, Satır {lineNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              id="close-recording-modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Reference sentence (original context element) */}
          <div className="my-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200/50 dark:bg-slate-800/40 dark:border-slate-800">
            <span className="text-2xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Referans Cümle
            </span>
            <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300 leading-relaxed">
              &ldquo;{contextText}&rdquo;
            </p>
          </div>

          {/* Dual Tab Switcher */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 mb-4 font-sans">
            <button
              onClick={() => {
                setActiveTab('note');
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`flex-1 py-2.5 text-xs font-extrabold text-center border-b-2 transition duration-200 cursor-pointer ${
                activeTab === 'note'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
              }`}
              id="tab-note-direct"
            >
              📝 1. Kişisel Not Yaz
            </button>
            <button
              onClick={() => {
                setActiveTab('debate');
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`flex-1 py-2.5 text-xs font-extrabold text-center border-b-2 transition duration-200 cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'debate'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
              }`}
              id="tab-note-debate"
            >
              <span>🤝 2. Gemini ile Tartış</span>
              <span className="inline-flex h-4 items-center justify-center rounded-full bg-indigo-50 px-1.5 text-[9px] font-extrabold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                Gemini
              </span>
            </button>
          </div>

          {/* TAB 1: STANDARD DIRECT NOTE-TAKING */}
          {activeTab === 'note' && (
            <div className="space-y-4" id="direct-note-tab-body">
              {/* Dictation Language Selection Bar */}
              {hasSpeechSupport && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/30">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    🎙️ Konuşma Algılama Dili / Note Voice Language
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {[
                      { code: 'tr', label: 'TR', name: 'Türkçe' },
                      { code: 'en', label: 'EN', name: 'English' },
                      { code: 'de', label: 'DE', name: 'Deutsch' },
                      { code: 'fr', label: 'FR', name: 'Français' },
                      { code: 'es', label: 'ES', name: 'Español' },
                      { code: 'it', label: 'IT', name: 'Italiano' },
                    ].map((l) => {
                      const isActive = dictationLanguage === l.code;
                      return (
                        <button
                          key={l.code}
                          onClick={() => onChangeDictationLanguage(l.code)}
                          className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-2xs font-extrabold uppercase transition duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/50 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                          }`}
                          title={`${l.name} dilinde sesli not kaydet`}
                        >
                          <span>{l.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STT/Manual visual state cards */}
              <div className="flex flex-col items-center justify-center py-2 h-28 bg-slate-50/50 rounded-xl dark:bg-slate-850">
                {hasSpeechSupport ? (
                  isSpeechListening ? (
                    <>
                      <div className="relative flex h-14 w-14 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-20" />
                        <span className="absolute inline-flex h-11 w-11 animate-pulse rounded-full bg-red-100 opacity-60 dark:bg-red-950/40" />
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                          <Mic className="h-4 w-4 animate-pulse" />
                        </div>
                      </div>
                      <p className="mt-2 font-sans font-semibold text-xs text-red-600 animate-pulse">
                        Sizi dinliyorum, fikirlerinizi söyleyin...
                      </p>
                      <button
                        onClick={onStopSpeech}
                        className="mt-1 text-[10px] text-slate-500 underline hover:text-slate-700"
                      >
                        Mikrofonu Duraklat
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <MicOff className="h-4 w-4" />
                      </div>
                      <p className="mt-1.5 font-sans font-semibold text-xs text-slate-500">
                        Mikrofon Duraklatıldı
                      </p>
                      <button
                        onClick={onStartSpeech}
                        className="mt-1 inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                      >
                        <Mic className="h-3 w-3" />
                        <span>Sesle Yazdır</span>
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                      <Edit className="h-5 w-5" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Klavyeden Notunuzu Yazın</p>
                  </>
                )}
              </div>

              {/* Text draft section */}
              <div>
                <textarea
                  value={editableNote}
                  onChange={(e) => {
                    setEditableNote(e.target.value);
                    setIsTypingMode(true);
                  }}
                  placeholder={
                    hasSpeechSupport 
                      ? "Fikirlerinizi konuşarak yazdırın veya buraya dokunup klavye ile yazmaya başlayın..." 
                      : "Notunuzu buraya yazın..."
                  }
                  className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  id="note-editing-textarea"
                />
                
                {!hasSpeechSupport && (
                  <div className="mt-1 flex items-center space-x-1 text-[10px] text-amber-600">
                    <ShieldAlert className="h-3 w-3 flex-none" />
                    <span>Tarayıcınız ses tanımayı desteklemediği için notunuzu klavyeyle yazabilirsiniz.</span>
                  </div>
                )}
              </div>

              {/* Action buttons at bottom */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  onClick={onClose}
                  className="flex items-center space-x-1 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition duration-150 cursor-pointer dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                  <span>Vazgeç</span>
                </button>
                <button
                  onClick={handleSaveNoteDirectly}
                  disabled={!editableNote.trim()}
                  className={`flex items-center space-x-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white transition duration-150 cursor-pointer ${
                    editableNote.trim()
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                      : 'bg-slate-200 cursor-not-allowed text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                  }`}
                  id="save-note-btn"
                >
                  <Check className="h-4 w-4" />
                  <span>Notu Kaydet</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AI DEBATE / CHAT DIALOGUE */}
          {activeTab === 'debate' && (
            <div className="space-y-3" id="ai-debate-tab-body">
              {/* Chat Thread Scroller */}
              <div 
                className="w-full h-44 rounded-xl border border-slate-100 bg-slate-50/50 p-3 overflow-y-auto space-y-2 dark:border-slate-800 dark:bg-slate-950/20"
                id="ai-debate-chat-scroller"
              >
                {chatMessages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={index}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-2xs leading-relaxed font-sans ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                          : 'bg-slate-150 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/40 dark:border-slate-700'
                      }`}>
                        <div className="font-semibold mb-0.5 text-[9px] opacity-75">
                          {isUser ? 'Siz' : 'Tartışma Arkadaşı (Yapay Zeka)'}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Loading state indicator */}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-500 rounded-xl rounded-bl-none px-3 py-2 text-2xs dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700">
                      <div className="font-semibold mb-0.5 text-[9px] opacity-75">Yapay Zeka</div>
                      <div className="flex items-center space-x-1 py-1">
                        <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-[10px] text-slate-400 pl-1 font-mono">Düşünüyor...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim() && !isAiLoading) {
                      handleSendDebateMessage();
                    }
                  }}
                  placeholder={
                    isSpeechListening 
                      ? "Konuşun... Söyledikleriniz buraya yazılıyor..." 
                      : "Fikrinizi buraya yazın veya mikrofondan söyleyin..."
                  }
                  className="flex-1 rounded-xl border border-slate-200 py-2 px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  disabled={isAiLoading}
                  id="ai-debate-input-field"
                />

                {/* Transcribing microphone button */}
                <button
                  onClick={isSpeechListening ? onStopSpeech : onStartSpeech}
                  disabled={isAiLoading}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    isSpeechListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 dark:bg-slate-800 dark:border-slate-800 dark:hover:bg-slate-700'
                  }`}
                  title={isSpeechListening ? 'Mikrofonu Duraklat' : 'Sesle Soru Sor'}
                  id="ai-debate-speech-btn"
                >
                  <Mic className="h-4 w-4" />
                </button>

                {/* Speech audio toggle reader */}
                <button
                  onClick={() => setIsAiSpeechEnabled(prev => !prev)}
                  className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    isAiSpeechEnabled
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-950/55 dark:text-indigo-400 dark:border-indigo-900/50'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-400 dark:bg-slate-800 dark:border-slate-800 dark:hover:bg-slate-700'
                  }`}
                  title={isAiSpeechEnabled ? 'Yapay zeka cevaplarını seslendir: AÇIK' : 'Yapay zeka cevaplarını seslendir: KAPALI'}
                  id="ai-debate-tts-toggle-btn"
                >
                  {isAiSpeechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendDebateMessage}
                  disabled={!chatInput.trim() || isAiLoading}
                  className={`p-2 rounded-xl text-white transition font-bold text-xs flex items-center justify-center ${
                    chatInput.trim() && !isAiLoading
                      ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-xs'
                      : 'bg-slate-200 cursor-not-allowed text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                  }`}
                  id="ai-debate-send-btn"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {/* Extra input draft for personal note comment together with debate */}
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                  ✍️ Notunuza eklemek istediğiniz kendi yorumunuz (İsteğe Bağlı)
                </span>
                <textarea
                  value={editableNote}
                  onChange={(e) => setEditableNote(e.target.value)}
                  placeholder="Yapay zeka ile yaptığınız tartışmaya ek tescil etmek istediğiniz kendi yorum veya özetiniz..."
                  className="w-full min-h-[40px] rounded-lg border border-slate-200 bg-white p-2 text-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  id="debate-side-editable-note"
                />
              </div>

              {/* Action buttons at bottom */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 mt-2">
                {/* Clean chat thread history button */}
                <button
                  onClick={handleClearDebate}
                  className="flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-2xs font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition duration-150 cursor-pointer dark:hover:bg-red-950/20"
                  title="Tartışma geçmişini sıfırla"
                  id="clear-debate-history-btn"
                >
                  <Trash2 className="h-3. w-3.5" />
                  <span>Sıfırla</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onClose}
                    className="flex items-center space-x-1 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition duration-150 cursor-pointer dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                    <span>Vazgeç</span>
                  </button>
                  <button
                    onClick={handleSaveWithDebate}
                    disabled={chatMessages.length <= 1 && !editableNote.trim()}
                    className={`flex items-center space-x-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white transition duration-150 cursor-pointer ${
                      chatMessages.length > 1 || editableNote.trim()
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                        : 'bg-slate-200 cursor-not-allowed text-slate-400 dark:bg-slate-800'
                    }`}
                    id="save-note-debate-btn"
                  >
                    <Check className="h-4 w-4" />
                    <span>Tartışmayla Birlikte Kaydet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
