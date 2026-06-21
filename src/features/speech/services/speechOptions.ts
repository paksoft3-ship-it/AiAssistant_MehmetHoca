/**
 * Single source of truth for playback speed options (CLAUDE.md §9.2).
 * Distinct numeric values only — no `1` vs `1.0` / `2` vs `2.0` duplicates.
 */
export const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Display label for a speed value, e.g. 1 → "1.0x", 1.25 → "1.25x". */
export function formatSpeedLabel(rate: number): string {
  const fixed = Number.isInteger(rate) ? rate.toFixed(1) : String(rate);
  return `${fixed}x`;
}
