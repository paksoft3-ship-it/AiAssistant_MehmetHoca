import type { AppVoice } from '../../../types';

/**
 * Rule-based voice prioritization (CLAUDE.md §9.2).
 *
 * This is NOT AI. It scores the voices the browser/OS actually exposes using
 * honest, name- and capability-based heuristics, to surface the ones most likely
 * to sound natural. It never invents voices and makes no guarantee that any
 * particular voice exists on a given device.
 */
export function rankVoice(voice: AppVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;

  // Quality hints commonly present in higher-fidelity voice names.
  if (
    name.includes('natural') ||
    name.includes('neural') ||
    name.includes('online') ||
    name.includes('premium') ||
    name.includes('enhanced')
  ) {
    score += 500;
  }

  // Cloud/non-local voices tend to be higher quality.
  if (voice.localService === false) score += 100;

  // Known engine providers (purely a tie-breaker among device voices).
  if (name.includes('google')) score += 60;
  if (name.includes('siri')) score += 50;
  if (name.includes('microsoft')) score += 40;
  if (name.includes('apple')) score += 20;

  return score;
}

/** Highest-ranked voice whose language matches the target tag, or null. */
export function getBestVoiceForLanguage(voices: AppVoice[], targetLang: string): AppVoice | null {
  const target = targetLang.toLowerCase().replace('_', '-');
  const matching = voices.filter((v) => {
    const lang = v.lang.toLowerCase().replace('_', '-');
    return lang.startsWith(target) || lang.includes(targetLang.toLowerCase());
  });
  if (matching.length === 0) return null;
  return [...matching].sort((a, b) => rankVoice(b) - rankVoice(a))[0];
}

/**
 * Resolve the best voice for the document language, never reading one language
 * with another language's voice. Falls back to the highest-ranked matching voice.
 */
export function getSpokenVoice(
  voices: AppVoice[],
  preferredVoiceURI: string,
  targetLang: string,
): AppVoice | null {
  const normalizedTarget = (targetLang || 'tr').toLowerCase().split(/[-_]/)[0];

  if (preferredVoiceURI) {
    const preferred = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (preferred) {
      const prefLangNorm = preferred.lang.toLowerCase().split(/[-_]/)[0];
      if (prefLangNorm === normalizedTarget) return preferred;
    }
  }

  return getBestVoiceForLanguage(voices, targetLang) || voices[0] || null;
}
