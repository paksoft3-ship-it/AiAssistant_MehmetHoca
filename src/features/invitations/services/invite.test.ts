import { describe, it, expect } from 'vitest';
import {
  buildInviteUrl,
  buildShareText,
  buildMailtoLink,
  buildWhatsAppLink,
  isLikelyEmail,
} from './invite';

describe('invite helpers', () => {
  it('builds an invite url, trimming trailing slash and adding a safe ref', () => {
    expect(buildInviteUrl('https://eidosus.app/')).toBe('https://eidosus.app');
    expect(buildInviteUrl('https://eidosus.app', 'abc 123')).toBe('https://eidosus.app/?ref=abc%20123');
  });

  it('falls back to a default origin when empty', () => {
    expect(buildInviteUrl('')).toBe('https://eidosus.app');
  });

  it('share text contains the invite url', () => {
    const url = 'https://eidosus.app';
    expect(buildShareText(url)).toContain(url);
  });

  it('builds encoded mailto and whatsapp links', () => {
    const url = 'https://eidosus.app';
    expect(buildMailtoLink(url, 'a@b.com')).toMatch(/^mailto:a%40b\.com\?subject=/);
    expect(buildWhatsAppLink(url)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it('validates email shape', () => {
    expect(isLikelyEmail('a@b.com')).toBe(true);
    expect(isLikelyEmail('nope')).toBe(false);
  });
});
