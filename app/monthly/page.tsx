'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import {
  addMonths,
  currentMonthISO,
  formatDayLong,
  formatMonth,
  isMonthInRange,
  isToday,
  isWeekend,
  monthGrid,
  todayISO,
} from '@/lib/date';
import { useCollections } from '@/lib/useCollections';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** `?month=YYYY-MM` or `?date=YYYY-MM-DD` deep-links here from the Index
 * page — without it, a task added a few months out was unreachable from a
 * click: the page always opened on the current month, and there was no way
 * to jump straight to where the entry actually lives. */
function initialView(params: URLSearchParams): { month: string; selected: string } {
  const dateParam = params.get('date');
  if (dateParam && DATE_RE.test(dateParam) && isMonthInRange(dateParam.slice(0, 7))) {
    return { month: dateParam.slice(0, 7), selected: dateParam };
  }
  const monthParam = params.get('month');
  if (monthParam && MONTH_RE.test(monthParam) && isMonthInRange(monthParam)) {
    return { month: monthParam, selected: `${monthParam}-01` };
  }
  return { month: currentMonthISO(), selected: todayISO() };
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
  const [{ month: initialMonth, selected: initialSelected }] = useState(() => initialView(searchParams));
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string>(initialSelected);
  const collections = useCollections();

  const { blanks, days } = useMemo(() => monthGrid(month), [month]);
  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];

  const monthly = useEntries({ logKind: 'monthly', month });
  const daily = useEntries({ logKind: 'weekly', from: rangeStart, to: rangeEnd });

  // Keep the selected day inside the month being viewed.
  useEffect(() => {
    if (!selected.startsWith(month)) setSelected(days[0]);
  }, [month, selected, days]);

  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of daily.entries) {
      if (e.status === 'done' || e.status === 'cancelled') continue;
      map[e.date] = (map[e.date] ?? 0) + 1;
    }
    return map;
  }, [daily.entries]);

  const selectedEntries = daily.entries.filter((e) => e.date === selected);
  const open = monthly.entries.filter((e) => e.status === 'open').length;

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section className="card cal">
            <div className="cal-weekdays">
              {t.dates.days.map((d) => (
                <div key={d}>{d.slice(0, 3)}</div>
              ))}
            </div>
            <div className="cal-days">
              {Array.from({ length: blanks }, (_, i) => (
                <div key={`b${i}`} className="cal-day blank" />
              ))}
              {days.map((iso) => {
                const n = countByDay[iso] ?? 0;
                const day = Number(iso.slice(-2));
                return (
                  <button
                    key={iso}
                    type="button"
                    className={[
                      'cal-day',
                      isToday(iso) ? 'today' : '',
                      selected === iso ? 'selected' : '',
                      isWeekend(iso) ? 'weekend' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelected(iso)}
                    title={`${formatDayLong(iso, t.dates.months, t.dates.days)} — ${n} ${t.common.open}`}
                  >
                    {day}
                    <span className="cal-dots">
                      {Array.from({ length: Math.min(n, 3) }, (_, i) => (
                        <i key={i} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">{formatDayLong(selected, t.dates.months, t.dates.days)}</h2>
              {isToday(selected) && <span className="pill">{t.common.today.toLowerCase()}</span>}
            </div>
            <div style={{ padding: '10px 12px 14px' }}>
              <EntryList
                entries={selectedEntries}
                collections={collections}
                context={{ logKind: 'weekly', date: selected }}
                onAdd={daily.add}
                onToggle={daily.toggle}
                onUpdate={daily.update}
                onDelete={daily.remove}
                onMigrate={daily.migrate}
                onReorder={daily.reorder}
              />
            </div>
          </section>
        </div>

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
