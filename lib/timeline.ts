/** Time-grid math for the weekly timeline view — everything in minutes since
 * midnight, snapped to a quarter hour, so a drag or tap always lands on a
 * clean time instead of an odd number like 09:07. */

export const TIMELINE_START_HOUR = 6;
export const TIMELINE_END_HOUR = 24;
export const HOUR_HEIGHT = 48;
export const SNAP_MINUTES = 15;

export const TIMELINE_TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
export const TIMELINE_HEIGHT = ((TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT);

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function snap(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/** Pixel offset from the top of the grid for a given minute-of-day. */
export function minuteToY(minuteOfDay: number): number {
  return ((minuteOfDay - TIMELINE_START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

/** Inverse of minuteToY, snapped to the quarter hour and clamped to the grid. */
export function yToMinute(y: number): number {
  const raw = TIMELINE_START_HOUR * 60 + (y / HOUR_HEIGHT) * 60;
  return Math.max(TIMELINE_START_HOUR * 60, Math.min(TIMELINE_END_HOUR * 60 - SNAP_MINUTES, snap(raw)));
}

export const TIMELINE_HOURS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
  (_, i) => TIMELINE_START_HOUR + i,
);
