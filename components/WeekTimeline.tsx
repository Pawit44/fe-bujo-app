'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import EventEditor, { type EventDraft } from './EventEditor';
import { useI18n } from '@/lib/i18n';
import { formatDayLong, isToday } from '@/lib/date';
import { useMediaQuery } from '@/lib/useMediaQuery';
import {
  TIMELINE_END_HOUR,
  TIMELINE_HEIGHT,
  TIMELINE_HOURS,
  TIMELINE_START_HOUR,
  minuteToY,
  minutesToTime,
  timeToMinutes,
} from '@/lib/timeline';
import type { Entry, EntryDraft } from '@/lib/types';

interface EditorState {
  mode: 'create' | 'edit';
  date: string;
  entry?: Entry;
  initial: EventDraft;
}

/** Google/Apple-calendar-style week grid: one hour-ruled column per day.
 * Tapping any hour opens the editor pre-filled with that hour — no
 * drag-to-select, which is fiddly on a small grid and worse on touch. The
 * editor's own start/end time fields (plus duration chips) are how the time
 * gets refined, so one clean tap always beats needing a precise drag.
 * Untimed entries surface as a small chip row above the grid instead of
 * disappearing — tapping one is the fastest way to give it a time. */
export default function WeekTimeline({
  days,
  byDay,
  onAdd,
  onUpdate,
  onDelete,
}: {
  days: string[];
  byDay: Record<string, Entry[]>;
  onAdd: (draft: EntryDraft) => void;
  onUpdate: (entry: Entry, patch: Partial<Entry>) => void;
  onDelete: (entry: Entry) => void;
}) {
  const { t } = useI18n();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [now, setNow] = useState(() => new Date());
  const isNarrow = useMediaQuery('(max-width: 700px)');
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, days.findIndex((d) => isToday(d))));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // The week itself changed (prev/next-week nav) — re-anchor the mobile
  // single-day view to today-if-visible, otherwise the first day of it.
  useEffect(() => {
    setDayIndex(Math.max(0, days.findIndex((d) => isToday(d))));
  }, [days]);

  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const visibleDays = isNarrow ? [days[dayIndex]] : days;

  const layout = useMemo(() => {
    const map = new Map<string, { timed: Entry[]; untimed: Entry[]; lane: Map<number, number>; lanes: number }>();
    for (const day of days) {
      const entries = byDay[day] ?? [];
      const timed = entries.filter((e) => e.startTime).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      const untimed = entries.filter((e) => !e.startTime);
      const laneEnd: number[] = [];
      const lane = new Map<number, number>();
      for (const e of timed) {
        const s = timeToMinutes(e.startTime);
        const endM = e.endTime ? timeToMinutes(e.endTime) : s + 30;
        let placed = false;
        for (let i = 0; i < laneEnd.length; i++) {
          if (laneEnd[i] <= s) {
            lane.set(e.id, i);
            laneEnd[i] = endM;
            placed = true;
            break;
          }
        }
        if (!placed) {
          lane.set(e.id, laneEnd.length);
          laneEnd.push(endM);
        }
      }
      map.set(day, { timed, untimed, lane, lanes: Math.max(1, laneEnd.length) });
    }
    return map;
  }, [days, byDay]);

  const openCreate = (date: string, startTime: string, endTime: string) => {
    setEditor({
      mode: 'create',
      date,
      initial: { content: '', startTime, endTime, color: '', reminderMinutes: null },
    });
  };

  const openEdit = (date: string, entry: Entry) => {
    setEditor({
      mode: 'edit',
      date,
      entry,
      initial: {
        content: entry.content,
        startTime: entry.startTime || '09:00',
        endTime: entry.endTime || '10:00',
        color: entry.color,
        reminderMinutes: entry.reminderMinutes,
      },
    });
  };

  const closeEditor = () => setEditor(null);

  const saveEditor = (draft: EventDraft) => {
    if (!editor) return;
    if (editor.mode === 'create') {
      onAdd({
        logKind: 'weekly',
        date: editor.date,
        content: draft.content,
        type: 'event',
        startTime: draft.startTime,
        endTime: draft.endTime,
        color: draft.color,
        reminderMinutes: draft.reminderMinutes,
      });
    } else if (editor.entry) {
      onUpdate(editor.entry, {
        content: draft.content,
        startTime: draft.startTime,
        endTime: draft.endTime,
        color: draft.color,
        reminderMinutes: draft.reminderMinutes,
      });
    }
    closeEditor();
  };

  const deleteEditor = () => {
    if (editor?.entry) onDelete(editor.entry);
    closeEditor();
  };

  const clearEditorTime = () => {
    if (editor?.entry) onUpdate(editor.entry, { startTime: '', endTime: '', color: '', reminderMinutes: null });
    closeEditor();
  };

  return (
    <div className={`timeline-wrap ${isNarrow ? 'is-single-day' : ''}`}>
      {isNarrow && (
        <div className="timeline-day-switcher">
          <button
            type="button"
            className="btn btn-icon"
            disabled={dayIndex <= 0}
            onClick={() => setDayIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <div className="timeline-day-switcher-label">
            {formatDayLong(days[dayIndex], t.dates.months, t.dates.days)}
            {isToday(days[dayIndex]) && <span className="timeline-day-switcher-today">{t.common.today}</span>}
          </div>
          <button
            type="button"
            className="btn btn-icon"
            disabled={dayIndex >= days.length - 1}
            onClick={() => setDayIndex((i) => Math.min(days.length - 1, i + 1))}
          >
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>
      )}

      <div className="timeline-header-row">
        <div className="timeline-corner" />
        {visibleDays.map((iso) => (
          <div key={iso} className={`timeline-header-cell ${isToday(iso) ? 'is-today' : ''}`}>
            <div className="timeline-day-name">{formatDayLong(iso, t.dates.months, t.dates.days).split(' ')[0]}</div>
            <div className="timeline-day-num">{iso.slice(8)}</div>
          </div>
        ))}
      </div>

      <div className="timeline-alldays-row">
        <div className="timeline-corner-label">{t.timeline.allDay}</div>
        {visibleDays.map((iso) => {
          const untimed = layout.get(iso)?.untimed ?? [];
          return (
            <div key={iso} className="timeline-allday-cell">
              {untimed.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`allday-chip ${entry.color ? `ev-color-${entry.color}` : ''}`}
                  title={entry.content}
                  onClick={() => openEdit(iso, entry)}
                >
                  {entry.content}
                </button>
              ))}
              <button
                type="button"
                className="allday-add"
                title={t.eventEditor.addTitle}
                onClick={() => openCreate(iso, '09:00', '10:00')}
              >
                <Plus size={12} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="timeline-body">
        <div className="timeline-gutter" style={{ height: TIMELINE_HEIGHT }}>
          {TIMELINE_HOURS.map((h) => (
            <div key={h} className="timeline-hour-label" style={{ top: minuteToY(h * 60) }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {visibleDays.map((iso) => {
          const info = layout.get(iso);
          const timed = info?.timed ?? [];
          const lanes = info?.lanes ?? 1;

          return (
            <div key={iso} className={`timeline-col ${isToday(iso) ? 'is-today' : ''}`} style={{ height: TIMELINE_HEIGHT }}>
              {TIMELINE_HOURS.map((h) => {
                const hourEnd = Math.min(h + 1, TIMELINE_END_HOUR);
                return (
                  <button
                    key={h}
                    type="button"
                    className="timeline-slot"
                    style={{ top: minuteToY(h * 60), height: minuteToY(hourEnd * 60) - minuteToY(h * 60) }}
                    title={t.timeline.tapHint}
                    onClick={() => openCreate(iso, minutesToTime(h * 60), minutesToTime(hourEnd * 60))}
                  >
                    <Plus size={13} strokeWidth={2} />
                  </button>
                );
              })}

              {TIMELINE_HOURS.map((h) => (
                <div key={h} className="timeline-hour-line" style={{ top: minuteToY(h * 60) }} />
              ))}

              {isToday(iso) && nowMinute >= TIMELINE_START_HOUR * 60 && (
                <div className="timeline-now-line" style={{ top: minuteToY(nowMinute) }} />
              )}

              {timed.map((entry) => {
                const s = timeToMinutes(entry.startTime);
                const eMin = entry.endTime ? timeToMinutes(entry.endTime) : s + 30;
                const top = minuteToY(s);
                const height = Math.max(minuteToY(eMin) - top, 22);
                const lane = info?.lane.get(entry.id) ?? 0;
                const width = 100 / lanes;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`timeline-block ${entry.color ? `ev-color-${entry.color}` : 'ev-color-default'} ${entry.status === 'done' ? 'is-done' : ''}`}
                    style={{
                      top,
                      height,
                      left: `calc(${lane * width}% + 2px)`,
                      width: `calc(${width}% - 4px)`,
                    }}
                    onClick={() => openEdit(iso, entry)}
                    title={entry.content}
                  >
                    {entry.reminderMinutes !== null && <Bell size={10} strokeWidth={2} className="block-bell" />}
                    <span className="block-time">
                      {entry.startTime}
                      {entry.endTime ? `–${entry.endTime}` : ''}
                    </span>
                    <span className="block-content">{entry.content}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {editor && (
        <EventEditor
          mode={editor.mode}
          initial={editor.initial}
          onSave={saveEditor}
          onDelete={editor.mode === 'edit' ? deleteEditor : undefined}
          onClearTime={editor.mode === 'edit' ? clearEditorTime : undefined}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
