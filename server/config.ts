import dotenv from 'dotenv';

dotenv.config();

/**
 * Server configuration. Secrets and the model name are read from the environment
 * with safe defaults (CLAUDE.md §14.1) — never hardcoded across the codebase.
 */
export const config = {
  port: Number(process.env.PORT) || 3000,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  /** Master switch for AI features on the server. */
  aiEnabled: (process.env.AI_FEATURES_ENABLED ?? 'true').toLowerCase() !== 'false',
  /** Max JSON body size accepted by the API. */
  bodyLimit: process.env.API_BODY_LIMIT || '1mb',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

/** True when AI calls can actually be made (key present AND features enabled). */
export function aiAvailable(): boolean {
  return !!config.geminiApiKey && config.aiEnabled;
}
