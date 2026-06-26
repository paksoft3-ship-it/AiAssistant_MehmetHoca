import { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Portal } from '../../../components/ui/Portal';
import { PRODUCT } from '../../../config/product';
import {
  buildInviteUrl,
  buildShareText,
  buildMailtoLink,
  buildWhatsAppLink,
  isLikelyEmail,
} from '../services/invite';

export interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Share / invite dialog (Beta spec §24): copy link, native Web Share, e-mail
 * (mailto, no paid provider), and WhatsApp. No private user data is placed in
 * links and there are no referral rewards.
 */
export default function InviteDialog({ isOpen, onClose }: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = buildInviteUrl(origin);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: `${PRODUCT.name} beta`, text: buildShareText(inviteUrl), url: inviteUrl });
    } catch {
      /* user cancelled or unsupported — ignore */
    }
  };

  const emailValid = isLikelyEmail(email);

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/20 p-md backdrop-blur-md sm:p-lg" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          className="flex w-full max-w-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-lg py-md">
            <h2 id="invite-title" className="flex items-center gap-sm font-h3-card-title text-h3-card-title text-on-surface dark:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon name="group_add" className="text-[20px]" />
              </span>
              Arkadaşını Davet Et
            </h2>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-on-surface" aria-label="Kapat">
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <div className="space-y-lg p-lg">
            {/* Copy link */}
            <div className="flex flex-col gap-xs">
              <span className="font-small text-small font-medium text-text dark:text-slate-300">Davet bağlantısı</span>
              <div className="flex gap-sm">
                <input
                  readOnly
                  value={inviteUrl}
                  aria-label="Davet bağlantısı"
                  className="min-w-0 flex-1 rounded-btn border border-border bg-surface-muted px-3 py-2 font-small text-small text-text-muted"
                />
                <button
                  onClick={handleCopy}
                  className="inline-flex flex-none items-center gap-1.5 rounded-btn bg-primary px-3 py-2 font-small text-small font-medium text-on-primary transition-colors hover:bg-primary-hover"
                >
                  <Icon name={copied ? 'check' : 'content_copy'} className="text-[18px]" />
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>

            {/* Email invite */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (emailValid && typeof window !== 'undefined') window.location.href = buildMailtoLink(inviteUrl, email);
              }}
              className="flex flex-col gap-xs"
            >
              <span className="font-small text-small font-medium text-text dark:text-slate-300">E-posta ile davet et</span>
              <div className="flex gap-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arkadas@ornek.com"
                  className="min-w-0 flex-1 rounded-btn border border-border bg-surface px-3 py-2 font-small text-small outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring dark:bg-slate-950 dark:text-slate-200"
                />
                <button
                  type="submit"
                  disabled={!emailValid}
                  className="inline-flex flex-none items-center gap-1.5 rounded-btn border border-border px-3 py-2 font-small text-small font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="mail" className="text-[18px]" /> Gönder
                </button>
              </div>
            </form>

            {/* Quick share */}
            <div className="flex flex-wrap gap-sm">
              {canNativeShare && (
                <button onClick={handleNativeShare} className="inline-flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 font-small text-small text-text transition-colors hover:bg-surface-muted">
                  <Icon name="share" className="text-[18px]" /> Paylaş
                </button>
              )}
              <a
                href={buildWhatsAppLink(inviteUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-btn border border-border px-3 py-2 font-small text-small text-text transition-colors hover:bg-surface-muted"
              >
                <Icon name="chat" className="text-[18px]" /> WhatsApp
              </a>
            </div>

            <p className="font-label-mono text-label-mono text-text-muted">
              Davet bağlantısı kişisel verinizi içermez. Ödül/komisyon sistemi yoktur.
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
}
