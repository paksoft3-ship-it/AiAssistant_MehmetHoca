import { edgeShortName } from './edgeVoices';

/**
 * Plays natural neural speech by fetching server-rendered MP3 from `/api/tts`
 * and playing it through a single reused <audio> element.
 *
 * Designed to drop into the existing per-sentence reading loop: each call
 * supersedes the previous one (so changing voice/speed or skipping sentences
 * cancels the in-flight clip cleanly), and `onEnd` fires when a clip finishes
 * — exactly like `SpeechSynthesisUtterance.onend` — so the engine can advance
 * to the next sentence without caring which backend produced the audio.
 */

export interface EdgePlayHandlers {
  onEnd: () => void;
  onError: (error: unknown) => void;
}

export class EdgeTtsPlayer {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private controller: AbortController | null = null;
  /** Monotonic token; only the latest request is allowed to take effect. */
  private token = 0;

  async play(
    text: string,
    voiceURI: string,
    rate: number,
    pitch: number,
    lang: string,
    handlers: EdgePlayHandlers,
  ): Promise<void> {
    this.cancel();
    const myToken = ++this.token;

    const controller = new AbortController();
    this.controller = controller;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: edgeShortName(voiceURI), rate, pitch, lang }),
        signal: controller.signal,
      });

      if (myToken !== this.token) return; // superseded while fetching
      if (!res.ok) {
        handlers.onError(new Error(`tts request failed (${res.status})`));
        return;
      }

      const blob = await res.blob();
      if (myToken !== this.token) return; // superseded while reading body

      const url = URL.createObjectURL(blob);
      this.objectUrl = url;

      const audio = new Audio(url);
      this.audio = audio;
      audio.onended = () => {
        if (myToken !== this.token) return;
        this.revokeUrl();
        handlers.onEnd();
      };
      audio.onerror = () => {
        if (myToken !== this.token) return;
        this.revokeUrl();
        handlers.onError(new Error('audio playback error'));
      };

      await audio.play();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // expected on cancel
      if (myToken === this.token) handlers.onError(err);
    }
  }

  /** Pauses the current clip without discarding it (resume re-fetches the line). */
  pause(): void {
    this.audio?.pause();
  }

  /** Stops playback, aborts any in-flight request, and frees resources. */
  cancel(): void {
    this.token++; // invalidate any pending callbacks
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      try {
        this.audio.pause();
      } catch {
        /* ignore */
      }
      this.audio.src = '';
      this.audio = null;
    }
    this.revokeUrl();
  }

  private revokeUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
