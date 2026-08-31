'use client';

import { useEffect, useMemo, useState } from 'react';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import { api } from '@/lib/api';
import { addMonths, currentMonthISO, formatMonth } from '@/lib/date';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';
import type { Collection } from '@/lib/types';

const SPAN = 12; // months shown at once

export default function FutureLogPage() {
  const { t } = useI18n();
  const [start, setStart] = useState(currentMonthISO());
  const [collections, setCollections] = useState<Collection[]>([]);
  const journal = useEntries({ logKind: 'future' });

  useEffect(() => {
    api.collections().then(setCollections).catch(() => undefined);
  }, []);

  const months = useMemo(
    () => Array.from({ length: SPAN }, (_, i) => addMonths(start, i)),
    [start],
  );

  const byMonth = useMemo(() => {
    const map: Record<string, typeof journal.entries> = {};
    for (const m of months) map[m] = [];
    for (const entry of journal.entries) {
      if (map[entry.month]) map[entry.month].push(entry);
    }
    return map;
  }, [journal.entries, months]);

  const planned = months.reduce((n, m) => n + (byMonth[m]?.length ?? 0), 0);
  const now = currentMonthISO();

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t.future.eyebrow}</div>
          <h1 className="page-title">
            {formatMonth(start, t.dates.months)} <span style={{ color: 'var(--ink-faint)' }}>→</span>{' '}
            {formatMonth(addMonths(start, SPAN - 1), t.dates.months)}
          </h1>
          <p className="page-sub">{planned === 0 ? t.future.parkAnything : t.future.waiting(planned)}</p>
        </div>

        <div className="head-actions">
          <button
            className="btn btn-icon"
            onClick={() => setStart(addMonths(start, -SPAN))}
            title={t.future.previousYear}
          >
            ‹
          </button>
          <button className="btn btn-sm" onClick={() => setStart(currentMonthISO())}>
            {t.common.today}
          </button>
          <button className="btn btn-icon" onClick={() => setStart(addMonths(start, SPAN))} title={t.future.nextYear}>
            ›
          </button>
        </div>
      </header>

      {journal.loading ? (
        <div className="future-grid">
          {months.map((m) => (
            <div key={m} className="skeleton" style={{ height: 180 }} />
          ))}
        </div>
      ) : (
        <div className="future-grid">
          {months.map((month) => {
            const [year, mm] = month.split('-').map(Number);
            return (
              <section key={month} className={`month-panel ${month === now ? 'is-current' : ''}`}>
                <div className="month-panel-head">
                  <h2 className="month-panel-name">{t.dates.months[mm - 1]}</h2>
                  <span className="month-panel-year">{year}</span>
                </div>
                <div className="month-panel-body">
                  <EntryList
                    entries={byMonth[month] ?? []}
                    collections={collections}
                    context={{ logKind: 'future', month }}
                    onAdd={journal.add}
                    onToggle={journal.toggle}
                    onUpdate={journal.update}
                    onDelete={journal.remove}
                    onMigrate={journal.migrate}
                    onReorder={journal.reorder}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}
      <ErrorToast message={journal.error} onDismiss={() => journal.setError(null)} />
    </div>
  );
}
