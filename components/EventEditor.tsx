'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '@/lib/i18n';
import { EVENT_COLORS } from '@/lib/eventColors';
import type { Dictionary } from '@/lib/i18n/en';

export interface EventDraft {
  content: string;
  startTime: string;
  endTime: string;
  color: string;
  reminderMinutes: number | null;
}

const REMINDER_OPTIONS = [5, 10, 15, 30, 60, 1440];

function reminderLabel(t: Dictionary, minutes: number): string {
  if (minutes === 0) return t.eventEditor.reminderAt;
  if (minutes === 60) return t.eventEditor.reminderBeforeHour;
  if (minutes === 1440) return t.eventEditor.reminderBeforeDay;
  return t.eventEditor.reminderBefore(minutes);
}

/** Bumps `end` to at least 15 minutes after `start`, wrapping the clock
 * rather than crossing midnight — a timeline block never spans two days. */
function bumpEnd(start: string, minutes: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = Math.min(23 * 60 + 45, h * 60 + m + minutes);
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

/**
 * Create or edit a timed entry's schedule: start/end time, color and
 * reminder, plus what it says. One form for both flows — dragging a new
 * range on the timeline, or clicking the clock action on any existing entry.
 */
export default function EventEditor({
  mode,
  initial,
  onSave,
  onDelete,
  onClearTime,
  onClose,
}: {
  mode: 'create' | 'edit';
  initial: EventDraft;
  onSave: (draft: EventDraft) => void;
  /** Only offered in edit mode: deletes the whole entry. */
  onDelete?: () => void;
  /** Only offered in edit mode, when the entry already has a time: drops it
   * back to a plain untimed bullet instead of deleting it outright. */
  onClearTime?: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [content, setContent] = useState(initial.content);
  const [start, setStart] = useState(initial.startTime || '09:00');
  const [end, setEnd] = useState(initial.endTime || bumpEnd(initial.startTime || '09:00', 60));
  const [color, setColor] = useState(initial.color);
  const [reminder, setReminder] = useState<number | null>(initial.reminderMinutes);
  const [error, setError] = useState('');

  const save = () => {
    if (!content.trim()) {
      setError(t.eventEditor.contentRequired);
      return;
    }
    if (end <= start) {
      setError(t.eventEditor.invalidRange);
      return;
    }
    onSave({ content: content.trim(), startTime: start, endTime: end, color, reminderMinutes: reminder });
  };

  return (
    <Modal onClose={onClose} className="modal-event">
      <h2>{mode === 'create' ? t.eventEditor.addTitle : t.eventEditor.editTitle}</h2>

      <div className="field">
        <label htmlFor="ev-content">{t.eventEditor.contentLabel}</label>
        <input
          id="ev-content"
          value={content}
          autoFocus={mode === 'create'}
          placeholder={t.eventEditor.contentPlaceholder}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="ev-start">{t.eventEditor.startLabel}</label>
          <input
            id="ev-start"
            type="time"
            step={300}
            value={start}
            onChange={(e) => {
              const v = e.target.value;
              setStart(v);
              if (end <= v) setEnd(bumpEnd(v, 60));
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="ev-end">{t.eventEditor.endLabel}</label>
          <input id="ev-end" type="time" step={300} value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <div className="duration-chips">
        {[30, 60, 120].map((mins) => (
          <button key={mins} type="button" className="chip" onClick={() => setEnd(bumpEnd(start, mins))}>
            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
          </button>
        ))}
        {onClearTime && (
          <button type="button" className="chip chip-ghost" onClick={onClearTime}>
            {t.eventEditor.clearTime}
          </button>
        )}
      </div>

      <div className="field">
        <label>{t.eventEditor.colorLabel}</label>
        <div className="color-picker">
          <button
            type="button"
            className={`color-swatch swatch-none ${color === '' ? 'on' : ''}`}
            title={t.eventEditor.colors.none}
            onClick={() => setColor('')}
          />
          {EVENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch ev-color-${c} ${color === c ? 'on' : ''}`}
              title={t.eventEditor.colors[c]}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="ev-reminder">{t.eventEditor.reminderLabel}</label>
        <select
          id="ev-reminder"
          value={reminder === null ? '' : reminder}
          onChange={(e) => setReminder(e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">{t.eventEditor.reminderNone}</option>
          <option value={0}>{t.eventEditor.reminderAt}</option>
          {REMINDER_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {reminderLabel(t, m)}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="modal-actions">
        {mode === 'edit' && onDelete && (
          <button type="button" className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={onDelete}>
            <Trash2 size={14} strokeWidth={1.8} />
            {t.eventEditor.delete}
          </button>
        )}
        <button type="button" className="btn" onClick={onClose}>
          {t.common.cancel}
        </button>
        <button type="button" className="btn btn-primary" onClick={save}>
          {t.eventEditor.save}
        </button>
      </div>
    </Modal>
  );
}
