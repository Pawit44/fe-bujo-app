'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Bell, Plus } from 'lucide-react';
import EventEditor, { type EventDraft } from './EventEditor';
import { useI18n } from '@/lib/i18n';
import { formatDayLong, isToday } from '@/lib/date';
import {
  TIMELINE_HEIGHT,
  TIMELINE_HOURS,
  TIMELINE_START_HOUR,
  minuteToY,
  minutesToTime,
  timeToMinutes,
  yToMinute,
} from '@/lib/timeline';
import type { Entry, EntryDraft } from '@/lib/types';

interface DragState {
  dayIndex: number;
  startMin: number;
  curMin: number;
}

interface EditorState {
  mode: 'create' | 'edit';
  date: string;
  entry?: Entry;
  initial: EventDraft;
}

/** Google/Apple-calendar-style week grid: one hour-ruled column per day,
 * drag (or tap) a range to create a timed entry, click a block to edit it.
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
  const [drag, setDrag] = useState<DragState | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [now, setNow] = useState(() => new Date());
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowMinute = now.getHours() * 60 + now.getMinutes();

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

  const pointerDown = (dayIndex: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    const col = colRefs.current[dayIndex];
    if (!col) return;
    col.setPointerCapture(e.pointerId);
    const rect = col.getBoundingClientRect();
    const min = yToMinute(e.clientY - rect.top);
    setDrag({ dayIndex, startMin: min, curMin: min });
  };

  const pointerMove = (dayIndex: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || drag.dayIndex !== dayIndex) return;
    const col = colRefs.current[dayIndex];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const min = yToMinute(e.clientY - rect.top);
    setDrag((d) => (d ? { ...d, curMin: min } : d));
  };

  const pointerUp = (dayIndex: number) => () => {
    if (!drag || drag.dayIndex !== dayIndex) return;
    let startMin = Math.min(drag.startMin, drag.curMin);
    let endMin = Math.max(drag.startMin, drag.curMin);
    if (endMin - startMin < 15) endMin = startMin + 60;
    setDrag(null);
    openCreate(days[dayIndex], minutesToTime(startMin), minutesToTime(endMin));
  };

  return (
    <div className="timeline-wrap">
      <div className="timeline-header-row">
        <div className="timeline-corner" />
        {days.map((iso) => (
          <div key={iso} className={`timeline-header-cell ${isToday(iso) ? 'is-today' : ''}`}>
            <div className="timeline-day-name">{formatDayLong(iso, t.dates.months, t.dates.days).split(' ')[0]}</div>
            <div className="timeline-day-num">{iso.slice(8)}</div>
          </div>
        ))}
      </div>

      <div className="timeline-alldays-row">
        <div className="timeline-corner-label">{t.timeline.allDay}</div>
        {days.map((iso, i) => {
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

        {days.map((iso, dayIndex) => {
          const info = layout.get(iso);
          const timed = info?.timed ?? [];
          const lanes = info?.lanes ?? 1;
          const isDragging = drag?.dayIndex === dayIndex;
          const dragTop = isDragging ? minuteToY(Math.min(drag!.startMin, drag!.curMin)) : 0;
          const dragHeight = isDragging
            ? Math.max(minuteToY(Math.max(drag!.startMin, drag!.curMin)) - dragTop, 14)
            : 0;

          return (
            <div
              key={iso}
              ref={(el) => {
                colRefs.current[dayIndex] = el;
              }}
              className={`timeline-col ${isToday(iso) ? 'is-today' : ''}`}
              style={{ height: TIMELINE_HEIGHT }}
              onPointerDown={pointerDown(dayIndex)}
              onPointerMove={pointerMove(dayIndex)}
              onPointerUp={pointerUp(dayIndex)}
              onPointerCancel={() => setDrag(null)}
            >
              {TIMELINE_HOURS.map((h) => (
                <div key={h} className="timeline-hour-line" style={{ top: minuteToY(h * 60) }} />
              ))}

              {isToday(iso) && nowMinute >= TIMELINE_START_HOUR * 60 && (
                <div className="timeline-now-line" style={{ top: minuteToY(nowMinute) }} />
              )}

              {isDragging && (
                <div className="timeline-block timeline-block-draft" style={{ top: dragTop, height: dragHeight }} />
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
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(iso, entry);
                    }}
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
