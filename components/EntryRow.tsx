'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Star, Trash2 } from 'lucide-react';
import Bullet from './Bullet';
import MigrateMenu from './MigrateMenu';
import { useI18n } from '@/lib/i18n';
import type { Collection, Entry, MigrateTarget } from '@/lib/types';

interface Props {
  entry: Entry;
  collections: Collection[];
  showContext?: string;
  onToggle: (entry: Entry) => void;
  onUpdate: (entry: Entry, patch: Partial<Entry>) => void;
  onDelete: (entry: Entry) => void;
  onMigrate: (entry: Entry, target: MigrateTarget) => void;
  onDragStart?: () => void;
  onDragEnter?: () => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  dropTarget?: boolean;
}

/** One bullet: click the glyph to complete, click the text to edit in place. */
export default function EntryRow({
  entry,
  collections,
  showContext,
  onToggle,
  onUpdate,
  onDelete,
  onMigrate,
  onDragStart,
  onDragEnter,
  onDragEnd,
  dragging,
  dropTarget,
}: Props) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(entry.content), [entry.content]);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing]);

  const commit = () => {
    const value = draft.trim();
    setEditing(false);
    if (!value) {
      setDraft(entry.content);
      return;
    }
    if (value !== entry.content) onUpdate(entry, { content: value });
  };

  return (
    <div
      className={`entry ${entry.status} ${dragging ? 'dragging' : ''} ${dropTarget ? 'drop-target' : ''}`}
      draggable={!editing && !!onDragStart}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
    >
      <Bullet
        type={entry.type}
        status={entry.status}
        onClick={() => (entry.type === 'task' || entry.type === 'event' ? onToggle(entry) : undefined)}
      />

      {entry.priority && (
        <span className="sig sig-priority" title={t.entry.priority}>
          <Star size={13} strokeWidth={1.8} fill="currentColor" />
        </span>
      )}
      {entry.inspiration && (
        <span className="sig sig-inspiration" title={t.entry.inspiration}>
          <Sparkles size={13} strokeWidth={1.8} />
        </span>
      )}

      <div className="entry-body">
        {editing ? (
          <textarea
            ref={inputRef}
            className="entry-input"
            value={draft}
            rows={1}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                setDraft(entry.content);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span
            className="entry-text"
            role="button"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(true);
            }}
          >
            {entry.content}
          </span>
        )}
        {showContext && <div className="entry-meta">{showContext}</div>}
      </div>

      <div className="entry-actions">
        <button
          type="button"
          className={`act ${entry.priority ? 'on' : ''}`}
          title={t.entry.markPriority}
          onClick={() => onUpdate(entry, { priority: !entry.priority })}
        >
          <Star size={14} strokeWidth={1.8} fill={entry.priority ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className={`act ${entry.inspiration ? 'on-insp' : ''}`}
          title={t.entry.markInspiration}
          onClick={() => onUpdate(entry, { inspiration: !entry.inspiration })}
        >
          <Sparkles size={14} strokeWidth={1.8} fill={entry.inspiration ? 'currentColor' : 'none'} />
        </button>
        <MigrateMenu entry={entry} collections={collections} onMigrate={(target) => onMigrate(entry, target)} />
        <button type="button" className="act danger" title={t.common.delete} onClick={() => onDelete(entry)}>
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
