/**
 * Centralized, multilingual voice-command + wake-phrase map (CLAUDE.md §10.4 —
 * "keep multilingual command maps in a dedicated configuration file"). Pure and
 * testable; consumed by the hands-free / standby flows.
 */
export type VoiceCommand =
  | 'take_note'
  | 'stop_reading'
  | 'continue_reading'
  | 'next'
  | 'previous'
  | 'save'
  | 'cancel'
  | 'go_home'
  | 'read_notes';

type CommandMap = Record<VoiceCommand, string[]>;

/** Phrase fragments per command, lower-cased. Matched as substrings. */
export const COMMANDS: Record<'tr' | 'en', CommandMap> = {
  tr: {
    take_note: ['dur not', 'not alalım', 'not ekle', 'not al'],
    stop_reading: ['okumayı durdur', 'dur'],
    continue_reading: ['devam et', 'okumaya devam'],
    next: ['sonraki', 'ileri'],
    previous: ['önceki', 'geri'],
    save: ['kaydet'],
    cancel: ['vazgeç', 'iptal'],
    go_home: ['ana sayfa', 'ana sayfaya dön'],
    read_notes: ['notları oku', 'son notu oku'],
  },
  en: {
    take_note: ['take a note', 'add note', 'note this', 'stop lets note'],
    stop_reading: ['stop reading', 'pause'],
    continue_reading: ['continue', 'resume reading'],
    next: ['next'],
    previous: ['previous', 'back'],
    save: ['save'],
    cancel: ['cancel', 'discard'],
    go_home: ['go home', 'home'],
    read_notes: ['read notes', 'read my notes'],
  },
};

function normalize(s: string): string {
  return s.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

/** True when the transcript contains any of the wake phrases. */
export function matchWakePhrase(transcript: string, wakePhrases: string[]): boolean {
  const t = normalize(transcript);
  return wakePhrases.some((p) => p && t.includes(normalize(p)));
}

/**
 * Resolve a transcript to a command. Longer phrase fragments win so that, e.g.,
 * "okumayı durdur" maps to stop_reading rather than the bare "dur".
 */
export function matchCommand(transcript: string, lang: 'tr' | 'en' = 'tr'): VoiceCommand | null {
  const t = normalize(transcript);
  let best: { cmd: VoiceCommand; len: number } | null = null;
  for (const [cmd, phrases] of Object.entries(COMMANDS[lang]) as [VoiceCommand, string[]][]) {
    for (const phrase of phrases) {
      const p = normalize(phrase);
      if (t.includes(p) && (!best || p.length > best.len)) {
        best = { cmd, len: p.length };
      }
    }
  }
  return best?.cmd ?? null;
}
