/**
 * Default academic tag suggestions (Beta spec §19). Used to seed quick-add
 * chips in the note editor and to power autocomplete. Labels are Turkish (the
 * MVP UI language); the `en` field is kept so these map cleanly to i18n later.
 */
export interface TagSuggestion {
  /** Canonical tag stored on the note (Turkish, MVP). */
  tag: string;
  /** English equivalent, for future localization. */
  en: string;
}

export const DEFAULT_TAG_SUGGESTIONS: TagSuggestion[] = [
  { tag: 'Yöntem', en: 'Methodology' },
  { tag: 'Hipotez', en: 'Hypothesis' },
  { tag: 'Literatür', en: 'Literature' },
  { tag: 'Bulgu', en: 'Finding' },
  { tag: 'Sınırlılık', en: 'Limitation' },
  { tag: 'Eleştiri', en: 'Criticism' },
  { tag: 'Tanım', en: 'Definition' },
  { tag: 'Kuram', en: 'Theory' },
  { tag: 'Kanıt', en: 'Evidence' },
  { tag: 'Alıntı', en: 'Citation' },
  { tag: 'Araştırma Sorusu', en: 'Research Question' },
  { tag: 'Gelecek Çalışma', en: 'Future Work' },
  { tag: 'Kişisel Yorum', en: 'Personal Reflection' },
];

export const DEFAULT_TAGS: string[] = DEFAULT_TAG_SUGGESTIONS.map((s) => s.tag);

/**
 * Suggests tags for an autocomplete/quick-add affordance.
 *
 * - Combines the user's own existing tags with the default academic catalog
 *   (user tags first, so their vocabulary wins).
 * - Excludes tags already chosen for the current note (case-insensitive).
 * - When `query` is non-empty, filters to tags containing it (Turkish-aware).
 * - De-duplicates case-insensitively and caps the result to `limit`.
 */
export function suggestTags(
  query: string,
  options: { selected?: string[]; existing?: string[]; defaults?: string[]; limit?: number } = {},
): string[] {
  const { selected = [], existing = [], defaults = DEFAULT_TAGS, limit = 8 } = options;
  const q = query.trim().toLocaleLowerCase('tr');
  const selectedKeys = new Set(selected.map((t) => t.trim().toLocaleLowerCase('tr')));

  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of [...existing, ...defaults]) {
    const clean = tag.trim();
    if (!clean) continue;
    const key = clean.toLocaleLowerCase('tr');
    if (selectedKeys.has(key) || seen.has(key)) continue;
    if (q && !key.includes(q)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }
  return out;
}
