'use client';

import { useMemo } from 'react';
import { CalendarClock, CalendarDays, PartyPopper, Rows3 } from 'lucide-react';
import EntryRow from '@/components/EntryRow';
import ErrorToast from '@/components/ErrorToast';
import { formatDayLong, formatMonth } from '@/lib/date';
import { useCollections } from '@/lib/useCollections';
import { useReview } from '@/lib/useReview';
import { useI18n } from '@/lib/i18n';
import type { Entry } from '@/lib/types';

/**
 * The BuJo migration ritual, made concrete: every open entry whose day,
 * month, or future-log slot has already passed, grouped by where it's
 * overdue from, so the reader works through it as a short checklist —
 * decide, for each, whether it's done, still worth doing (migrate it
 * forward), or not (drop it) — rather than hunting stale tasks down one old
 * week or month at a time.
 */
export default function ReviewPage() {
  const { t } = useI18n();
  const collections = useCollections();
  const review = useReview();

  const groups = useMemo(() => {
    const weekly: Entry[] = [];
    const monthly: Entry[] = [];
    const future: Entry[] = [];
    for (const e of review.entries) {
      if (e.logKind === 'weekly') weekly.push(e);
      else if (e.logKind === 'monthly') monthly.push(e);
      else if (e.logKind === 'future') future.push(e);
    }
    return { weekly, monthly, future };
  }, [review.entries]);

  const sections = [
    {
      key: 'weekly',
      Icon: CalendarDays,
      title: t.review.pastDaysTitle,
      blurb: t.review.pastDaysBlurb,
      entries: groups.weekly,
      label: (e: Entry) => formatDayLong(e.date, t.dates.months, t.dates.days),
    },
    {
      key: 'monthly',
      Icon: Rows3,
      title: t.review.pastMonthsTitle,
      blurb: t.review.pastMonthsBlurb,
      entries: groups.monthly,
      label: (e: Entry) => formatMonth(e.month, t.dates.months),
    },
    {
      key: 'future',
      Icon: CalendarClock,
      title: t.review.arrivedTitle,
      blurb: t.review.arrivedBlurb,
      entries: groups.future,
      label: (e: Entry) => formatMonth(e.month, t.dates.months),
    },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.review.eyebrow}</div>
          <h1 className="page-title">{t.review.title}</h1>
          <p className="page-sub">
            {review.entries.length === 0 ? t.review.subtitleEmpty : t.review.subtitleCount(review.entries.length)}
          </p>
        </div>
      </header>

      {!review.loading && review.entries.length === 0 && (
        <div className="empty empty-lg">
          <div className="empty-glyph">
            <PartyPopper size={26} strokeWidth={1.5} />
          </div>
          {t.review.allClear}
        </div>
      )}

      {review.loading ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {sections.map(
            (section) =>
              section.entries.length > 0 && (
                <section key={section.key} className="card">
                  <div className="card-head">
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <section.Icon size={16} strokeWidth={1.8} style={{ color: 'var(--ink-faint)' }} />
                      {section.title}
                    </h2>
                    <span className="pill">{section.entries.length}</span>
                  </div>
                  <p className="muted" style={{ fontSize: 12.5, padding: '0 14px', marginTop: -4, marginBottom: 8 }}>
                    {section.blurb}
                  </p>
                  <div style={{ padding: '0 8px 10px' }}>
                    {section.entries.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        collections={collections}
                        showContext={section.label(entry)}
                        onToggle={review.toggle}
                        onUpdate={review.update}
                        onDelete={review.remove}
                        onMigrate={review.migrate}
                      />
                    ))}
                  </div>
                </section>
              ),
          )}
        </div>
      )}

      <ErrorToast message={review.error} onDismiss={() => review.setError(null)} />
    </div>
  );
}
