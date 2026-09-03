'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { describeError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import BrandMark from '@/components/BrandMark';
import PasswordField from '@/components/PasswordField';

export default function RegisterPage() {
  const { t } = useI18n();
  const { user, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      // The account exists but has no session — send them to sign in, with a
      // note so the redirect doesn't read as the form having failed.
      router.replace('/login?registered=1');
    } catch (err) {
      setError(describeError(err, t.auth.errorCodes, t.common.somethingWentWrong));
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

        <h1 className="auth-title">{t.auth.registerTitle}</h1>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 22 }}>
          {t.auth.registerSubtitle}
        </p>

        <div className="field">
          <label htmlFor="name">{t.auth.nameLabel}</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            autoFocus
            required
            value={name}
            placeholder={t.auth.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="email">{t.auth.emailLabel}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            placeholder={t.auth.emailPlaceholder}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PasswordField
          id="password"
          label={t.auth.passwordLabel}
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          placeholder={t.auth.passwordPlaceholder}
          onChange={(e) => setPassword(e.target.value)}
          hint={
            <span className="muted" style={{ fontSize: 11.5 }}>
              {t.auth.passwordHint}
            </span>
          }
        />

        <label className="consent-check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
          <span>
            {t.auth.agreePrefix}{' '}
            {/* Internal routes — target="_blank" used to force these open in
                a new tab, which on an installed PWA pops the whole app out
                into the system browser instead of navigating in place. */}
            <Link href="/privacy">{t.auth.privacyPolicy}</Link>{' '}
            {t.auth.and}{' '}
            <Link href="/terms">{t.auth.termsOfService}</Link>
          </span>
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={submitting || !agreed}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {submitting ? t.auth.registerSubmitting : t.auth.registerButton}
        </button>

        <p className="muted auth-switch">
          {t.auth.hasAccount} <Link href="/login">{t.auth.signInLink}</Link>
        </p>
      </form>
    </div>
  );
}
