'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatMonth, formatMonthShort, formatRange, fromISODate } from '@/lib/date';
import { glyphFor } from '@/components/Bullet';
import { useI18n } from '@/lib/i18n';
import { CollectionIcon, LOG_ICONS } from '@/components/icons';
import type { IndexOverview } from '@/lib/types';

export default function IndexPage() {
  const { t } = useI18n();
  const [data, setData] = useState<IndexOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const LOG_META: Record<string, { href: string; Icon: (typeof LOG_ICONS)[keyof typeof LOG_ICONS]; blurb: string; label: string }> = {
    future: { href: '/future', Icon: LOG_ICONS.future, blurb: t.index.blurbs.future, label: t.sidebar.logs.future },
    monthly: { href: '/monthly', Icon: LOG_ICONS.monthly, blurb: t.index.blurbs.monthly, label: t.sidebar.logs.monthly },
    weekly: { href: '/weekly', Icon: LOG_ICONS.weekly, blurb: t.index.blurbs.weekly, label: t.sidebar.logs.weekly },
  };

  useEffect(() => {
    api.overview().then(setData).catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="empty empty-lg">
          <div className="empty-glyph">
            <AlertTriangle size={26} strokeWidth={1.5} />
          </div>
          {t.index.couldNotReach}
          <div style={{ marginTop: 6, fontSize: 12 }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 90, marginBottom: 28 }} />
        <div className="grid grid-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 150 }} />
          ))}
        </div>
      </div>
    );
  }

  const today = fromISODate(data.today);
  const done = data.totals.done;
  const total = data.totals.entries;
  const rate = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="eyebrow">{t.index.eyebrow}</div>
          <h1 className="hero-date">
            {today.getDate()} {t.dates.months[today.getMonth()]}
            <span style={{ color: 'var(--ink-faint)' }}> {today.getFullYear()}</span>
          </h1>
          <p className="page-sub">{t.index.subtitle}</p>
        </div>

        <div className="progress-ring">
          <ProgressRing value={rate} />
          <div>
            <div className="ring-value">{rate}%</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {t.index.entriesDone(done, total)}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-3" style={{ marginBottom: 26 }}>
        {data.logs.map((log) => {
          const meta = LOG_META[log.key];
          const pct = log.total ? Math.round((log.done / log.total) * 100) : 0;
          return (
            <Link key={log.key} href={meta.href} className="log-card">
              <div className="log-card-top">
                <div className="log-glyph">
                  <meta.Icon size={19} strokeWidth={1.8} />
                </div>
                <span className="pill">
                  {log.open} {t.common.open}
                </span>
              </div>
              <div>
                <div className="log-name">{meta.label}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {log.key === 'monthly'
                    ? formatMonth(data.month, t.dates.months)
                    : log.key === 'weekly'
                      ? formatRange(data.weekStart, data.weekEnd, t.dates.months)
                      : meta.blurb}
                </div>
              </div>
              <div className="bar">
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="stat-row">
                <span>
                  <b>{log.total}</b> {t.common.entries}
                </span>
                <span>
                  <b>{log.done}</b> {t.common.done}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <div className="grid grid-2">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">{t.index.collectionsTitle}</h2>
            <Link href="/collections" className="btn btn-sm btn-ghost">
              {t.index.manage}
            </Link>
          </div>
          {data.collections.length === 0 ? (
            <div className="empty">{t.index.noCollectionsYet}</div>
          ) : (
            <div>
              {data.collections.map((col) => (
                <Link key={col.id} href={`/collections/${col.id}`} className="index-line">
                  <span className="index-icon">
                    <CollectionIcon icon={col.icon} size={14} />
                  </span>
                  <span>{col.title}</span>
                  <span className="index-dots" />
                  {col.pinned && <span className="pill">{t.common.pinned}</span>}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">{t.index.monthsAheadTitle}</h2>
            <Link href="/future" className="btn btn-sm btn-ghost">
              {t.index.futureLogLink}
            </Link>
          </div>
          <div>
            {data.futureMonths.map((m) => (
              <Link key={m.month} href={`/future?month=${m.month}`} className="index-line">
                <span className="index-icon" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
                  {formatMonthShort(m.month, t.dates.months)}
                </span>
                <span>{formatMonth(m.month, t.dates.months)}</span>
                <span className="index-dots" />
                <span className="pill">{m.total === 0 ? t.common.empty : `${m.open} ${t.common.open}`}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {data.recent.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <h2 className="card-title">{t.index.recentActivityTitle}</h2>
          </div>
          <div style={{ padding: '10px 14px' }}>
            {data.recent.map((entry) => (
              <div key={entry.id} className="entry">
                <span
                  className={`bullet ${entry.status} type-${entry.type}`}
                  style={{ pointerEvents: 'none' }}
                >
                  {glyphFor(entry.type, entry.status)}
                </span>
                <div className="entry-body">
                  <span className="entry-text">{entry.content}</span>
                  <div className="entry-meta">
                    {entry.logKind === 'weekly'
                      ? entry.date
                      : entry.logKind === 'collection'
                        ? t.common.collection
                        : entry.month || entry.logKind}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card card-pad" style={{ marginTop: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          {t.index.keyTitle}
        </div>
        <div className="legend">
          <span>
            <code>•</code> {t.index.legend.task}
          </span>
          <span>
            <code>○</code> {t.index.legend.event}
          </span>
          <span>
            <code>—</code> {t.index.legend.note}
          </span>
          <span>
            <code>×</code> {t.index.legend.completed}
          </span>
          <span>
            <code>&gt;</code> {t.index.legend.migrated}
          </span>
          <span>
            <code>&lt;</code> {t.index.legend.scheduled}
          </span>
          <span>
            <code>★</code> {t.index.legend.priority}
          </span>
          <span>
            <code>!</code> {t.index.legend.inspiration}
          </span>
        </div>
      </section>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--paper-sunken)" strokeWidth="5" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * value) / 100}
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,0.61,0.36,1)' }}
      />
    </svg>
  );
}
