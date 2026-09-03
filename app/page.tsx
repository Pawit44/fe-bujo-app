'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { formatDayLong, formatMonth, fromISODate } from '@/lib/date';
import { useI18n } from '@/lib/i18n';
import { useOverview } from '@/lib/useOverview';
import { CollectionIcon, LOG_ICONS } from '@/components/icons';
import RecentActivityList from '@/components/RecentActivityList';
import TodayFocus from '@/components/TodayFocus';
import type { Entry } from '@/lib/types';

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

export default function IndexPage() {
  const { t } = useI18n();
  const { data, loading } = useOverview();

  const LOG_META: Record<string, { href: string; Icon: (typeof LOG_ICONS)[keyof typeof LOG_ICONS]; label: string }> = {
    future: { href: '/future', Icon: LOG_ICONS.future, label: t.sidebar.logs.future },
    monthly: { href: '/monthly', Icon: LOG_ICONS.monthly, label: t.sidebar.logs.monthly },
    weekly: { href: '/weekly', Icon: LOG_ICONS.weekly, label: t.sidebar.logs.weekly },
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
        <div className="skeleton" style={{ height: 60, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 200, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 90 }} />
      </div>
    );
  }

  const today = fromISODate(data.today);

  return (
    <div className="page">
      <header className="hero hero-compact">
        <div className="eyebrow">{t.index.eyebrow}</div>
        <h1 className="hero-date">
          {today.getDate()} {t.dates.months[today.getMonth()]}
          <span style={{ color: 'var(--ink-faint)' }}> {today.getFullYear()}</span>
        </h1>
      </header>

      <TodayFocus />

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

      {/* TodayFocus above already covers "today" in full — Weekly, Monthly
          and Future all get equal billing as a slim link row rather than
          competing full-size cards, since a second big block here would just
          duplicate the "here's your day" framing TodayFocus already owns. */}
      <div className="mini-log-row">
        {data.logs.map((log) => {
          const meta = LOG_META[log.key];
          return (
            <Link key={log.key} href={meta.href} className="mini-log-link">
              <meta.Icon size={15} strokeWidth={1.8} />
              <span>{meta.label}</span>
              {log.open > 0 && <span className="pill">{log.open}</span>}
            </Link>
          );
        })}
      </div>

      <section className="card" style={{ marginTop: 20 }}>
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

      {data.recent.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <h2 className="card-title">{t.index.recentActivityTitle}</h2>
            <span className="muted recent-activity-hint" style={{ fontSize: 12 }}>
              {t.index.recentActivityHint}
            </span>
          </div>
          <RecentActivityList entries={data.recent} href={entryHref} meta={recentMeta} />
        </section>
      )}
    </div>
  );
}
