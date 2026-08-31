/** Small date helpers - everything is stored as plain YYYY-MM-DD / YYYY-MM strings. */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toISOMonth(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function currentMonthISO(): string {
  return toISOMonth(new Date());
}

/** Monday of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(monthISO: string, delta: number): string {
  const [y, m] = monthISO.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toISOMonth(d);
}

/** The seven ISO dates of the week starting at `start`. */
export function weekDays(start: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
}

/** `months`/`days` default to English but should be passed from the active locale's dictionary (`t.dates`). */
export function formatMonth(monthISO: string, months: string[] = MONTH_NAMES): string {
  const [y, m] = monthISO.split('-').map(Number);
  return `${months[m - 1]} ${y}`;
}

export function formatMonthShort(monthISO: string, months: string[] = MONTH_NAMES): string {
  const [, m] = monthISO.split('-').map(Number);
  return months[m - 1].slice(0, 3);
}

export function formatDayLong(iso: string, months: string[] = MONTH_NAMES, days: string[] = DAY_NAMES): string {
  const d = fromISODate(iso);
  return `${days[(d.getDay() + 6) % 7]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatRange(startISO: string, endISO: string, months: string[] = MONTH_NAMES): string {
  const a = fromISODate(startISO);
  const b = fromISODate(endISO);
  const left = `${a.getDate()} ${months[a.getMonth()].slice(0, 3)}`;
  const right = `${b.getDate()} ${months[b.getMonth()].slice(0, 3)}`;
  return `${left} – ${right} ${b.getFullYear()}`;
}

/** Days in the month, plus the blank leading cells for a Monday-first grid. */
export function monthGrid(monthISO: string): { blanks: number; days: string[] } {
  const [y, m] = monthISO.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const blanks = (first.getDay() + 6) % 7;
  const count = new Date(y, m, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => `${y}-${String(m).padStart(2, '0')}-${pad(i + 1)}`);
  return { blanks, days };
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

export function isWeekend(iso: string): boolean {
  const day = fromISODate(iso).getDay();
  return day === 0 || day === 6;
}

/**
 * How far back or forward a reader can navigate the Monthly, Future and
 * Weekly logs from today.
 *
 * A bullet journal is meant to be a record of *this* stretch of a life, not
 * an infinite calendar — nothing in the data model needed a limit, but
 * without one a stray tap on "next month" is indistinguishable from a typo:
 * both silently leave you decades away with no landmark to get back. Ten
 * years comfortably covers "look back at where I was" and "plan the future"
 * without turning the log into a generic calendar app.
 */
export const MAX_NAV_YEARS = 10;

function monthIndex(monthISO: string): number {
  const [y, m] = monthISO.split('-').map(Number);
  return y * 12 + (m - 1);
}

/** True while monthISO is within MAX_NAV_YEARS of the current month. */
export function isMonthInRange(monthISO: string): boolean {
  return Math.abs(monthIndex(monthISO) - monthIndex(currentMonthISO())) <= MAX_NAV_YEARS * 12;
}

/** True while iso is within MAX_NAV_YEARS of today. */
export function isDateInRange(iso: string): boolean {
  const days = Math.round((fromISODate(iso).getTime() - fromISODate(todayISO()).getTime()) / 86_400_000);
  return Math.abs(days) <= MAX_NAV_YEARS * 366; // 366: never cuts a leap-year stretch short
}
