import { describe, it, expect } from 'vitest';
import { suggestTags, DEFAULT_TAGS } from './tagCatalog';

describe('suggestTags', () => {
  it('returns defaults when there is no query or selection', () => {
    const out = suggestTags('');
    expect(out.length).toBeGreaterThan(0);
    expect(out).toContain('Yöntem');
  });

  it('puts the user’s existing tags before the catalog', () => {
    const out = suggestTags('', { existing: ['ÖzelEtiket'] });
    expect(out[0]).toBe('ÖzelEtiket');
  });

  it('excludes already-selected tags (case-insensitive)', () => {
    const out = suggestTags('', { selected: ['yöntem'] });
    expect(out).not.toContain('Yöntem');
  });

  it('filters by query (Turkish-aware, substring)', () => {
    const out = suggestTags('hipo');
    expect(out).toEqual(['Hipotez']);
  });

  it('de-duplicates existing vs defaults and respects the limit', () => {
    const out = suggestTags('', { existing: ['Yöntem'], limit: 3 });
    expect(out).toHaveLength(3);
    // 'Yöntem' should appear once even though it is also a default.
    expect(out.filter((t) => t.toLowerCase() === 'yöntem')).toHaveLength(1);
  });

  it('exposes the default academic catalog', () => {
    expect(DEFAULT_TAGS).toContain('Literatür');
    expect(DEFAULT_TAGS).toContain('Bulgu');
  });
});
