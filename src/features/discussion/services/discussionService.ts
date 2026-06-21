import { apiPost } from '../../../lib/apiClient';
import type { DiscussionMessage } from '../../../types/domain';

/**
 * Contextual discussion service (CLAUDE.md §14.4). Wraps the Gemini "debate"
 * endpoint, scoped to a selected excerpt and nearby context. The answer is an AI
 * interpretation of the given excerpt only — not a claim about the whole paper.
 *
 * The discussion UI is not wired into the MVP reader yet; this service is the
 * stable boundary for re-introducing it as a secondary feature.
 */

export interface DiscussionRequest {
  messages: Pick<DiscussionMessage, 'role' | 'content'>[];
  contextText: string;
  articleTitle?: string;
}

interface DebateResponse {
  text: string;
  isFallback?: boolean;
}

export async function sendDiscussionMessage(
  req: DiscussionRequest,
): Promise<{ text: string; isFallback: boolean }> {
  const payload = {
    messages: req.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
    contextText: req.contextText,
    articleTitle: req.articleTitle,
  };
  const data = await apiPost<DebateResponse>('/api/gemini/debate', payload);
  return { text: data.text, isFallback: !!data.isFallback };
}
