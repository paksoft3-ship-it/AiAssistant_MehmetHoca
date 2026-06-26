import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hands-free, back-and-forth voice conversation with the AI (CLAUDE.md §10, §14.4)
 * — like a phone call / ChatGPT voice mode: you speak, the assistant speaks
 * back, and listening resumes automatically for the next turn.
 *
 * It owns its OWN SpeechRecognition instance (separate from note dictation) and
 * coordinates a strict state machine so the microphone is never open while the
 * assistant is talking (prevents the TTS voice feeding back into recognition).
 */

export type VoiceConversationState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface VoiceTurn {
  role: 'user' | 'assistant';
  content: string;
  isFallback?: boolean;
}

export interface UseVoiceConversationOptions {
  /** BCP-47 locale for recognition, e.g. "tr-TR". */
  locale: string;
  /** Sends the user's utterance (with history) and resolves the AI reply. */
  onAsk: (text: string) => Promise<{ text: string; isFallback: boolean }>;
  /** Speaks the AI reply aloud, invoking the callback when playback ends. */
  onSpeak: (text: string, onEnd: () => void) => void;
  /** Cancels any in-flight speech. */
  onStopSpeak: () => void;
  /** Appends a finished turn to the visible transcript. */
  onTurn: (turn: VoiceTurn) => void;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
  onstart: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isVoiceConversationSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function useVoiceConversation(opts: UseVoiceConversationOptions) {
  const { locale } = opts;

  const [state, setState] = useState<VoiceConversationState>('idle');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  // `active` gates the auto-restart loop; cleared the instant the user stops.
  const activeRef = useRef(false);
  // Latest options in refs so the long-lived recognition handlers never close
  // over stale callbacks.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const stateRef = useRef<VoiceConversationState>('idle');
  const setPhase = useCallback((s: VoiceConversationState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const teardownRecognition = useCallback(() => {
    const rec = recRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onstart = null;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || !activeRef.current) return;
    teardownRecognition();

    const rec = new Ctor();
    rec.lang = locale;
    rec.continuous = false; // one utterance per turn
    rec.interimResults = true;

    let finalText = '';

    rec.onstart = () => {
      setInterim('');
      setPhase('listening');
    };

    rec.onresult = (e: any) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
    };

    rec.onerror = (e: any) => {
      if (e?.error === 'no-speech' || e?.error === 'aborted') return; // handled by onend
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        activeRef.current = false;
        setError('Mikrofon izni verilmedi. Sesli sohbet için mikrofona izin verin.');
        setPhase('error');
      }
    };

    rec.onend = () => {
      if (!activeRef.current) return;
      const said = finalText.trim();
      if (!said) {
        // Silence — keep the conversation open by listening again.
        startListening();
        return;
      }
      void handleUserUtterance(said);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() can throw if called too quickly after a previous session.
      setTimeout(() => {
        if (activeRef.current) startListening();
      }, 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, setPhase, teardownRecognition]);

  const handleUserUtterance = useCallback(
    async (said: string) => {
      teardownRecognition();
      setInterim('');
      optsRef.current.onTurn({ role: 'user', content: said });
      setPhase('thinking');
      try {
        const { text, isFallback } = await optsRef.current.onAsk(said);
        if (!activeRef.current) return; // user stopped while we were thinking
        optsRef.current.onTurn({ role: 'assistant', content: text, isFallback });
        setPhase('speaking');
        optsRef.current.onSpeak(text, () => {
          if (activeRef.current) startListening();
        });
      } catch {
        if (!activeRef.current) return;
        const msg = 'Yapay zeka tartışma servisine ulaşılamadı.';
        optsRef.current.onTurn({ role: 'assistant', content: msg, isFallback: true });
        setPhase('speaking');
        optsRef.current.onSpeak(msg, () => {
          if (activeRef.current) startListening();
        });
      }
    },
    [setPhase, startListening, teardownRecognition],
  );

  const start = useCallback(() => {
    if (!isVoiceConversationSupported()) {
      setError('Tarayıcınız sesli sohbet için konuşma tanımayı desteklemiyor.');
      setPhase('error');
      return;
    }
    setError(null);
    activeRef.current = true;
    startListening();
  }, [setPhase, startListening]);

  const stop = useCallback(() => {
    activeRef.current = false;
    teardownRecognition();
    optsRef.current.onStopSpeak();
    setInterim('');
    setPhase('idle');
  }, [setPhase, teardownRecognition]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      activeRef.current = false;
      teardownRecognition();
      try {
        optsRef.current.onStopSpeak();
      } catch {
        /* ignore */
      }
    };
  }, [teardownRecognition]);

  const isActive = state !== 'idle' && state !== 'error';

  return { state, interim, error, isActive, start, stop };
}
