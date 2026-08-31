'use client';

import { useEffect, useRef, useState } from 'react';
import { MoveRight } from 'lucide-react';
import { addMonths, currentMonthISO, formatMonth, todayISO, addDays, toISODate } from '@/lib/date';
import { useI18n } from '@/lib/i18n';
import { CollectionIcon } from './icons';
import type { Collection, Entry, MigrateTarget } from '@/lib/types';

/** True when target is exactly where entry already lives — migrating there
 * again would just create a duplicate sitting next to itself. */
function isCurrentLocation(entry: Entry, target: MigrateTarget): boolean {
  if (entry.logKind !== target.logKind) return false;
  switch (target.logKind) {
    case 'weekly':
      return entry.date === target.date;
    case 'monthly':
    case 'future':
      return entry.month === target.month;
    case 'collection':
      return entry.collectionId === (target.collectionId ?? null);
    default:
      return false;
  }
}

/**
 * The migration menu: the "»" affordance on every entry. Choosing a target
 * marks the original as migrated / scheduled and re-creates it elsewhere —
 * for real, once: an entry already sitting somewhere can't be sent there
 * again, and an already-migrated/scheduled entry (it already points at
 * where it went) can't be migrated a second time.
 */
export default function MigrateMenu({
  entry,
  collections,
  onMigrate,
}: {
  entry: Entry;
  collections: Collection[];
  onMigrate: (target: MigrateTarget) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const alreadyMoved = entry.status === 'migrated' || entry.status === 'scheduled';

  const pick = (target: MigrateTarget) => {
    if (isCurrentLocation(entry, target)) return;
    setOpen(false);
    onMigrate(target);
  };

  const month = currentMonthISO();
  const tomorrow = toISODate(addDays(new Date(), 1));

  const targets = {
    today: { logKind: 'weekly', date: todayISO() } as MigrateTarget,
    tomorrow: { logKind: 'weekly', date: tomorrow } as MigrateTarget,
    thisMonth: { logKind: 'monthly', month } as MigrateTarget,
    nextMonth: { logKind: 'monthly', month: addMonths(month, 1) } as MigrateTarget,
  };

  if (alreadyMoved) {
    return (
      <button type="button" className="act" title={t.migrate.alreadyMovedTitle} disabled>
        <MoveRight size={14} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        type="button"
        className="act"
        onClick={() => setOpen((v) => !v)}
        title={t.entry.migrateThis}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoveRight size={14} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu-label">{t.migrate.moveTo}</div>
          <button
            className="menu-item"
            onClick={() => pick(targets.today)}
            disabled={isCurrentLocation(entry, targets.today)}
          >
            <span>›</span> {t.migrate.today}
          </button>
          <button
            className="menu-item"
            onClick={() => pick(targets.tomorrow)}
            disabled={isCurrentLocation(entry, targets.tomorrow)}
          >
            <span>›</span> {t.migrate.tomorrow}
          </button>
          <button
            className="menu-item"
            onClick={() => pick(targets.thisMonth)}
            disabled={isCurrentLocation(entry, targets.thisMonth)}
          >
            <span>›</span> {t.migrate.thisMonth}
          </button>
          <button
            className="menu-item"
            onClick={() => pick(targets.nextMonth)}
            disabled={isCurrentLocation(entry, targets.nextMonth)}
          >
            <span>›</span> {formatMonth(addMonths(month, 1), t.dates.months)}
          </button>

          <div className="menu-sep" />
          <div className="menu-label">{t.migrate.futureLog}</div>
          {[2, 3, 4].map((offset) => {
            const targetMonth = addMonths(month, offset);
            const target: MigrateTarget = { logKind: 'future', month: targetMonth };
            return (
              <button
                key={targetMonth}
                className="menu-item"
                onClick={() => pick(target)}
                disabled={isCurrentLocation(entry, target)}
              >
                <span>«</span> {formatMonth(targetMonth, t.dates.months)}
              </button>
            );
          })}

          {collections.length > 0 && (
            <>
              <div className="menu-sep" />
              <div className="menu-label">{t.migrate.collections}</div>
              {collections.slice(0, 6).map((col) => {
                const target: MigrateTarget = { logKind: 'collection', collectionId: col.id };
                return (
                  <button
                    key={col.id}
                    className="menu-item"
                    onClick={() => pick(target)}
                    disabled={isCurrentLocation(entry, target)}
                  >
                    <CollectionIcon icon={col.icon} size={14} /> {col.title}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
