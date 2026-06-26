/**
 * Feature flags gate secondary / experimental features so the core
 * reader + source-linked note workflow is never blocked by them (CLAUDE.md §3, §5.4).
 *
 * Client flags are read from Vite env (`import.meta.env`) with safe defaults.
 * A flag being on does not guarantee the capability works (e.g. AI also needs a
 * server key); it only governs whether the UI surfaces the feature.
 */

function readBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

// import.meta.env is replaced statically by Vite; guard for non-Vite (test) contexts.
const env: Record<string, unknown> =
  typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, unknown> }).env
    ? (import.meta as { env: Record<string, unknown> }).env
    : {};

export const featureFlags = {
  /** AI features in general (note cleaning, translation, discussion, figures). */
  aiFeatures: readBool(env.VITE_AI_FEATURES_ENABLED, true),
  /** AI cleanup of raw transcripts into academic notes. */
  aiNoteCleaning: readBool(env.VITE_FEATURE_AI_NOTE_CLEANING, true),
  /** Gemini translation tool. */
  translation: readBool(env.VITE_FEATURE_TRANSLATION, true),
  /** Gemini contextual discussion ("debate"). */
  discussion: readBool(env.VITE_FEATURE_DISCUSSION, true),
  /** Hands-free voice commands. */
  handsFree: readBool(env.VITE_FEATURE_HANDS_FREE, true),
  /**
   * Natural neural voices via the key-less Edge Read-Aloud proxy (`/api/tts`).
   * On by default — it needs no API key. Requires network and sends the read
   * passage text to Microsoft; users can switch back to offline device voices.
   */
  naturalVoices: readBool(env.VITE_FEATURE_NATURAL_VOICES, true),
  /**
   * Figure/graph explanation. Experimental and OFF by default until it is
   * trustworthy (never fabricates trends) — CLAUDE.md §14.6.
   */
  figureExplanation: readBool(env.VITE_FEATURE_FIGURE_EXPLANATION, false),
  /** Supabase auth / cloud sync. Later-stage; off for the local MVP. */
  cloudAuth: readBool(env.VITE_FEATURE_CLOUD_AUTH, false),
} as const;

export type FeatureFlags = typeof featureFlags;
export type FeatureFlag = keyof FeatureFlags;
