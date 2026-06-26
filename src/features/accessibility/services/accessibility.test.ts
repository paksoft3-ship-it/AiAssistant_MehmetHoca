import { describe, it, expect } from 'vitest';
import { accessibilityClasses, DEFAULT_A11Y_PREFS } from './accessibilityPreferences';

describe('accessibilityClasses', () => {
  it('returns nothing when the mode is disabled', () => {
    expect(accessibilityClasses({ ...DEFAULT_A11Y_PREFS, enabled: false, highContrast: true })).toEqual([]);
  });

  it('includes the base class when enabled', () => {
    expect(accessibilityClasses({ ...DEFAULT_A11Y_PREFS, enabled: true })).toEqual(['a11y']);
  });

  it('adds a class per active toggle', () => {
    const classes = accessibilityClasses({
      ...DEFAULT_A11Y_PREFS,
      enabled: true,
      highContrast: true,
      largeText: true,
      reducedMotion: true,
    });
    expect(classes).toEqual(expect.arrayContaining(['a11y', 'a11y-high-contrast', 'a11y-large-text', 'a11y-reduced-motion']));
  });
});
