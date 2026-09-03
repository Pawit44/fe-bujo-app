'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import {
  addDays,
  addMonths,
  currentMonthISO,
  formatDayLong,
  formatMonth,
  formatRange,
  fromISODate,
  isMonthInRange,
  isToday,
  isWeekend,
  monthGrid,
  startOfWeek,
  toISODate,
} from '@/lib/date';
import { useCollections } from '@/lib/useCollections';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';
import type { Entry } from '@/lib/types';

/** How many task tags a day cell shows before collapsing the rest into
 * "+N more" — enough to be useful at a glance, not enough to crowd the cell. */
const MAX_TAGS_PER_DAY = 2;

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `?month=YYYY-MM` or `?date=YYYY-MM-DD` deep-links here from the Index
 * page — without it, a task added a few months out was unreachable from a
 * click: the page always opened on the current month, and there was no way
 * to jump straight to where the entry actually lives. */
function initialMonth(params: URLSearchParams): string {
  const dateParam = params.get('date');
  if (dateParam && DATE_RE.test(dateParam) && isMonthInRange(dateParam.slice(0, 7))) return dateParam.slice(0, 7);
  const monthParam = params.get('month');
  if (monthParam && MONTH_RE.test(monthParam) && isMonthInRange(monthParam)) return monthParam;
  return currentMonthISO();
}

// useSearchParams needs a Suspense boundary, otherwise the whole route opts
// out of static prerendering.
export default function MonthlyLogPage() {
  return (
    <Suspense>
      <MonthlyLog />
    </Suspense>
  );
}

