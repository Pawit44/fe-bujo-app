'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { addMonths, fromISODate, isMonthInRange, isToday, isWeekend, monthGrid, toISOMonth } from '@/lib/date';
import { useI18n } from '@/lib/i18n';

/**
 * A calendar popover that jumps straight to any date in one click — the
 * counterpart to the ‹ › day steppers, which only move one day at a time.
 * Reuses the same `.cal` grid the Monthly log already renders, and the same
 * click-outside/Escape popover shell `MigrateMenu` uses, so this adds no new
 * interaction pattern to the app.
 */
export default function DatePicker({ value, onSelect }: { value: string; onSelect: (iso: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => toISOMonth(fromISODate(value)));
  const ref = useRef<HTMLDivElement>(null);

  // Reopening (or the selected date changing from outside, e.g. the ‹ ›
  // steppers) re-anchors the grid to the month the current date is in.
  useEffect(() => {
    if (open) setViewMonth(toISOMonth(fromISODate(value)));
  }, [open, value]);

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

  const { blanks, days } = monthGrid(viewMonth);

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        type="button"
        className="btn btn-icon"
        onClick={() => setOpen((v) => !v)}
        title={t.daily.pickerTitle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={15} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="menu datepicker-menu" role="dialog" aria-label={t.daily.pickerTitle}>
          <div className="datepicker-nav">
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              disabled={!isMonthInRange(addMonths(viewMonth, -1))}
            >
              ‹
            </button>
            <span className="datepicker-month">{t.dates.months[Number(viewMonth.slice(5, 7)) - 1]} {viewMonth.slice(0, 4)}</span>
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              disabled={!isMonthInRange(addMonths(viewMonth, 1))}
            >
              ›
            </button>
          </div>
          <div className="cal-weekdays">
            {t.dates.days.map((d) => (
              <div key={d}>{d.slice(0, 3)}</div>
            ))}
          </div>
          <div className="cal-days">
            {Array.from({ length: blanks }, (_, i) => (
              <div key={`b${i}`} className="cal-day blank" />
            ))}
            {days.map((iso) => (
              <button
                key={iso}
                type="button"
                className={[
                  'cal-day',
                  isToday(iso) ? 'today' : '',
                  value === iso ? 'selected' : '',
                  isWeekend(iso) ? 'weekend' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  onSelect(iso);
                  setOpen(false);
                }}
              >
                {Number(iso.slice(-2))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
