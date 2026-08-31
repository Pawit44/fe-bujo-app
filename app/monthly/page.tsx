'use client';

import { useEffect, useMemo, useState } from 'react';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import { api } from '@/lib/api';
import {
  addMonths,
  currentMonthISO,
  formatDayLong,
  formatMonth,
  isToday,
  isWeekend,
  monthGrid,
  todayISO,
} from '@/lib/date';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';
import type { Collection } from '@/lib/types';

export default function MonthlyLogPage() {
  const { t } = useI18n();
  const [month, setMonth] = useState(currentMonthISO());
  const [selected, setSelected] = useState<string>(todayISO());
  const [collections, setCollections] = useState<Collection[]>([]);

  const { blanks, days } = useMemo(() => monthGrid(month), [month]);
  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];

  const monthly = useEntries({ logKind: 'monthly', month });
  const daily = useEntries({ logKind: 'weekly', from: rangeStart, to: rangeEnd });

  useEffect(() => {
    api.collections().then(setCollections).catch(() => undefined);
  }, []);

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
            title={t.monthly.previousMonth}
          >
            ‹
          </button>
          <button className="btn btn-sm" onClick={() => setMonth(currentMonthISO())}>
            {t.monthly.thisMonth}
          </button>
          <button className="btn btn-icon" onClick={() => setMonth(addMonths(month, 1))} title={t.monthly.nextMonth}>
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
