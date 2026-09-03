'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';
import { EVENT_COLORS } from '@/lib/eventColors';
import { useI18n } from '@/lib/i18n';
import type { Entry } from '@/lib/types';

/**
 * Tags a plain task/note with one of the same 9 colors timed events already
 * use — a category-style marker any entry can carry, not just ones with a
 * time. Deliberately its own small popover rather than routing through
 * EventEditor: that flow always saves a start/end time along with the
 * color, which would quietly turn "just tag this task" into "also give it
 * a time slot."
 */
export default function ColorMenu({ entry, onPick }: { entry: Entry; onPick: (color: string) => void }) {
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

  const pick = (color: string) => {
    onPick(color);
    setOpen(false);
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        type="button"
        className="act"
        style={entry.color ? { color: `var(--ev-${entry.color}-solid)` } : undefined}
        onClick={() => setOpen((v) => !v)}
        title={t.eventEditor.colorLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Palette size={14} strokeWidth={1.8} fill={entry.color ? 'currentColor' : 'none'} />
      </button>

      {open && (
        <div className="menu color-menu" role="menu">
          <div className="color-picker">
            <button
              type="button"
              className={`color-swatch swatch-none ${!entry.color ? 'on' : ''}`}
              title={t.eventEditor.colors.none}
              onClick={() => pick('')}
            />
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ev-color-${c} ${entry.color === c ? 'on' : ''}`}
                title={t.eventEditor.colors[c]}
                onClick={() => pick(c)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
