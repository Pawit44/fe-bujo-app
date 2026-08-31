'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarRange, CheckCircle2, LayoutList, ListTodo, LogOut, RotateCcw, Rows3, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { useCollections } from '@/lib/useCollections';
import { useOverview } from '@/lib/useOverview';
import { useI18n } from '@/lib/i18n';
import DeleteAccountModal from '@/components/DeleteAccountModal';

/**
 * The account's own page: who's signed in, a quick read on how the journal
 * is going, and the account-level actions (sign out, delete) that don't
 * belong scattered across the logs themselves.
 */
export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { user, logout } = useAuth();
  const { data } = useOverview();
  const collections = useCollections();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) return null;

  const total = data?.totals.entries ?? 0;
  const done = data?.totals.done ?? 0;
  const rate = total ? Math.round((done / total) * 100) : 0;
  const dueForReview = data?.dueForReview ?? 0;

  const memberSince = new Date(user.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const logTiles = data
    ? [
        { key: 'future', Icon: CalendarRange, href: '/future', label: t.sidebar.logs.future, log: data.logs.find((l) => l.key === 'future') },
        { key: 'monthly', Icon: LayoutList, href: '/monthly', label: t.sidebar.logs.monthly, log: data.logs.find((l) => l.key === 'monthly') },
        { key: 'weekly', Icon: Rows3, href: '/weekly', label: t.sidebar.logs.weekly, log: data.logs.find((l) => l.key === 'weekly') },
      ]
    : [];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.profile.eyebrow}</div>
          <h1 className="page-title">{t.profile.title}</h1>
        </div>
      </header>

      <section className="card card-pad profile-hero">
        <div className="profile-avatar">{(user.name || user.email)[0]?.toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div className="profile-name">{user.name || user.email}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {user.email}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {t.profile.memberSince(memberSince)}
            {user.role === 'admin' && (
              <>
                {' '}
                · <span className="role-badge admin">{t.admin.roleAdmin}</span>
              </>
            )}
          </div>
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          {t.profile.statsTitle}
        </div>
        <div className="grid grid-3">
          <div className="card card-pad profile-stat">
            <ListTodo size={17} strokeWidth={1.8} style={{ color: 'var(--ink-faint)' }} />
            <div className="profile-stat-value">{total}</div>
            <div className="muted profile-stat-label">{t.profile.totalEntries}</div>
          </div>
          <div className="card card-pad profile-stat">
            <CheckCircle2 size={17} strokeWidth={1.8} style={{ color: 'var(--done)' }} />
            <div className="profile-stat-value">{done}</div>
            <div className="muted profile-stat-label">{t.profile.completed}</div>
          </div>
          <div className="card card-pad profile-stat">
            <div className="profile-stat-ring">{rate}%</div>
            <div className="muted profile-stat-label">{t.profile.completionRate}</div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          {t.profile.logsTitle}
        </div>
        <div className="grid grid-3">
          {logTiles.map(
            (tile) =>
              tile.log && (
                <Link key={tile.key} href={tile.href} className="card card-pad profile-log-tile">
                  <tile.Icon size={16} strokeWidth={1.8} style={{ color: 'var(--ink-faint)' }} />
                  <span>{tile.label}</span>
                  <span className="pill" style={{ marginLeft: 'auto' }}>
                    {tile.log.open} {t.common.open}
                  </span>
                </Link>
              ),
          )}
          <Link href="/collections" className="card card-pad profile-log-tile">
            <LayoutList size={16} strokeWidth={1.8} style={{ color: 'var(--ink-faint)' }} />
            <span>{t.profile.collectionsCount}</span>
            <span className="pill" style={{ marginLeft: 'auto' }}>
              {collections.length}
            </span>
          </Link>
        </div>
      </section>

      <Link href="/review" className={`review-banner profile-review-banner ${dueForReview === 0 ? 'is-clear' : ''}`} style={{ marginTop: 22 }}>
        <span className="review-banner-icon">
          <RotateCcw size={18} strokeWidth={1.8} />
        </span>
        <div className="review-banner-body">
          <div className="review-banner-title">
            {dueForReview === 0 ? t.profile.reviewCardAllClear : t.profile.reviewCardTitle}
          </div>
        </div>
        {dueForReview > 0 && (
          <>
            <span className="pill">{dueForReview}</span>
            <span className="review-banner-cta">{t.profile.reviewCardCta} →</span>
          </>
        )}
      </Link>

      <section className="card card-pad" style={{ marginTop: 22 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          {t.profile.accountSection}
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
          {t.profile.accountSectionBlurb}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => logout()}>
            <LogOut size={14} strokeWidth={1.8} /> {t.auth.logout}
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={14} strokeWidth={1.8} /> {t.auth.deleteAccount}
          </button>
        </div>
      </section>

      {deleteOpen && <DeleteAccountModal onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}
