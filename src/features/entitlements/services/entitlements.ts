/**
 * Feature entitlement abstraction (Beta spec §26).
 *
 * This exists so monetization can be added LATER without touching feature code.
 * For the beta, ALL core reading and note-taking features are free, and
 * accessibility is always free and never gated by ads. There is no ad SDK.
 */
export type FeatureEntitlement =
  | 'core_reading'
  | 'voice_notes'
  | 'hands_free'
  | 'ai_discussion'
  | 'advanced_export'
  | 'translation'
  | 'camera_ocr';

export interface UsageEntitlement {
  feature: FeatureEntitlement;
  allowed: boolean;
  remainingUses?: number;
  resetAt?: string;
  reason?: 'free' | 'sponsored' | 'admin' | 'accessibility';
}

/** Features that must always be free (never gated), per spec §26/§27. */
export const ALWAYS_FREE: FeatureEntitlement[] = [
  'core_reading',
  'voice_notes',
  'hands_free',
  'advanced_export',
];

/**
 * Resolve whether a feature is currently allowed. In the beta everything is
 * allowed and free; when `accessibilityMode` is on, the reason is reported as
 * 'accessibility' so callers can show that nothing is gated. A future
 * implementation can swap this for a quota/server-backed resolver without
 * changing call sites.
 */
export function resolveEntitlement(
  feature: FeatureEntitlement,
  ctx: { accessibilityMode?: boolean } = {},
): UsageEntitlement {
  if (ctx.accessibilityMode) {
    return { feature, allowed: true, reason: 'accessibility' };
  }
  return { feature, allowed: true, reason: 'free' };
}
