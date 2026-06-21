import { describe, it, expect } from 'vitest';
import { cleanNoteRequestSchema } from '../schemas/cleanNote';
import { cleanNote, AiUnavailableError, AiResponseError } from './cleanNoteService';

function req(overrides: Record<string, unknown> = {}) {
  return cleanNoteRequestSchema.parse({
    documentTitle: 'Test Makalesi',
    sourceExcerpt: 'Önemli bir pasaj.',
    rawTranscript: 'bence bu kısım onemli ama emin degilim',
    language: 'tr',
    ...overrides,
  });
}

describe('cleanNoteRequestSchema', () => {
  it('rejects an empty raw transcript', () => {
    const result = cleanNoteRequestSchema.safeParse({ rawTranscript: '' });
    expect(result.success).toBe(false);
  });
  it('applies defaults for optional fields', () => {
    const parsed = cleanNoteRequestSchema.parse({ rawTranscript: 'fikir' });
    expect(parsed.language).toBe('tr');
    expect(parsed.sourceExcerpt).toBe('');
  });
});

describe('cleanNote service', () => {
  it('throws AiUnavailableError when AI is not available', async () => {
    await expect(
      cleanNote(req(), { available: false, generate: async () => '{}' }),
    ).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('returns a validated structured response on success', async () => {
    const result = await cleanNote(req(), {
      available: true,
      generate: async () =>
        JSON.stringify({
          cleanedNote: 'Bu pasajın önemli olduğunu düşünüyorum, ancak emin değilim.',
          suggestedTags: ['değerlendirme'],
          warnings: [],
        }),
    });
    expect(result.cleanedNote).toContain('önemli');
    expect(result.suggestedTags).toEqual(['değerlendirme']);
    expect(result.warnings).toEqual([]);
  });

  it('handles JSON wrapped in markdown code fences', async () => {
    const result = await cleanNote(req(), {
      available: true,
      generate: async () => '```json\n{"cleanedNote":"Düzenlenmiş not."}\n```',
    });
    expect(result.cleanedNote).toBe('Düzenlenmiş not.');
    expect(result.suggestedTags).toEqual([]);
  });

  it('throws AiResponseError on non-JSON output', async () => {
    await expect(
      cleanNote(req(), { available: true, generate: async () => 'not json at all' }),
    ).rejects.toBeInstanceOf(AiResponseError);
  });

  it('throws AiResponseError on an empty cleaned note', async () => {
    await expect(
      cleanNote(req(), { available: true, generate: async () => '{"cleanedNote":"  "}' }),
    ).rejects.toBeInstanceOf(AiResponseError);
  });

  it('throws AiResponseError when the model call fails', async () => {
    await expect(
      cleanNote(req(), {
        available: true,
        generate: async () => {
          throw new Error('network down');
        },
      }),
    ).rejects.toBeInstanceOf(AiResponseError);
  });
});
