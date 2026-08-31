'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

/**
 * Surfaces a mutation failure (network error, validation, quota reached,
 * rate limited) that would otherwise fail completely silently — the
 * optimistic UI update just rolls back with no explanation. Auto-dismisses
 * so a transient error doesn't linger forever.
 */
export default function ErrorToast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="toast" role="alert">
      <span>{message}</span>
      <button type="button" onClick={onDismiss}>
        {t.common.dismiss}
      </button>
    </div>
  );
}
