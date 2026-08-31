'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import { useAuth } from '@/lib/AuthProvider';
import { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { deleteAccount } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await deleteAccount(password);
      router.replace('/login');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2>{t.auth.deleteAccountTitle}</h2>
      <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>
        {t.auth.deleteAccountWarning}
      </p>
      <div className="field">
        <label htmlFor="confirm-password">{t.auth.confirmPasswordLabel}</label>
        <input
          id="confirm-password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      {error && <div className="auth-error">{error}</div>}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          {t.common.cancel}
        </button>
        <button className="btn btn-danger" onClick={submit} disabled={submitting || !password}>
          {submitting ? t.auth.deleteAccountSubmitting : t.auth.deleteAccountButton}
        </button>
      </div>
    </Modal>
  );
}
