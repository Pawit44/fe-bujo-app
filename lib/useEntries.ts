'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { invalidateJournalCaches } from './dataInvalidation';
import type { Entry, EntryDraft, MigrateTarget } from './types';

type Params = Record<string, string | number | undefined | null>;

/**
 * Loads one slice of the journal and exposes optimistic operations over it.
 * Every mutation updates local state first, then reconciles with the server.
 */
export function useEntries(params: Params) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(params);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const data = await api.entries(JSON.parse(key) as Params);
      if (mounted.current) {
        setEntries(data);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  const add = useCallback(
    async (draft: EntryDraft) => {
      const optimistic: Entry = {
        id: -Date.now(),
        content: draft.content,
        type: draft.type ?? 'task',
        status: 'open',
        logKind: draft.logKind,
        month: draft.month ?? '',
        date: draft.date ?? '',
        collectionId: draft.collectionId ?? null,
        priority: draft.priority ?? false,
        inspiration: draft.inspiration ?? false,
        position: Number.MAX_SAFE_INTEGER,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev, optimistic]);
      try {
        const saved = await api.createEntry(draft);
        setEntries((prev) => prev.map((e) => (e.id === optimistic.id ? saved : e)));
        invalidateJournalCaches(); // a new entry changes this log's totals, and its collection's if it has one
        return saved;
      } catch (e) {
        setEntries((prev) => prev.filter((x) => x.id !== optimistic.id));
        setError((e as Error).message);
        return null;
      }
    },
    [],
  );

  const update = useCallback(async (entry: Entry, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, ...patch } : e)));
    try {
      const saved = await api.updateEntry(entry.id, patch);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? saved : e)));
      // A patch can change status/type here too (not just toggle/content
      // edits go through update) — cheap to always invalidate than to track
      // which patches matter.
      invalidateJournalCaches();
    } catch (e) {
      setEntries((prev) => prev.map((x) => (x.id === entry.id ? entry : x)));
      setError((e as Error).message);
    }
  }, []);

  const toggle = useCallback(async (entry: Entry) => {
    const next = entry.status === 'done' ? 'open' : 'done';
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: next } : e)));
    try {
      const saved = await api.toggleEntry(entry.id);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? saved : e)));
      invalidateJournalCaches(); // done/open counts everywhere depend on this — the Index page, Review's badge, and any collection this entry belongs to
    } catch (e) {
      setEntries((prev) => prev.map((x) => (x.id === entry.id ? entry : x)));
      setError((e as Error).message);
    }
  }, []);

  const remove = useCallback(async (entry: Entry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    try {
      await api.deleteEntry(entry.id);
      invalidateJournalCaches(); // this is the exact case that used to go stale: deleting an entry left its collection's cached count untouched
    } catch (e) {
      setEntries((prev) => [...prev, entry].sort((a, b) => a.position - b.position));
      setError((e as Error).message);
    }
  }, []);

  const migrate = useCallback(
    async (entry: Entry, target: MigrateTarget) => {
      try {
        await api.migrateEntry(entry.id, target);
        invalidateJournalCaches(); // moved to a different log/month/week/collection — every count downstream shifts
      } catch (e) {
        setError((e as Error).message);
      }
      await reload();
    },
    [reload],
  );

  const reorder = useCallback(async (ordered: Entry[]) => {
    setEntries((prev) => {
      const ids = new Set(ordered.map((e) => e.id));
      const rest = prev.filter((e) => !ids.has(e.id));
      return [...ordered.map((e, i) => ({ ...e, position: i })), ...rest];
    });
    try {
      await api.reorderEntries(ordered.map((e) => e.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  return { entries, loading, error, reload, add, update, toggle, remove, migrate, reorder, setError };
}
