'use client';

import { useI18n } from '@/lib/i18n';
import type { Dictionary } from '@/lib/i18n/en';
import type { EntryStatus, EntryType } from '@/lib/types';

/** The classic bullet journal glyph set — the same across every language. */
export function glyphFor(type: EntryType, status: EntryStatus): string {
  if (status === 'migrated') return '>';
  if (status === 'scheduled') return '<';
  if (status === 'done') return type === 'task' ? '×' : '✓';
  if (status === 'cancelled') return '~';
  if (type === 'event') return '○';
  if (type === 'note') return '—';
  return '•';
}

export function labelFor(type: EntryType, status: EntryStatus, t: Dictionary): string {
  if (status === 'migrated') return t.entry.migrated;
  if (status === 'scheduled') return t.entry.scheduled;
  if (status === 'cancelled') return t.entry.cancelled;
  if (status === 'done') return t.entry.doneClickToReopen;
  return type === 'task' ? t.entry.openTaskClickToComplete : type === 'event' ? t.entry.event : t.entry.note;
}

export default function Bullet({
  type,
  status,
  onClick,
}: {
  type: EntryType;
  status: EntryStatus;
  onClick?: () => void;
}) {
  const { t } = useI18n();
  const label = labelFor(type, status, t);
  return (
    <button
      type="button"
      className={`bullet ${status} type-${type}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {glyphFor(type, status)}
    </button>
  );
}
