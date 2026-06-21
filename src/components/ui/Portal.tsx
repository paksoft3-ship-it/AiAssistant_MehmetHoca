import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into a fresh node appended to <body>, so overlays/modals
 * escape any ancestor stacking context, overflow clipping, or fixed-position
 * containing block created by the app layout.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [el] = useState(() =>
    typeof document !== 'undefined' ? document.createElement('div') : null,
  );

  useEffect(() => {
    if (!el) return;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  if (!el) return null;
  return createPortal(children, el);
}
