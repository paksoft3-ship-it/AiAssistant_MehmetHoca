import { apiPost } from '../../../lib/apiClient';

export interface CleanNoteResult {
  cleanedNote: string;
  suggestedTags: string[];
  warnings: string[];
}

export interface CleanNoteParams {
  documentTitle?: string;
  sourceExcerpt: string;
  rawTranscript: string;
  language?: string;
}

/**
 * Request an AI-cleaned academic note from the server. Throws (via apiClient) when
 * AI is unavailable or the model fails, so the caller can fall back to the raw
 * transcript — the cleaning step never fabricates a result client-side.
 */
export async function requestCleanNote(params: CleanNoteParams): Promise<CleanNoteResult> {
  const data = await apiPost<Partial<CleanNoteResult>>('/api/ai/clean-note', params);
  return {
    cleanedNote: data.cleanedNote ?? '',
    suggestedTags: data.suggestedTags ?? [],
    warnings: data.warnings ?? [],
  };
}
