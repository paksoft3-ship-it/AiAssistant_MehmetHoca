import { PRODUCT } from '../../../config/product';

/**
 * Share/invite helpers (Beta spec §24). No backend or paid mail provider is
 * required for the beta: invites are plain links to the app plus pre-filled
 * share text. A non-tracking `ref` marker is added so a future server can
 * attribute signups without exposing any private user data.
 */

export function buildInviteUrl(origin: string, ref?: string): string {
  const base = origin.replace(/\/$/, '') || 'https://eidosus.app';
  if (!ref) return base;
  // Only an opaque, caller-supplied token — never user identity/email.
  const safe = encodeURIComponent(ref.slice(0, 64));
  return `${base}/?ref=${safe}`;
}

export function buildShareText(inviteUrl: string): string {
  return `${PRODUCT.name} — akademik makaleleri dinle, durup sesli not al, kaynağa bağla ve dışa aktar. Ücretsiz beta: ${inviteUrl}`;
}

export function buildMailtoLink(inviteUrl: string, to = ''): string {
  const subject = `${PRODUCT.name} beta davetiyesi`;
  const body = buildShareText(inviteUrl);
  const recipient = encodeURIComponent(to.trim());
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildWhatsAppLink(inviteUrl: string): string {
  return `https://wa.me/?text=${encodeURIComponent(buildShareText(inviteUrl))}`;
}

/** Basic e-mail shape check for the invite-by-email field. */
export function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
