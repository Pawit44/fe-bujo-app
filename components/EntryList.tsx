'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, ListTodo, Sparkles, StickyNote, type LucideIcon } from 'lucide-react';
import EntryRow from './EntryRow';
import QuickAdd from './QuickAdd';
import { useI18n } from '@/lib/i18n';
import type { Collection, Entry, EntryDraft, EntryType, MigrateTarget } from '@/lib/types';

type EntryTab = 'task' | 'event' | 'note' | 'idea';

/** Every entry belongs to exactly one tab — inspiration wins over type, so an
 * idea never also shows up under its underlying type and nothing is counted twice. */
function tabOf(entry: Entry): EntryTab {
  if (entry.inspiration) return 'idea';
  return entry.type;
}

interface Props {
  entries: Entry[];
  collections: Collection[];
  /** Where new entries created from this list belong. */
  context: Omit<EntryDraft, 'content'>;
  onAdd: (draft: EntryDraft) => void;
  onToggle: (entry: Entry) => void;
  onUpdate: (entry: Entry, patch: Partial<Entry>) => void;
  onDelete: (entry: Entry) => void;
  onMigrate: (entry: Entry, target: MigrateTarget) => void;
  onReorder?: (ordered: Entry[]) => void;
  showAdd?: boolean;
  contextLabel?: (entry: Entry) => string | undefined;
}

/**
 * A spread section: tasks, events, notes and ideas are kept in their own
 * tab so managing one kind of bullet never involves scrolling past the
 * others — each tab has its own view, its own capture line, its own count.
 */
export default function EntryList({
  entries,
  collections,
  context,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onMigrate,
  onReorder,
  showAdd = true,
  contextLabel,
}: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<EntryTab>('task');
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const TABS: { id: EntryTab; label: string; Icon: LucideIcon }[] = [
    { id: 'task', label: t.entryTabs.task, Icon: ListTodo },
    { id: 'event', label: t.entryTabs.event, Icon: CalendarClock },
    { id: 'note', label: t.entryTabs.note, Icon: StickyNote },
    { id: 'idea', label: t.entryTabs.idea, Icon: Sparkles },
  ];

  const counts = useMemo(() => {
    const c: Record<EntryTab, number> = { task: 0, event: 0, note: 0, idea: 0 };
    for (const e of entries) c[tabOf(e)]++;
    return c;
  }, [entries]);

  const visible = useMemo(() => entries.filter((e) => tabOf(e) === tab), [entries, tab]);

  const handleDrop = () => {
    if (dragId === null || overId === null || dragId === overId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ordered = [...visible];
    const from = ordered.findIndex((e) => e.id === dragId);
    const to = ordered.findIndex((e) => e.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    onReorder?.(ordered);
    setDragId(null);
    setOverId(null);
  };

  const placeholders: Record<EntryTab, string> = {
    task: t.entryTabs.addTask,
    event: t.entryTabs.addEvent,
    note: t.entryTabs.addNote,
    idea: t.entryTabs.addIdea,
  };
  const emptyTexts: Record<EntryTab, string> = {
    task: t.entryTabs.emptyTask,
    event: t.entryTabs.emptyEvent,
    note: t.entryTabs.emptyNote,
    idea: t.entryTabs.emptyIdea,
  };
  // Ideas are captured as inspiration-flagged notes — the tab already says "idea",
  // so the underlying bullet type doesn't need its own picker.
  const addType: EntryType = tab === 'idea' ? 'note' : tab;

  return (
    <div className="entry-list">
      <div className="entry-tabs" role="tablist">
        {TABS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            data-tab={opt.id}
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

      {visible.length === 0 && <div className="empty">{emptyTexts[tab]}</div>}

      {visible.map((entry) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          collections={collections}
          showContext={contextLabel?.(entry)}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onMigrate={onMigrate}
          dragging={dragId === entry.id}
          dropTarget={overId === entry.id && dragId !== entry.id}
          onDragStart={onReorder ? () => setDragId(entry.id) : undefined}
          onDragEnter={onReorder ? () => setOverId(entry.id) : undefined}
          onDragEnd={onReorder ? handleDrop : undefined}
        />
      ))}

      {showAdd && (
        <div style={{ marginTop: visible.length ? 6 : 0 }}>
          <QuickAdd
            key={tab}
            placeholder={placeholders[tab]}
            fixedType={addType}
            forceInspiration={tab === 'idea'}
            onAdd={({ content, type, priority, inspiration }) =>
              onAdd({ ...context, content, type, priority, inspiration })
            }
          />
        </div>
      )}
    </div>
  );
}
