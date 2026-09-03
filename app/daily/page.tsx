'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarClock, ListTodo } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import EntryList from '@/components/EntryList';
import WeekTimeline from '@/components/WeekTimeline';
import ErrorToast from '@/components/ErrorToast';
import {
  addDays,
  formatDayLong,
  formatMonth,
  formatRange,
  fromISODate,
  isDateInRange,
  startOfWeek,
  toISODate,
  todayISO,
} from '@/lib/date';
import { useCollections } from '@/lib/useCollections';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `?date=YYYY-MM-DD` deep-links here to a specific day — same convention
 * the Weekly and Monthly logs use from the Index page's recent-activity list. */
function initialDate(param: string | null): string {
  if (param && DATE_RE.test(param) && isDateInRange(param)) return param;
  return todayISO();
}

// useSearchParams needs a Suspense boundary, otherwise the whole route opts
// out of static prerendering.
export default function DailyLogPage() {
  return (
    <Suspense>
      <DailyLog />
    </Suspense>
  );
}

function DailyLog() {
  const { t } = useI18n();
  const dateParam = useSearchParams().get('date');
  const [selected, setSelected] = useState(() => initialDate(dateParam));
  const [view, setView] = useState<'list' | 'timeline'>('list');
  const collections = useCollections();

  const day = useEntries({ logKind: 'weekly', date: selected });
  const byDay = useMemo(() => ({ [selected]: day.entries }), [selected, day.entries]);

  const open = day.entries.filter((e) => e.status === 'open').length;
  const done = day.entries.filter((e) => e.status === 'done').length;

  const weekRange = useMemo(() => {
    const start = toISODate(startOfWeek(fromISODate(selected)));
    const end = toISODate(addDays(fromISODate(start), 6));
    return { start, end };
  }, [selected]);

  const canGoBack = isDateInRange(toISODate(addDays(fromISODate(selected), -1)));
  const canGoForward = isDateInRange(toISODate(addDays(fromISODate(selected), 1)));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.daily.eyebrow}</div>
          <h1 className="page-title">{formatDayLong(selected, t.dates.months, t.dates.days)}</h1>
          <p className="page-sub">{day.entries.length === 0 ? t.daily.captureEmpty : t.daily.openDone(open, done)}</p>
        </div>

        <div className="head-actions">
          <div className="view-toggle" role="group" aria-label="View">
            <button
              type="button"
              className={view === 'list' ? 'on' : ''}
              onClick={() => setView('list')}
              title={t.weekly.viewList}
            >
              <ListTodo size={14} strokeWidth={1.8} />
              <span>{t.weekly.viewList}</span>
            </button>
            <button
              type="button"
              className={view === 'timeline' ? 'on' : ''}
              onClick={() => setView('timeline')}
              title={t.weekly.viewTimeline}
            >
              <CalendarClock size={14} strokeWidth={1.8} />
              <span>{t.weekly.viewTimeline}</span>
            </button>
          </div>
          <button
            className="btn btn-icon"
            onClick={() => setSelected(toISODate(addDays(fromISODate(selected), -1)))}
            disabled={!canGoBack}
            title={canGoBack ? t.daily.previousDay : t.common.navLimit}
          >
            ‹
          </button>
          <DatePicker value={selected} onSelect={setSelected} />
          <button className="btn btn-sm" onClick={() => setSelected(todayISO())}>
            {t.common.today}
          </button>
          <button
            className="btn btn-icon"
            onClick={() => setSelected(toISODate(addDays(fromISODate(selected), 1)))}
            disabled={!canGoForward}
            title={canGoForward ? t.daily.nextDay : t.common.navLimit}
          >
            ›
          </button>
        </div>
      </header>

      <div className="daily-belongs">
        <Link href={`/weekly?date=${selected}`} className="pill pill-link">
          {t.daily.belongsToWeek(formatRange(weekRange.start, weekRange.end, t.dates.months))}
        </Link>
        <Link href={`/monthly?month=${selected.slice(0, 7)}`} className="pill pill-link">
          {t.daily.belongsToMonth(formatMonth(selected.slice(0, 7), t.dates.months))}
        </Link>
      </div>

      {day.loading ? (
        <div className="skeleton" style={{ height: 220 }} />
      ) : view === 'timeline' ? (
        <WeekTimeline days={[selected]} byDay={byDay} onAdd={day.add} onUpdate={day.update} onDelete={day.remove} />
      ) : (
        <section className="card">
          <div style={{ padding: '10px 12px 16px' }}>
            <EntryList
              entries={day.entries}
              collections={collections}
              context={{ logKind: 'weekly', date: selected }}
              onAdd={day.add}
              onToggle={day.toggle}
              onUpdate={day.update}
              onDelete={day.remove}
              onMigrate={day.migrate}
              onReorder={day.reorder}
            />
          </div>
        </section>
      )}
      <ErrorToast message={day.error} onDismiss={() => day.setError(null)} />
    </div>
  );
}
