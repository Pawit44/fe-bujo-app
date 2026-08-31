'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { invalidateOverview } from './useOverview';
import type { Entry, MigrateTarget } from './types';

/**
 * The Review page's data: every open entry whose spread is already in the
 * past. There is no `add` here — Review is where old capture gets resolved,
 * not where new capture happens — and every action (done, migrate, drop)
 * removes the entry from view immediately: once acted on, it's no longer
 * "due for review", whatever the server eventually confirms.
 */
export function useReview() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const data = await api.dueEntries();
      if (mounted.current) {
        setEntries(data);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const drop = useCallback((id: number) => setEntries((prev) => prev.filter((e) => e.id !== id)), []);

  const toggle = useCallback(
    async (entry: Entry) => {
      drop(entry.id);
      try {
        await api.toggleEntry(entry.id);
        invalidateOverview();
      } catch (e) {
        setEntries((prev) => [...prev, entry]);
        setError((e as Error).message);
      }
    },
    [drop],
  );

  const migrate = useCallback(
    async (entry: Entry, target: MigrateTarget) => {
      drop(entry.id);
      try {
        await api.migrateEntry(entry.id, target);
        invalidateOverview();
      } catch (e) {
        setEntries((prev) => [...prev, entry]);
        setError((e as Error).message);
      }
    },
    [drop],
  );

  const remove = useCallback(
    async (entry: Entry) => {
      drop(entry.id);
      try {
        await api.deleteEntry(entry.id);
        invalidateOverview();
      } catch (e) {
        setEntries((prev) => [...prev, entry]);
        setError((e as Error).message);
      }
    },
    [drop],
  );

  const update = useCallback(async (entry: Entry, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, ...patch } : e)));
    try {
      const saved = await api.updateEntry(entry.id, patch);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? saved : e)));
    } catch (e) {
      setEntries((prev) => prev.map((x) => (x.id === entry.id ? entry : x)));
      setError((e as Error).message);
    }
  }, []);

  return { entries, loading, error, reload, toggle, migrate, remove, update, setError };
}
