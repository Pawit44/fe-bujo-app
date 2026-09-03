'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarClock, ListTodo } from 'lucide-react';
import EntryList from '@/components/EntryList';
import WeekTimeline from '@/components/WeekTimeline';
import ErrorToast from '@/components/ErrorToast';
import {
  addDays,
  formatRange,
  fromISODate,
  isDateInRange,
  isToday,
  isWeekend,
  startOfWeek,
  toISODate,
  weekDays,
} from '@/lib/date';
import { useCollections } from '@/lib/useCollections';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `?date=YYYY-MM-DD` deep-links here to the week that contains that day —
 * the Index page's recent-activity list uses this to point at a specific
 * entry instead of just landing on the current week. */
function initialAnchor(param: string | null): string {
  if (param && DATE_RE.test(param) && isDateInRange(param)) return toISODate(startOfWeek(fromISODate(param)));
  return toISODate(startOfWeek(new Date()));
}

// useSearchParams needs a Suspense boundary, otherwise the whole route opts
// out of static prerendering.
export default function WeeklyLogPage() {
  return (
    <Suspense>
      <WeeklyLog />
    </Suspense>
  );
}

function WeeklyLog() {
  const { t } = useI18n();
  const dateParam = useSearchParams().get('date');
  const [anchor, setAnchor] = useState(() => initialAnchor(dateParam));
  const [view, setView] = useState<'list' | 'timeline'>('timeline');
  const collections = useCollections();

  const days = useMemo(() => weekDays(fromISODate(anchor)), [anchor]);
  const journal = useEntries({ logKind: 'weekly', from: days[0], to: days[6] });

  const byDay = useMemo(() => {
    const map: Record<string, typeof journal.entries> = {};
    for (const d of days) map[d] = [];
    for (const entry of journal.entries) {
      if (map[entry.date]) map[entry.date].push(entry);
    }
    return map;
  }, [journal.entries, days]);

  const open = journal.entries.filter((e) => e.status === 'open').length;
  const done = journal.entries.filter((e) => e.status === 'done').length;
  const shift = (weeks: number) => setAnchor(toISODate(addDays(fromISODate(anchor), weeks * 7)));
  // The far edge of the week being shifted to — day 0 going back, day 6 going forward.
  const canGoBack = isDateInRange(toISODate(addDays(fromISODate(anchor), -7)));
  const canGoForward = isDateInRange(toISODate(addDays(fromISODate(anchor), 13)));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.weekly.eyebrow}</div>
          <h1 className="page-title">{formatRange(days[0], days[6], t.dates.months)}</h1>
          <p className="page-sub">
            {journal.entries.length === 0 ? t.weekly.captureAsWeekHappens : t.weekly.openDone(open, done)}
          </p>
        </div>

        <div className="head-actions">
          <div className="view-toggle" role="group" aria-label="View">
            <button
              type="button"
              className={view === 'timeline' ? 'on' : ''}
              onClick={() => setView('timeline')}
              title={t.weekly.viewTimeline}
            >
              <CalendarClock size={14} strokeWidth={1.8} />
              <span>{t.weekly.viewTimeline}</span>
            </button>
            <button
              type="button"
              className={view === 'list' ? 'on' : ''}
              onClick={() => setView('list')}
              title={t.weekly.viewList}
            >
              <ListTodo size={14} strokeWidth={1.8} />
              <span>{t.weekly.viewList}</span>
            </button>
          </div>
          <button
            className="btn btn-icon"
            onClick={() => shift(-1)}
            disabled={!canGoBack}
            title={canGoBack ? t.weekly.previousWeek : t.common.navLimit}
          >
            ‹
          </button>
          <button className="btn btn-sm" onClick={() => setAnchor(toISODate(startOfWeek(new Date())))}>
            {t.weekly.thisWeek}
          </button>
          <button
            className="btn btn-icon"
            onClick={() => shift(1)}
            disabled={!canGoForward}
            title={canGoForward ? t.weekly.nextWeek : t.common.navLimit}
          >
            ›
          </button>
        </div>
      </header>

      {journal.loading ? (
        <div className="week-grid">
          {days.map((d) => (
            <div key={d} className="skeleton" style={{ height: 190 }} />
          ))}
        </div>
      ) : view === 'timeline' ? (
        <WeekTimeline
          days={days}
          byDay={byDay}
          onAdd={journal.add}
          onUpdate={journal.update}
          onDelete={journal.remove}
        />
      ) : (
        <div className="week-grid">
          {days.map((iso, i) => (
            <section
              key={iso}
              className={`day-panel ${isToday(iso) ? 'is-today' : ''} ${isWeekend(iso) ? 'is-weekend' : ''}`}
            >
              <Link href={`/daily?date=${iso}`} className="day-panel-head" title={t.todayFocus.goToDailyLogCta}>
                <h2 className="day-name">{t.dates.days[i]}</h2>
                <span className="day-num">{iso.slice(8)}</span>
              </Link>
              <div className="day-panel-body">
                <EntryList
                  entries={byDay[iso] ?? []}
                  collections={collections}
                  context={{ logKind: 'weekly', date: iso }}
                  onAdd={journal.add}
                  onToggle={journal.toggle}
                  onUpdate={journal.update}
                  onDelete={journal.remove}
                  onMigrate={journal.migrate}
                  onReorder={journal.reorder}
                />
              </div>
            </section>
          ))}
        </div>
      )}
      <ErrorToast message={journal.error} onDismiss={() => journal.setError(null)} />
    </div>
  );
}
