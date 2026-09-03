export type Role = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export type EntryType = 'task' | 'event' | 'note';
export type EntryStatus = 'open' | 'done' | 'migrated' | 'scheduled' | 'cancelled';
export type LogKind = 'future' | 'monthly' | 'weekly' | 'collection';

export interface Entry {
  id: number;
  content: string;
  type: EntryType;
  status: EntryStatus;
  logKind: LogKind;
  month: string;
  date: string;
  collectionId: number | null;
  /** Only meaningful when collectionId is set — which of that collection's
   * folders this entry sits in. Null means the collection's unsorted area. */
  folderId: number | null;
  priority: boolean;
  inspiration: boolean;
  position: number;
  notes: string;
  /** "HH:MM" (24h), or "" when this entry has no time set. Only meaningful
   * on weekly-log entries — the timeline view positions/tints by these. */
  startTime: string;
  endTime: string;
  /** Palette token (see EVENT_COLORS in lib/eventColors.ts), or "" for the
   * default uncolored look. */
  color: string;
  /** Minutes before startTime to notify, 0 meaning "at start time"; null
   * means no reminder is set. Meaningless without startTime. */
  reminderMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

/** A single, flat level of grouping inside one collection — folders don't nest. */
export interface Folder {
  id: number;
  collectionId: number;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: number;
  title: string;
  description: string;
  color: string;
  icon: string;
  pinned: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  entries?: Entry[];
  total?: number;
  open?: number;
  done?: number;
}

export interface LogSummary {
  key: string;
  label: string;
  total: number;
  open: number;
  done: number;
}

export interface MonthSummary {
  month: string;
  total: number;
  open: number;
  done: number;
}

/** One of the four tabs every entry list splits into — task/event/note/idea —
 * with its all-time open and done counts. Always all four, even at zero. */
export interface TypeCount {
  tab: 'task' | 'event' | 'note' | 'idea';
  open: number;
  done: number;
}

export interface IndexOverview {
  today: string;
  month: string;
  weekStart: string;
  weekEnd: string;
  logs: LogSummary[];
  futureMonths: MonthSummary[];
  collections: Collection[];
  recent: Entry[];
  /** Open entries whose spread has already passed — badge count for Review. */
  dueForReview: number;
  totals: { entries: number; done: number };
  typeBreakdown: TypeCount[];
}

/** Destination of a migration. */
export interface MigrateTarget {
  logKind: LogKind;
  month?: string;
  date?: string;
  collectionId?: number | null;
  folderId?: number | null;
}

export type EntryDraft = Partial<Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>> & {
  content: string;
  logKind: LogKind;
};
