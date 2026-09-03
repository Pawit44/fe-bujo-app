'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import EventEditor, { type EventDraft } from './EventEditor';
import { glyphFor } from './Bullet';
import { useI18n } from '@/lib/i18n';
import { isToday } from '@/lib/date';
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
  entry?: Entry;
  initial: EventDraft;
}

/**
 * A single full-width day, hour by hour — purpose-built rather than the week
 * grid narrowed to one column (that left six empty column-tracks of dead
 * space next to a squeezed-thin day). No day switcher here either: the page
 * around this component already owns day navigation (‹ ›, the date picker,
 * "today"), so repeating it inside would just be a second set of the same
 * controls.
 */
export default function DayTimeline({
  date,
  entries,
  onAdd,
  onUpdate,
  onDelete,
}: {
  date: string;
  entries: Entry[];
  onAdd: (draft: EntryDraft) => void;
  onUpdate: (entry: Entry, patch: Partial<Entry>) => void;
  onDelete: (entry: Entry) => void;
}) {
  const { t } = useI18n();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [now, setNow] = useState(() => new Date());
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Land the scroll near the useful part of the day instead of always
  // starting at the 06:00 top: on today, that's an hour before now; on any
  // other day, mid-morning, which is closer to where a day's plans usually
  // start than the very edge of the grid.
  useEffect(() => {
    const anchorMinute = isToday(date) ? now.getHours() * 60 + now.getMinutes() : 8 * 60;
    const top = Math.max(0, minuteToY(anchorMinute) - 80);
    bodyRef.current?.scrollTo({ top });
    // Only the day changing should re-anchor scroll — not every minute tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const nowMinute = now.getHours() * 60 + now.getMinutes();

  const { timed, untimed, lane, lanes } = useMemo(() => {
    const timedList = entries
      .filter((e) => e.startTime)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const untimedList = entries.filter((e) => !e.startTime);
    const laneEnd: number[] = [];
    const laneOf = new Map<number, number>();
    for (const e of timedList) {
      const s = timeToMinutes(e.startTime);
      const endM = e.endTime ? timeToMinutes(e.endTime) : s + 30;
      let placed = false;
      for (let i = 0; i < laneEnd.length; i++) {
        if (laneEnd[i] <= s) {
          laneOf.set(e.id, i);
          laneEnd[i] = endM;
          placed = true;
          break;
        }
      }
      if (!placed) {
        laneOf.set(e.id, laneEnd.length);
        laneEnd.push(endM);
      }
    }
    return { timed: timedList, untimed: untimedList, lane: laneOf, lanes: Math.max(1, laneEnd.length) };
  }, [entries]);

  const openCreate = (startTime: string, endTime: string) => {
    setEditor({ mode: 'create', initial: { content: '', startTime, endTime, color: '', reminderMinutes: null } });
  };

  const openEdit = (entry: Entry) => {
    setEditor({
      mode: 'edit',
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
        date,
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
    <div className="timeline-wrap day-timeline">
      <div className="day-timeline-allrow">
        <div className="timeline-corner-label">{t.timeline.allDay}</div>
        <div className="day-timeline-allcell">
          {untimed.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`allday-chip ${entry.color ? `ev-color-${entry.color}` : ''}`}
              title={entry.content}
              onClick={() => openEdit(entry)}
            >
              {entry.content}
            </button>
          ))}
          <button
            type="button"
            className="allday-add"
            title={t.eventEditor.addTitle}
            onClick={() => openCreate('09:00', '10:00')}
          >
            <Plus size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="day-timeline-body" ref={bodyRef}>
        <div className="timeline-gutter" style={{ height: TIMELINE_HEIGHT }}>
          {TIMELINE_HOURS.map((h) => (
            <div key={h} className="timeline-hour-label" style={{ top: minuteToY(h * 60) }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        <div className="timeline-col day-timeline-col" style={{ height: TIMELINE_HEIGHT }}>
          {TIMELINE_HOURS.map((h) => {
            const hourEnd = Math.min(h + 1, TIMELINE_END_HOUR);
            return (
              <button
                key={h}
                type="button"
                className="timeline-slot"
                style={{ top: minuteToY(h * 60), height: minuteToY(hourEnd * 60) - minuteToY(h * 60) }}
                title={t.timeline.tapHint}
                onClick={() => openCreate(minutesToTime(h * 60), minutesToTime(hourEnd * 60))}
              >
                <Plus size={14} strokeWidth={2} />
              </button>
            );
          })}

          {TIMELINE_HOURS.map((h) => (
            <div key={h} className="timeline-hour-line" style={{ top: minuteToY(h * 60) }} />
          ))}

          {isToday(date) && nowMinute >= TIMELINE_START_HOUR * 60 && (
            <div className="timeline-now-line" style={{ top: minuteToY(nowMinute) }}>
              <span className="timeline-now-dot" />
            </div>
          )}

          {timed.map((entry) => {
            const s = timeToMinutes(entry.startTime);
            const eMin = entry.endTime ? timeToMinutes(entry.endTime) : s + 30;
            const top = minuteToY(s);
            const height = Math.max(minuteToY(eMin) - top, 26);
            const entryLane = lane.get(entry.id) ?? 0;
            const width = 100 / lanes;
            return (
              <button
                key={entry.id}
                type="button"
                className={`timeline-block ${entry.color ? `ev-color-${entry.color}` : 'ev-color-default'} ${entry.status === 'done' ? 'is-done' : ''}`}
                style={{
                  top,
                  height,
                  left: `calc(${entryLane * width}% + 3px)`,
                  width: `calc(${width}% - 6px)`,
                }}
                onClick={() => openEdit(entry)}
                title={entry.content}
              >
                {entry.reminderMinutes !== null && <Bell size={11} strokeWidth={2} className="block-bell" />}
                <span className="block-time">
                  <span className="block-glyph">{glyphFor(entry.type, entry.status)}</span>
                  {entry.startTime}
                  {entry.endTime ? `–${entry.endTime}` : ''}
                </span>
                <span className="block-content">{entry.content}</span>
              </button>
            );
          })}
        </div>
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
