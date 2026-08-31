'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { formatDayLong, formatMonth, formatMonthShort, formatRange, fromISODate } from '@/lib/date';
import { glyphFor } from '@/components/Bullet';
import { useI18n } from '@/lib/i18n';
import { useOverview } from '@/lib/useOverview';
import { CollectionIcon, LOG_ICONS } from '@/components/icons';
import type { Entry, IndexOverview } from '@/lib/types';

/** Where tapping this entry on the Index page should take you — the exact
 * spot it lives, not just the log in general, so a task added three months
 * out is one tap away instead of requiring the reader to guess and page
 * forward by hand. */
function entryHref(entry: Entry): string {
  switch (entry.logKind) {
    case 'weekly':
      return `/weekly?date=${entry.date}`;
    case 'monthly':
      return `/monthly?month=${entry.month}`;
    case 'future':
      return `/future?month=${entry.month}`;
    case 'collection':
      return entry.collectionId ? `/collections/${entry.collectionId}` : '/collections';
  }
}

/** The most recently-touched entry that actually belongs to this log card,
 * so the card shows *which* entry its count refers to instead of a bare
 * number the reader has to click through to identify. */
function previewFor(logKey: string, data: IndexOverview): Entry | undefined {
  return data.recent.find((e) => {
    if (e.logKind !== logKey) return false;
    if (logKey === 'monthly') return e.month === data.month;
    if (logKey === 'weekly') return e.date >= data.weekStart && e.date <= data.weekEnd;
    return true;
  });
}

export default function IndexPage() {
  const { t } = useI18n();
  const { data, loading } = useOverview();

  const LOG_META: Record<string, { href: string; Icon: (typeof LOG_ICONS)[keyof typeof LOG_ICONS]; blurb: string; label: string }> = {
    future: { href: '/future', Icon: LOG_ICONS.future, blurb: t.index.blurbs.future, label: t.sidebar.logs.future },
    monthly: { href: '/monthly', Icon: LOG_ICONS.monthly, blurb: t.index.blurbs.monthly, label: t.sidebar.logs.monthly },
    weekly: { href: '/weekly', Icon: LOG_ICONS.weekly, blurb: t.index.blurbs.weekly, label: t.sidebar.logs.weekly },
  };

  /** The small tag under a recent-activity entry — which log it's in, and
   * exactly where: a day, a month, or a collection's own name. */
  function recentMeta(entry: Entry): string {
    switch (entry.logKind) {
      case 'weekly':
        return formatDayLong(entry.date, t.dates.months, t.dates.days);
      case 'monthly':
        return `${t.sidebar.logs.monthly} · ${formatMonth(entry.month, t.dates.months)}`;
      case 'future':
        return `${t.sidebar.logs.future} · ${formatMonth(entry.month, t.dates.months)}`;
      case 'collection': {
        const col = data?.collections.find((c) => c.id === entry.collectionId);
        return col ? col.title : t.common.collection;
      }
    }
  }

  if (!loading && !data) {
    return (
      <div className="page">
        <div className="empty empty-lg">
          <div className="empty-glyph">
            <AlertTriangle size={26} strokeWidth={1.5} />
          </div>
          {t.index.couldNotReach}
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

      {data.dueForReview > 0 && (
        <Link href="/review" className="review-banner">
          <span className="review-banner-icon">
            <RotateCcw size={18} strokeWidth={1.8} />
          </span>
          <div className="review-banner-body">
            <div className="review-banner-title">{t.index.reviewBanner(data.dueForReview)}</div>
            <div className="review-banner-blurb">{t.index.reviewBannerBlurb}</div>
          </div>
          <span className="review-banner-cta">{t.index.reviewBannerCta} →</span>
        </Link>
      )}

      <section className="grid grid-3" style={{ marginBottom: 26 }}>
        {data.logs.map((log) => {
          const meta = LOG_META[log.key];
          const pct = log.total ? Math.round((log.done / log.total) * 100) : 0;
          const preview = previewFor(log.key, data);
          return (
            <Link key={log.key} href={preview ? entryHref(preview) : meta.href} className="log-card">
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
                {/* The point of this line: answer "which one?" right where the
                    count is shown, instead of making that a click-through question. */}
                {preview && (
                  <div className="log-card-preview" title={preview.content}>
                    “{preview.content}”
                  </div>
                )}
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
            <span className="muted recent-activity-hint" style={{ fontSize: 12 }}>
              {t.index.recentActivityHint}
            </span>
          </div>
          <div style={{ padding: '4px 8px 8px' }}>
            {data.recent.map((entry) => (
              <Link key={entry.id} href={entryHref(entry)} className={`entry recent-entry ${entry.status}`}>
                <span className={`bullet ${entry.status} type-${entry.type}`} style={{ pointerEvents: 'none' }}>
                  {glyphFor(entry.type, entry.status)}
                </span>
                <div className="entry-body">
                  <span className="entry-text">{entry.content}</span>
                  <div className="entry-meta">{recentMeta(entry)}</div>
                </div>
              </Link>
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
