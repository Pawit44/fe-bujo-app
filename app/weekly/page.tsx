'use client';

import { useEffect, useMemo, useState } from 'react';
import EntryList from '@/components/EntryList';
import ErrorToast from '@/components/ErrorToast';
import { api } from '@/lib/api';
import { addDays, formatRange, fromISODate, isToday, isWeekend, startOfWeek, toISODate, weekDays } from '@/lib/date';
import { useEntries } from '@/lib/useEntries';
import { useI18n } from '@/lib/i18n';
import type { Collection } from '@/lib/types';

export default function WeeklyLogPage() {
  const { t } = useI18n();
  const [anchor, setAnchor] = useState(() => toISODate(startOfWeek(new Date())));
  const [collections, setCollections] = useState<Collection[]>([]);

  const days = useMemo(() => weekDays(fromISODate(anchor)), [anchor]);
  const journal = useEntries({ logKind: 'weekly', from: days[0], to: days[6] });

  useEffect(() => {
    api.collections().then(setCollections).catch(() => undefined);
  }, []);

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
          <button className="btn btn-icon" onClick={() => shift(-1)} title={t.weekly.previousWeek}>
            ‹
          </button>
          <button className="btn btn-sm" onClick={() => setAnchor(toISODate(startOfWeek(new Date())))}>
            {t.weekly.thisWeek}
          </button>
          <button className="btn btn-icon" onClick={() => shift(1)} title={t.weekly.nextWeek}>
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
      ) : (
        <div className="week-grid">
          {days.map((iso, i) => (
            <section
              key={iso}
              className={`day-panel ${isToday(iso) ? 'is-today' : ''} ${isWeekend(iso) ? 'is-weekend' : ''}`}
            >
              <div className="day-panel-head">
                <h2 className="day-name">{t.dates.days[i]}</h2>
                <span className="day-num">{iso.slice(8)}</span>
              </div>
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
