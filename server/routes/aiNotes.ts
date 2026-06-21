import { Router } from 'express';
import { Type } from '@google/genai';
import { cleanNoteRequestSchema } from '../schemas/cleanNote';
import {
  cleanNote,
  AiUnavailableError,
  AiResponseError,
} from '../services/cleanNoteService';
import { generateContentWithRetry } from '../services/geminiClient';
import { config, aiAvailable } from '../config';

export const aiNotesRouter = Router();

/**
 * POST /api/ai/clean-note
 * Cleans a raw transcript into an academic note. Returns validated structured JSON
 * { cleanedNote, suggestedTags, warnings }. Never fabricates: on any failure it
 * responds with an error code so the client falls back to the raw transcript.
 */
aiNotesRouter.post('/clean-note', async (req, res) => {
  const parsed = cleanNoteRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Geçersiz istek.', code: 'invalid_request', details: parsed.error.flatten() });
  }

  // Privacy: log only sizes, never document/note text (CLAUDE.md §14.2, §21).
  console.info(
    `[clean-note] excerpt=${parsed.data.sourceExcerpt.length}c raw=${parsed.data.rawTranscript.length}c lang=${parsed.data.language}`,
  );

  try {
    const result = await cleanNote(parsed.data, {
      available: aiAvailable(),
      generate: async ({ systemInstruction, prompt }) => {
        const response = await generateContentWithRetry({
          model: config.geminiModel,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                cleanedNote: { type: Type.STRING },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['cleanedNote'],
            },
          },
        });
        return response.text?.trim() || '';
      },
    });
    return res.json({ ...result, isFallback: false });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      return res
        .status(503)
        .json({ error: 'Yapay zeka özellikleri şu anda kullanılamıyor.', code: 'ai_unavailable' });
    }
    if (err instanceof AiResponseError) {
      console.warn('[clean-note] AI response error:', err.message);
      return res
        .status(502)
        .json({ error: 'Yapay zeka düzenlemesi tamamlanamadı. Notunuz olduğu gibi kaydedilebilir.', code: 'ai_error' });
    }
    console.error('[clean-note] Unexpected error:', err);
    return res.status(500).json({ error: 'Beklenmeyen bir sunucu hatası oluştu.', code: 'server_error' });
  }
});
