import { describe, it, expect } from 'vitest';
import { normalizeAssistantPrefs, DEFAULT_ASSISTANT_PREFS } from './assistantPreferences';
import { matchWakePhrase, matchCommand } from './commands';

describe('normalizeAssistantPrefs', () => {
  it('derives a wake phrase from the assistant name', () => {
    const p = normalizeAssistantPrefs({ assistantName: 'Athena', wakePhrases: [] });
    expect(p.wakePhrases).toContain('athena');
  });

  it('merges onto defaults and de-duplicates wake phrases', () => {
    const p = normalizeAssistantPrefs({ assistantName: 'Sokrates', wakePhrases: ['Sokrates', 'eidosus'] });
    expect(p.assistantName).toBe('Sokrates');
    expect(p.wakePhrases).toEqual(['sokrates', 'eidosus']);
    expect(p.spokenFeedbackEnabled).toBe(DEFAULT_ASSISTANT_PREFS.spokenFeedbackEnabled);
  });

  it('falls back to the default name when blank', () => {
    const p = normalizeAssistantPrefs({ assistantName: '   ' });
    expect(p.assistantName).toBe('Sokrates');
  });
});

describe('matchWakePhrase', () => {
  it('detects the wake phrase anywhere in the transcript', () => {
    expect(matchWakePhrase('hey sokrates dinle', ['sokrates'])).toBe(true);
    expect(matchWakePhrase('merhaba', ['sokrates'])).toBe(false);
  });
});

describe('matchCommand', () => {
  it('prefers the longest matching phrase', () => {
    expect(matchCommand('lütfen okumayı durdur', 'tr')).toBe('stop_reading');
    expect(matchCommand('dur', 'tr')).toBe('stop_reading');
    expect(matchCommand('dur not alalım', 'tr')).toBe('take_note');
  });

  it('works in English', () => {
    expect(matchCommand('please take a note', 'en')).toBe('take_note');
    expect(matchCommand('go home now', 'en')).toBe('go_home');
  });

  it('returns null when nothing matches', () => {
    expect(matchCommand('hava bugün güzel', 'tr')).toBeNull();
  });
});
