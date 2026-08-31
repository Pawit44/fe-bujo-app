'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import { addMonths, currentMonthISO, formatMonth, isMonthInRange } from '@/lib/date';
import { useCollections } from '@/lib/useCollections';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';

const SPAN = 12; // months shown at once

/** `?month=YYYY-MM` deep-links here (from the Index page's recent-activity
 * and "months ahead" lists) straight to the month that holds a given entry —
 * a plain `/future` would default to the current month and leave anything
 * further out effectively unfindable without paging forward by hand. */
function initialStart(param: string | null): string {
  if (param && /^\d{4}-\d{2}$/.test(param) && isMonthInRange(param)) return param;
  return currentMonthISO();
}

// useSearchParams needs a Suspense boundary, otherwise the whole route opts
// out of static prerendering.
export default function FutureLogPage() {
  return (
    <Suspense>
      <FutureLog />
    </Suspense>
  );
}

function FutureLog() {
  const { t } = useI18n();
  const monthParam = useSearchParams().get('month');
  const [start, setStart] = useState(() => initialStart(monthParam));
  const collections = useCollections();
  const journal = useEntries({ logKind: 'future' });

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
  // A step back is blocked once the new window's *earliest* month would fall
  // outside ±10 years; a step forward, once its *latest* month would. Only
  // the far edge of the new window needs checking — if that edge is still
  // in range, everything between it and today is too.
  const canGoBack = isMonthInRange(addMonths(start, -SPAN));
  const canGoForward = isMonthInRange(addMonths(start, SPAN + SPAN - 1));

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
            disabled={!canGoBack}
            title={canGoBack ? t.future.previousYear : t.common.navLimit}
          >
            ‹
          </button>
          <button className="btn btn-sm" onClick={() => setStart(currentMonthISO())}>
            {t.common.today}
          </button>
          <button
            className="btn btn-icon"
            onClick={() => setStart(addMonths(start, SPAN))}
            disabled={!canGoForward}
            title={canGoForward ? t.future.nextYear : t.common.navLimit}
          >
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
