'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useI18n } from '@/lib/i18n';
import BrandMark from './BrandMark';

/** Blocks rendering of the app until a session is confirmed; bounces to /login otherwise. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="auth-loading">
        <BrandMark />
        <p className="muted">{t.auth.loadingSession}</p>
      </div>
    );
  }

  return <>{children}</>;
}
