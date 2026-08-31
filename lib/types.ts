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
  priority: boolean;
  inspiration: boolean;
  position: number;
  notes: string;
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
}

export type EntryDraft = Partial<Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>> & {
  content: string;
  logKind: LogKind;
};
