import { apiPost } from '../../../lib/apiClient';

/**
 * Translation service (CLAUDE.md §14.5). Centralizes the Gemini translation calls
 * so the UI never embeds fetch logic. Results are AI-generated translations; the
 * caller is responsible for marking them as such and preserving the original.
 */

interface TranslateTextResponse {
  translatedText: string;
  isFallback?: boolean;
}

interface TranslateBatchResponse {
  translatedTexts: string[];
  isFallback?: boolean;
}

export interface TranslateResult<T> {
  value: T;
  /** True when the server returned the input unchanged (AI unavailable/failed). */
  isFallback: boolean;
}

export async function translateText(text: string): Promise<TranslateResult<string>> {
  try {
    const data = await apiPost<TranslateTextResponse>('/api/gemini/translate-text', { text });
    return { value: data.translatedText ?? text, isFallback: !!data.isFallback };
  } catch (err) {
    console.error('[EidosUs] translateText failed:', err);
    return { value: text, isFallback: true };
  }
}

export async function translateBatch(texts: string[]): Promise<TranslateResult<string[]>> {
  try {
    const data = await apiPost<TranslateBatchResponse>(
      '/api/gemini/translate-batch',
      { texts },
      { timeoutMs: 60_000 },
    );
    const ok = Array.isArray(data.translatedTexts) && data.translatedTexts.length === texts.length;
    return {
      value: ok ? data.translatedTexts : texts,
      isFallback: !ok || !!data.isFallback,
    };
  } catch (err) {
    console.error('[EidosUs] translateBatch failed:', err);
    return { value: texts, isFallback: true };
  }
}
