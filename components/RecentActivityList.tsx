'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ListTodo, Sparkles, StickyNote, type LucideIcon } from 'lucide-react';
import { glyphFor } from './Bullet';
import { tabOf, matchesStatus, type EntryTab, type StatusFilter } from '@/lib/entryFilters';
import { useI18n } from '@/lib/i18n';
import type { Entry } from '@/lib/types';

/**
 * The Index page's "This month's activity" list, filterable the same way
 * every log's own entry list is — by type (task/event/note/idea) and by
 * status (all/open/done) — so a mixed preview of the month doesn't read as
 * one undifferentiated pile the way a plain feed would.
 */
export default function RecentActivityList({
  entries,
  href,
  meta,
}: {
  entries: Entry[];
  href: (entry: Entry) => string;
  meta: (entry: Entry) => string;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<EntryTab>('task');
  const [status, setStatus] = useState<StatusFilter>('all');

  const TABS: { id: EntryTab; label: string; Icon: LucideIcon }[] = [
    { id: 'task', label: t.entryTabs.task, Icon: ListTodo },
    { id: 'event', label: t.entryTabs.event, Icon: CalendarClock },
    { id: 'note', label: t.entryTabs.note, Icon: StickyNote },
    { id: 'idea', label: t.entryTabs.idea, Icon: Sparkles },
  ];
  const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: t.entryTabs.statusAll },
    { id: 'open', label: t.entryTabs.statusOpen },
    { id: 'done', label: t.entryTabs.statusDone },
  ];

  const counts = useMemo(() => {
    const c: Record<EntryTab, number> = { task: 0, event: 0, note: 0, idea: 0 };
    for (const e of entries) if (matchesStatus(e, status)) c[tabOf(e)]++;
    return c;
  }, [entries, status]);

  const visible = useMemo(
    () => entries.filter((e) => tabOf(e) === tab && matchesStatus(e, status)),
    [entries, tab, status],
  );

  return (
    <div>
      <div className="entry-toolbar" style={{ padding: '10px 14px 0' }}>
        <div className="entry-tabs" role="tablist">
          {TABS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={tab === opt.id}
              className={`entry-tab ${tab === opt.id ? 'on' : ''}`}
              onClick={() => setTab(opt.id)}
            >
              <opt.Icon size={13} strokeWidth={1.8} />
              {opt.label}
              {counts[opt.id] > 0 && <span className="entry-tab-count">{counts[opt.id]}</span>}
            </button>
          ))}
        </div>
        <div className="status-toggle" role="group" aria-label={t.entryTabs.statusFilterLabel}>
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={status === opt.id ? 'on' : ''}
              aria-pressed={status === opt.id}
              onClick={() => setStatus(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <div className="empty">{t.common.nothingHere}</div>}

      <div style={{ padding: '4px 8px 8px' }}>
        {visible.map((entry) => (
          <Link key={entry.id} href={href(entry)} className={`entry recent-entry ${entry.status}`}>
            <span className={`bullet ${entry.status} type-${entry.type}`} style={{ pointerEvents: 'none' }}>
              {glyphFor(entry.type, entry.status)}
            </span>
            <div className="entry-body">
              <span className="entry-text">{entry.content}</span>
              <div className="entry-meta">{meta(entry)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
