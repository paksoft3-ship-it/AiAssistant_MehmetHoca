import { describe, it, expect } from 'vitest';
import { resolveEntitlement, ALWAYS_FREE } from './entitlements';

describe('resolveEntitlement', () => {
  it('allows every feature for free in the beta', () => {
    expect(resolveEntitlement('core_reading')).toEqual({ feature: 'core_reading', allowed: true, reason: 'free' });
    expect(resolveEntitlement('ai_discussion').allowed).toBe(true);
  });

  it('reports accessibility reason when accessibility mode is on', () => {
    expect(resolveEntitlement('translation', { accessibilityMode: true }).reason).toBe('accessibility');
  });

  it('keeps core reading and notes in the always-free set', () => {
    expect(ALWAYS_FREE).toContain('core_reading');
    expect(ALWAYS_FREE).toContain('voice_notes');
  });
});
