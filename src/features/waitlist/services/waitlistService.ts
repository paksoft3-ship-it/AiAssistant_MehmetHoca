import { apiPost } from '../../../lib/apiClient';

const LOCAL_KEY = 'eidosus_waitlist_pending';

export interface WaitlistResult {
  ok: boolean;
  /** True when the signup was saved locally because the server was unreachable. */
  savedLocally: boolean;
}

/** Minimal client-side email sanity check before hitting the server. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Submit a beta waitlist signup. Tries the isolated server endpoint; if that is
 * unreachable, the email is queued in localStorage so the user's intent isn't lost
 * (CLAUDE.md §15 — the waitlist must never block the core app).
 */
export async function submitWaitlist(email: string, note?: string): Promise<WaitlistResult> {
  const trimmed = email.trim();
  try {
    await apiPost('/api/waitlist', { email: trimmed, note }, { timeoutMs: 10_000 });
    return { ok: true, savedLocally: false };
  } catch (err) {
    console.warn('[EidosUs] Waitlist server unavailable, saving locally:', err);
    try {
      const pending: string[] = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      if (!pending.includes(trimmed)) pending.push(trimmed);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(pending));
      return { ok: true, savedLocally: true };
    } catch {
      return { ok: false, savedLocally: false };
    }
  }
}
