/**
 * Accessibility preferences (Beta spec §27). Small, kept in localStorage. The
 * classes returned by `accessibilityClasses` are applied to <html> so global CSS
 * (see index.css) can react. Core reading/notes remain free in accessibility
 * mode — these toggles never gate functionality.
 */
export interface AccessibilityPreferences {
  enabled: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  spokenInterfaceHints: boolean;
  autoDescribeFigures: boolean;
}

export const DEFAULT_A11Y_PREFS: AccessibilityPreferences = {
  enabled: false,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  spokenInterfaceHints: false,
  autoDescribeFigures: false,
};

const STORAGE_KEY = 'eidosus_a11y_prefs';

export function loadA11yPrefs(): AccessibilityPreferences {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_A11Y_PREFS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_A11Y_PREFS };
    return { ...DEFAULT_A11Y_PREFS, ...(JSON.parse(raw) as Partial<AccessibilityPreferences>) };
  } catch {
    return { ...DEFAULT_A11Y_PREFS };
  }
}

export function saveA11yPrefs(prefs: AccessibilityPreferences): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* non-fatal */
  }
}

/**
 * The set of root CSS classes implied by the preferences. Only active when the
 * mode is enabled (so toggles don't take effect until the user opts in). Pure
 * and testable.
 */
export function accessibilityClasses(prefs: AccessibilityPreferences): string[] {
  if (!prefs.enabled) return [];
  const classes: string[] = ['a11y'];
  if (prefs.highContrast) classes.push('a11y-high-contrast');
  if (prefs.largeText) classes.push('a11y-large-text');
  if (prefs.reducedMotion) classes.push('a11y-reduced-motion');
  return classes;
}

/** All root classes this feature may toggle (for clean add/remove). */
export const ALL_A11Y_CLASSES = ['a11y', 'a11y-high-contrast', 'a11y-large-text', 'a11y-reduced-motion'];
