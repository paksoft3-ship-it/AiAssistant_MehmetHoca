/**
 * Assistant personalization (Beta spec §15). Small preferences kept in
 * localStorage (not IndexedDB) per CLAUDE.md §5.3.
 */
export interface AssistantPreferences {
  assistantName: string;
  wakePhrases: string[];
  language: 'tr' | 'en';
  handsFreeEnabled: boolean;
  spokenFeedbackEnabled: boolean;
}

export const DEFAULT_ASSISTANT_PREFS: AssistantPreferences = {
  assistantName: 'Sokrates',
  wakePhrases: ['sokrates', 'eidosus'],
  language: 'tr',
  handsFreeEnabled: false,
  spokenFeedbackEnabled: true,
};

const STORAGE_KEY = 'eidosus_assistant_prefs';

export function loadAssistantPrefs(): AssistantPreferences {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_ASSISTANT_PREFS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ASSISTANT_PREFS };
    const parsed = JSON.parse(raw) as Partial<AssistantPreferences>;
    return normalizeAssistantPrefs(parsed);
  } catch {
    return { ...DEFAULT_ASSISTANT_PREFS };
  }
}

export function saveAssistantPrefs(prefs: AssistantPreferences): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage may be full/blocked — non-fatal */
  }
}

/** Merge partial/untrusted prefs onto defaults; always derive a wake phrase from the name. */
export function normalizeAssistantPrefs(input: Partial<AssistantPreferences>): AssistantPreferences {
  const base = { ...DEFAULT_ASSISTANT_PREFS, ...input };
  // Trim first, then fall back — a whitespace-only name must not survive.
  const name = (base.assistantName || '').trim() || DEFAULT_ASSISTANT_PREFS.assistantName;
  const phrases = Array.isArray(base.wakePhrases) ? base.wakePhrases : [];
  const wakePhrases = Array.from(
    new Set(
      [name, ...phrases]
        .map((p) => (p || '').trim().toLocaleLowerCase('tr'))
        .filter(Boolean),
    ),
  );
  return {
    assistantName: name,
    wakePhrases: wakePhrases.length ? wakePhrases : [name.toLocaleLowerCase('tr')],
    language: base.language === 'en' ? 'en' : 'tr',
    handsFreeEnabled: !!base.handsFreeEnabled,
    spokenFeedbackEnabled: !!base.spokenFeedbackEnabled,
  };
}