function MonthlyLog() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(() => initialMonth(searchParams));
  // Day mode: a cell is one day, click opens that day's Daily log. Week
  // mode: a cell's whole calendar row is one unit — hovering any day in it
  // (blank lead/trail cells included) highlights the row, and clicking
  // anywhere in it opens that week's Weekly log. Either way, managing the
  // entries themselves happens on the page it links to, not here.
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const collections = useCollections();

  const { blanks, days } = useMemo(() => monthGrid(month), [month]);
  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];
  const weekStartOfMonth = useMemo(() => startOfWeek(fromISODate(`${month}-01`)), [month]);
  // One flat cell list, blanks first — a cell's index in it divided by 7 is
  // always its calendar row, whether that cell is a real day or a blank.
  const cells = useMemo<(string | null)[]>(
    () => [...Array.from({ length: blanks }, () => null), ...days],
    [blanks, days],
  );

  const monthly = useEntries({ logKind: 'monthly', month });
  const daily = useEntries({ logKind: 'weekly', from: rangeStart, to: rangeEnd });

  // Grouped (not just counted) so each cell can show what the day's tasks
  // actually are, not just how many — done/cancelled stay out of the tag
  // list the same way they used to stay out of the count.
  const entriesByDay = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    for (const e of daily.entries) {
      if (e.status === 'done' || e.status === 'cancelled') continue;
      (map[e.date] ??= []).push(e);
    }
    return map;
  }, [daily.entries]);

  const open = monthly.entries.filter((e) => e.status === 'open').length;

  const weekHrefForRow = (row: number) => `/weekly?date=${toISODate(addDays(weekStartOfMonth, row * 7))}`;
  const weekRangeForRow = (row: number) => {
    const start = toISODate(addDays(weekStartOfMonth, row * 7));
    const end = toISODate(addDays(weekStartOfMonth, row * 7 + 6));
    return formatRange(start, end, t.dates.months);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.monthly.eyebrow}</div>
          <h1 className="page-title">{formatMonth(month, t.dates.months)}</h1>
          <p className="page-sub">
            {monthly.entries.length === 0 ? t.monthly.glance : t.monthly.openOfTotal(open, monthly.entries.length)}
          </p>
        </div>

        <div className="head-actions">
          <div className="view-toggle" role="group" aria-label="View">
            <button type="button" className={mode === 'day' ? 'on' : ''} onClick={() => setMode('day')}>
              {t.monthly.viewByDay}
            </button>
            <button type="button" className={mode === 'week' ? 'on' : ''} onClick={() => setMode('week')}>
              {t.monthly.viewByWeek}
            </button>
          </div>
          <button
            className="btn btn-icon"
            onClick={() => setMonth(addMonths(month, -1))}
            disabled={!isMonthInRange(addMonths(month, -1))}
            title={isMonthInRange(addMonths(month, -1)) ? t.monthly.previousMonth : t.common.navLimit}
          >
            ‹
          </button>
          <button className="btn btn-sm" onClick={() => setMonth(currentMonthISO())}>
            {t.monthly.thisMonth}
          </button>
          <button
            className="btn btn-icon"
            onClick={() => setMonth(addMonths(month, 1))}
            disabled={!isMonthInRange(addMonths(month, 1))}
            title={isMonthInRange(addMonths(month, 1)) ? t.monthly.nextMonth : t.common.navLimit}
          >
            ›
          </button>
        </div>
      </header>

      <div className="monthly-layout">
        <section className="card cal">
          <div className="cal-weekdays">
            {t.dates.days.map((d) => (
              <div key={d}>{d.slice(0, 3)}</div>
            ))}
          </div>
          <div key={month} className="cal-days" onMouseLeave={() => setHoverRow(null)}>
            {cells.map((iso, i) => {
              const row = Math.floor(i / 7);
              const weekHover = mode === 'week' && hoverRow === row;

              if (iso === null) {
                if (mode === 'day') return <div key={`b${i}`} className="cal-day blank" />;
                return (
                  <Link
                    key={`b${i}`}
                    href={weekHrefForRow(row)}
                    className={`cal-day ${weekHover ? 'week-hover' : ''}`}
                    onMouseEnter={() => setHoverRow(row)}
                    onFocus={() => setHoverRow(row)}
                    onBlur={() => setHoverRow(null)}
                    title={weekRangeForRow(row)}
                  />
                );
              }

              const dayEntries = entriesByDay[iso] ?? [];
              const tags = dayEntries.slice(0, MAX_TAGS_PER_DAY);
              const extra = dayEntries.length - tags.length;
              const day = Number(iso.slice(-2));
              const classes = [
                'cal-day',
                isToday(iso) ? 'today' : '',
                isWeekend(iso) ? 'weekend' : '',
                weekHover ? 'week-hover' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <Link
                  key={iso}
                  href={mode === 'day' ? `/daily?date=${iso}` : weekHrefForRow(row)}
                  className={classes}
                  onMouseEnter={() => mode === 'week' && setHoverRow(row)}
                  onFocus={() => mode === 'week' && setHoverRow(row)}
                  onBlur={() => mode === 'week' && setHoverRow(null)}
                  title={
                    mode === 'day'
                      ? `${formatDayLong(iso, t.dates.months, t.dates.days)} — ${dayEntries.length} ${t.common.open}`
                      : weekRangeForRow(row)
                  }
                >
                  <span className="cal-day-num">{day}</span>
                  {tags.length > 0 && (
                    <span className="cal-tags">
                      {tags.map((entry) => (
                        <span key={entry.id} className={`cal-tag ${entry.color ? `ev-color-${entry.color}` : ''}`}>
                          {entry.content}
                        </span>
                      ))}
                      {extra > 0 && <span className="cal-tag-more">{t.common.moreCount(extra)}</span>}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2 className="card-title">{t.monthly.tasksThisMonth}</h2>
            <span className="pill">
              {open} {t.common.open}
            </span>
          </div>
          <div style={{ padding: '10px 12px 16px' }}>
            <EntryList
              entries={monthly.entries}
              collections={collections}
              context={{ logKind: 'monthly', month }}
              onAdd={monthly.add}
              onToggle={monthly.toggle}
              onUpdate={monthly.update}
              onDelete={monthly.remove}
              onMigrate={monthly.migrate}
              onReorder={monthly.reorder}
            />
          </div>
        </section>
      </div>
      <ErrorToast
        message={monthly.error ?? daily.error}
        onDismiss={() => {
          monthly.setError(null);
          daily.setError(null);
        }}
      />
    </div>
  );
}
