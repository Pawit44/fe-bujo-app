'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type { EntryType } from '@/lib/types';

/**
 * Single-line capture. Shorthand while typing:
 *   `*` prefix -> priority, `!` prefix -> inspiration,
 *   `o ` -> event, `- ` -> note (only when the type isn't already fixed by
 *   the caller, e.g. an active tab).
 */
export default function QuickAdd({
  onAdd,
  placeholder,
  autoFocus = false,
  fixedType,
  forceInspiration = false,
}: {
  onAdd: (input: { content: string; type: EntryType; priority: boolean; inspiration: boolean }) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** When set, the entry type is locked (no type toggle, no o/- shorthand) — used when adding from within a type tab. */
  fixedType?: EntryType;
  /** When true, every entry added here is marked as an idea regardless of the `!` shorthand. */
  forceInspiration?: boolean;
}) {
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t.quickAdd.defaultPlaceholder;
  const [value, setValue] = useState('');
  const [type, setType] = useState<EntryType>(fixedType ?? 'task');

  const submit = () => {
    let content = value.trim();
    if (!content) return;

    let priority = false;
    let inspiration = forceInspiration;
    let kind = fixedType ?? type;

    // Strip the leading shorthand markers, in any order.
    let changed = true;
    while (changed) {
      changed = false;
      if (content.startsWith('*')) {
        priority = true;
        content = content.slice(1).trimStart();
        changed = true;
      } else if (content.startsWith('!')) {
        inspiration = true;
        content = content.slice(1).trimStart();
        changed = true;
      } else if (!fixedType && /^o\s/i.test(content)) {
        kind = 'event';
        content = content.slice(2).trimStart();
        changed = true;
      } else if (!fixedType && /^-\s/.test(content)) {
        kind = 'note';
        content = content.slice(2).trimStart();
        changed = true;
      }
    }

    if (!content) return;
    onAdd({ content, type: kind, priority, inspiration });
    setValue('');
  };

  return (
    <div className="quick-add">
      <input
        value={value}
        autoFocus={autoFocus}
        placeholder={resolvedPlaceholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') setValue('');
        }}
        aria-label={resolvedPlaceholder}
      />

      {value.trim() && (
        <button type="button" className="btn btn-sm btn-primary" onClick={submit}>
          {t.quickAdd.add}
        </button>
      )}
    </div>
  );
}
