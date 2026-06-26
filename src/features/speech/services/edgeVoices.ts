import type { AppVoice } from '../../../types';

/**
 * Natural neural voices served by the backend `/api/tts` proxy (Microsoft Edge
 * Read-Aloud). These are real, high-quality voices — unlike the device voices
 * exposed by the Web Speech API, they sound human and are the same on every
 * machine. They require a network round-trip and send the passage text to
 * Microsoft (surfaced to the user — CLAUDE.md §9, §17).
 *
 * Voice URIs are namespaced with the `edge:` prefix so the speech engine can
 * tell them apart from device (`SpeechSynthesisVoice`) URIs.
 */

export const EDGE_VOICE_PREFIX = 'edge:';

interface EdgeVoiceDef {
  /** Microsoft voice short name, e.g. "tr-TR-EmelNeural". */
  shortName: string;
  /** Human label shown in the voice picker. */
  label: string;
  /** BCP-47 language tag. */
  lang: string;
}

/**
 * Curated, conservative list. Turkish first (the primary MVP language), then a
 * few widely-used voices for the other supported document languages. We
 * deliberately keep this short rather than listing hundreds of voices.
 */
export const EDGE_VOICES: EdgeVoiceDef[] = [
  { shortName: 'tr-TR-EmelNeural', label: 'Emel — Doğal Türkçe (Kadın)', lang: 'tr-TR' },
  { shortName: 'tr-TR-AhmetNeural', label: 'Ahmet — Doğal Türkçe (Erkek)', lang: 'tr-TR' },
  { shortName: 'en-US-AriaNeural', label: 'Aria — Natural English (Female)', lang: 'en-US' },
  { shortName: 'en-US-GuyNeural', label: 'Guy — Natural English (Male)', lang: 'en-US' },
  { shortName: 'en-GB-SoniaNeural', label: 'Sonia — Natural English (UK, Female)', lang: 'en-GB' },
  { shortName: 'de-DE-KatjaNeural', label: 'Katja — Natürliches Deutsch (Frau)', lang: 'de-DE' },
  { shortName: 'fr-FR-DeniseNeural', label: 'Denise — Français naturel (Femme)', lang: 'fr-FR' },
  { shortName: 'es-ES-ElviraNeural', label: 'Elvira — Español natural (Mujer)', lang: 'es-ES' },
  { shortName: 'it-IT-ElsaNeural', label: 'Elsa — Italiano naturale (Donna)', lang: 'it-IT' },
];

/** Exposes the curated neural voices in the app's common `AppVoice` shape. */
export function edgeVoicesAsAppVoices(): AppVoice[] {
  return EDGE_VOICES.map((v) => ({
    voiceURI: EDGE_VOICE_PREFIX + v.shortName,
    name: v.label,
    lang: v.lang,
    localService: false,
    default: false,
  }));
}

export function isEdgeVoiceURI(voiceURI: string): boolean {
  return voiceURI.startsWith(EDGE_VOICE_PREFIX);
}

/** Strips the `edge:` prefix to recover the Microsoft voice short name. */
export function edgeShortName(voiceURI: string): string {
  return voiceURI.slice(EDGE_VOICE_PREFIX.length);
}
