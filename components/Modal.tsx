'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders its content into a portal on `document.body` instead of in place.
 * A plain in-place overlay gets visually clipped/misscaled whenever an
 * ancestor uses a CSS transform or animation (e.g. `.page`'s entrance
 * animation) — that ancestor becomes the containing block for `position:
 * fixed`, so the "full screen" overlay only covers that ancestor's box.
 * Portaling to `document.body` sidesteps the problem entirely.
 */
export default function Modal({
  children,
  onClose,
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className={`modal ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
