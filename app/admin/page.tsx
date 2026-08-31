'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import { api, describeError } from '@/lib/api';
import { useAuth } from '@/lib/AuthProvider';
import { useI18n } from '@/lib/i18n';
import ErrorToast from '@/components/ErrorToast';
import type { Role, User } from '@/lib/types';

export default function AdminPage() {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Client-side guard for UX only — the API enforces this independently.
  useEffect(() => {
    if (me && me.role !== 'admin') router.replace('/');
  }, [me, router]);

  const load = () =>
    api
      .adminUsers()
      .then(setUsers)
      .catch(() => undefined)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const setRole = async (id: number, role: Role) => {
    try {
      const updated = await api.adminUpdateRole(id, role);
      setUsers((list) => list.map((u) => (u.id === id ? updated : u)));
    } catch (e) {
      setError(describeError(e, t.auth.errorCodes, t.common.somethingWentWrong));
    }
  };

  const remove = async () => {
    if (!confirming) return;
    try {
      await api.adminDeleteUser(confirming.id);
      setUsers((list) => list.filter((u) => u.id !== confirming.id));
      setConfirming(null);
    } catch (e) {
      setError(describeError(e, t.auth.errorCodes, t.common.somethingWentWrong));
      setConfirming(null);
    }
  };

  if (me && me.role !== 'admin') return null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.admin.navLabel}</div>
          <h1 className="page-title">{t.admin.title}</h1>
          <p className="page-sub">{t.admin.subtitle}</p>
        </div>
      </header>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : (
        <section className="card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.admin.name}</th>
                <th>{t.admin.email}</th>
                <th>{t.admin.role}</th>
                <th>{t.admin.joined}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.name || '—'} {me?.id === u.id && <span className="muted">{t.admin.you}</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge ${u.role === 'admin' ? 'admin' : ''}`}>
                      {u.role === 'admin' ? t.admin.roleAdmin : t.admin.roleUser}
                    </span>
                  </td>
                  <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-actions">
                      {u.role === 'admin' ? (
                        <button
                          className="btn btn-sm btn-ghost"
                          disabled={me?.id === u.id}
                          onClick={() => setRole(u.id, 'user')}
                        >
                          <ShieldOff size={13} strokeWidth={1.8} /> {t.admin.makeUser}
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-ghost" onClick={() => setRole(u.id, 'admin')}>
                          <ShieldCheck size={13} strokeWidth={1.8} /> {t.admin.makeAdmin}
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-ghost"
                        disabled={me?.id === u.id}
                        onClick={() => setConfirming(u)}
                      >
                        <Trash2 size={13} strokeWidth={1.8} /> {t.admin.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {confirming && (
        <div className="overlay" onClick={() => setConfirming(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.admin.deleteTitle}</h2>
            <p className="muted" style={{ fontSize: 13.5 }}>
              {t.admin.deleteBody(confirming.email)}
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirming(null)}>
                {t.common.cancel}
              </button>
              <button className="btn btn-primary" onClick={remove}>
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </div>
  );
}
