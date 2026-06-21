import { GoogleGenAI } from '@google/genai';
import { config, aiAvailable } from '../config';

let client: GoogleGenAI | null = null;

/** Lazily construct the shared Gemini client. Returns null when AI is unavailable. */
export function getGeminiClient(): GoogleGenAI | null {
  if (!aiAvailable()) return null;
  if (!client) {
    client = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: { headers: { 'User-Agent': 'eidosus-server' } },
    });
  }
  return client;
}

function isRateLimitError(err: any): boolean {
  const msg = err?.message || String(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    err?.status === 429 ||
    err?.code === 429
  );
}

/**
 * Execute generateContent with exponential backoff on 429 (rate limit/quota)
 * and an overall timeout so a hung request cannot block the response.
 */
export async function generateContentWithRetry(
  params: any,
  opts: { maxRetries?: number; initialDelayMs?: number; timeoutMs?: number } = {},
): Promise<any> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Gemini client is not available.');

  const { maxRetries = 3, initialDelayMs = 2000, timeoutMs = 30000 } = opts;
  let attempt = 0;

  while (true) {
    try {
      const callPromise = ai.models.generateContent(params);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timed out.')), timeoutMs),
      );
      return await Promise.race([callPromise, timeoutPromise]);
    } catch (err: any) {
      attempt++;
      if (isRateLimitError(err) && attempt <= maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[Gemini 429] Quota exceeded. Attempt ${attempt}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}
