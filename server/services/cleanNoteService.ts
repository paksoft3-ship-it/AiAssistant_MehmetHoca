import {
  cleanNoteResponseSchema,
  type CleanNoteRequest,
  type CleanNoteResponse,
} from '../schemas/cleanNote';
import { cleanNoteSystemInstruction, buildCleanNotePrompt } from './prompts/cleanNote';

/** Raised when AI features are disabled or unconfigured. */
export class AiUnavailableError extends Error {
  constructor(message = 'AI features are not available.') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

/** Raised when the model call fails or returns an unusable response. */
export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiResponseError';
  }
}

export interface CleanNoteDeps {
  available: boolean;
  /** Generate raw model text from a system instruction + prompt. Injectable for tests. */
  generate: (args: { systemInstruction: string; prompt: string }) => Promise<string>;
}

/** Strip Markdown code fences a model may wrap JSON in. */
function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * Core note-cleaning logic, independent of Express/Gemini so it can be unit tested.
 * Validates the model's structured output; throws (never fabricates) on failure so
 * the client can gracefully fall back to saving the raw transcript.
 */
export async function cleanNote(
  input: CleanNoteRequest,
  deps: CleanNoteDeps,
): Promise<CleanNoteResponse> {
  if (!deps.available) throw new AiUnavailableError();

  const systemInstruction = cleanNoteSystemInstruction(input.language);
  const prompt = buildCleanNotePrompt(input);

  let text: string;
  try {
    text = await deps.generate({ systemInstruction, prompt });
  } catch (err) {
    throw new AiResponseError((err as Error)?.message || 'Model call failed.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFences(text));
  } catch {
    throw new AiResponseError('Model response was not valid JSON.');
  }

  const result = cleanNoteResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new AiResponseError('Model response did not match the expected schema.');
  }
  if (!result.data.cleanedNote.trim()) {
    throw new AiResponseError('Model returned an empty cleaned note.');
  }
  return result.data;
}
