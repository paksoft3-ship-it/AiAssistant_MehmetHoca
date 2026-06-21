import { z } from 'zod';

/** Request body for POST /api/ai/clean-note (CLAUDE.md §11.2). */
export const cleanNoteRequestSchema = z.object({
  documentTitle: z.string().max(500).optional().default(''),
  sourceExcerpt: z.string().max(8000).optional().default(''),
  rawTranscript: z.string().min(1, 'rawTranscript is required').max(8000),
  language: z.string().max(10).optional().default('tr'),
  instruction: z.string().max(500).optional(),
});

export type CleanNoteRequest = z.infer<typeof cleanNoteRequestSchema>;

/** Validated structured response from the AI cleaning step. */
export const cleanNoteResponseSchema = z.object({
  cleanedNote: z.string(),
  suggestedTags: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

export type CleanNoteResponse = z.infer<typeof cleanNoteResponseSchema>;
