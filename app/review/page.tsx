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
 * month, or future-log slot has already passed, so the reader works through
 * it as a short checklist — decide, for each, whether it's done, still worth
 * doing (migrate it forward), or not (drop it) — rather than hunting stale
 * tasks down one old week or month at a time.
 *
 * Grouped in two tiers rather than one flat list of three sections, because
 * they aren't the same *kind* of item: a day or month entry sitting here is
 * genuinely stuck — its time ran out while it was still open. A Future Log
 * entry sitting here just had its month start; nothing about it slipped, it
 * simply needs filing into a real log now. Telling those apart up front is
 * what keeps "4 things to review" from reading as one undifferentiated pile.
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

  const stuckGroups = [
    {
      key: 'weekly',
      Icon: CalendarDays,
      title: t.review.pastDaysTitle,
      entries: groups.weekly,
      label: (e: Entry) => formatDayLong(e.date, t.dates.months, t.dates.days),
    },
    {
      key: 'monthly',
      Icon: Rows3,
      title: t.review.pastMonthsTitle,
      entries: groups.monthly,
      label: (e: Entry) => formatMonth(e.month, t.dates.months),
    },
  ].filter((g) => g.entries.length > 0);

  const stuckCount = groups.weekly.length + groups.monthly.length;

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

      <p className="review-intro">{t.review.intro}</p>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {stuckCount > 0 && (
            <section className="review-tier review-tier-stuck">
              <div className="review-tier-head">
                <h2 className="review-tier-title">{t.review.stuckGroupTitle}</h2>
                <span className="pill">{stuckCount}</span>
              </div>
              <p className="review-tier-blurb">{t.review.stuckGroupBlurb}</p>

              <div className="review-subgroups">
                {stuckGroups.map((group) => (
                  <div key={group.key} className="card review-subgroup">
                    <div className="card-head">
                      <h3 className="card-title review-subgroup-title">
                        <group.Icon size={15} strokeWidth={1.8} style={{ color: 'var(--ink-faint)' }} />
                        {group.title}
                      </h3>
                      <span className="pill">{group.entries.length}</span>
                    </div>
                    <div style={{ padding: '0 8px 10px' }}>
                      {group.entries.map((entry) => (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          collections={collections}
                          showContext={group.label(entry)}
                          onToggle={review.toggle}
                          onUpdate={review.update}
                          onDelete={review.remove}
                          onMigrate={review.migrate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {groups.future.length > 0 && (
            <section className="review-tier review-tier-waiting">
              <div className="review-tier-head">
                <h2 className="review-tier-title">{t.review.waitingGroupTitle}</h2>
                <span className="pill">{groups.future.length}</span>
              </div>
              <p className="review-tier-blurb">{t.review.waitingGroupBlurb}</p>

              <div className="card review-subgroup">
                <div className="card-head">
                  <h3 className="card-title review-subgroup-title">
                    <CalendarClock size={15} strokeWidth={1.8} style={{ color: 'var(--ink-faint)' }} />
                    {t.review.arrivedTitle}
                  </h3>
                  <span className="pill">{groups.future.length}</span>
                </div>
                <div style={{ padding: '0 8px 10px' }}>
                  {groups.future.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      collections={collections}
                      showContext={formatMonth(entry.month, t.dates.months)}
                      onToggle={review.toggle}
                      onUpdate={review.update}
                      onDelete={review.remove}
                      onMigrate={review.migrate}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      <ErrorToast message={review.error} onDismiss={() => review.setError(null)} />
    </div>
  );
}
