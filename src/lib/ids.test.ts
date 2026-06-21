import { describe, it, expect } from 'vitest';
import { newId, uuidV4Fallback } from './ids';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
  it('produces a UUID-shaped string', () => {
    expect(newId()).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('produces unique values', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
  });
});

describe('uuidV4Fallback', () => {
  it('matches the RFC4122 v4 shape (version + variant bits)', () => {
    expect(uuidV4Fallback()).toMatch(UUID_RE);
  });
});
