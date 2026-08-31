'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import BrandMark from '@/components/BrandMark';

// useSearchParams needs a Suspense boundary, otherwise the whole route opts
// out of static prerendering.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { t } = useI18n();
  const { user, login } = useAuth();
  const router = useRouter();
  const justRegistered = useSearchParams().get('registered') === '1';

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand" style={{ padding: 0, marginBottom: 22 }}>
          <BrandMark />
          <div>
            <div className="brand-name">Bujo</div>
          </div>
        </div>

        <h1 className="auth-title">{t.auth.loginTitle}</h1>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: justRegistered ? 14 : 22 }}>
          {t.auth.loginSubtitle}
        </p>

        {justRegistered && <div className="auth-notice">{t.auth.registeredNotice}</div>}

        <div className="field">
          <label htmlFor="email">{t.auth.emailLabel}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            placeholder={t.auth.emailPlaceholder}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">{t.auth.passwordLabel}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            placeholder={t.auth.passwordPlaceholder}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
          {submitting ? t.auth.loginSubmitting : t.auth.loginButton}
        </button>

        <p className="muted auth-switch">
          {t.auth.noAccount} <Link href="/register">{t.auth.signUpLink}</Link>
        </p>
      </form>
    </div>
  );
}
