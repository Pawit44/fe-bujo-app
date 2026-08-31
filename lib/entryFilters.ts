import type { Entry } from './types';

export type EntryTab = 'task' | 'event' | 'note' | 'idea';
export type StatusFilter = 'all' | 'open' | 'done';

/** Every entry belongs to exactly one tab — inspiration wins over type, so an
 * idea never also shows up under its underlying type and nothing is counted twice. */
export function tabOf(entry: Entry): EntryTab {
  if (entry.inspiration) return 'idea';
  return entry.type;
}

/** "Open" and "done" are deliberately the two literal statuses, not a bucket
 * that also swallows migrated/scheduled/cancelled — those are a different
 * kind of resolved (moved, not finished) and stay visible only under "all"
 * so migrating something doesn't make it silently vanish from every filter. */
export function matchesStatus(entry: Entry, filter: StatusFilter): boolean {
  if (filter === 'open') return entry.status === 'open';
  if (filter === 'done') return entry.status === 'done';
  return true;
}
