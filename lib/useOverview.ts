'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { IndexOverview } from './types';

/**
 * The Index page's overview — counts, previews, the Review badge — shared
 * across the Index page and the sidebar so both read one cached fetch
 * instead of two, and so an action taken on any other page (finishing a
 * task, migrating one) can invalidate it and have every consumer pick up
 * the new numbers without a manual refetch wired through each page.
 *
 * Short stale window: unlike the collections list, these numbers are meant
 * to move as the journal is used, so a cached copy older than this is
 * treated as stale on the next mount rather than trusted indefinitely.
 */
const STALE_AFTER_MS = 30_000;

let cache: IndexOverview | null = null;
let fetchedAt = 0;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<(next: IndexOverview) => void>();

function publish(next: IndexOverview) {
  cache = next;
  fetchedAt = Date.now();
  subscribers.forEach((fn) => fn(next));
}

function refresh(): Promise<void> {
  inFlight ??= api
    .overview()
    .then(publish)
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Call after any mutation that changes counts — adding, completing, migrating, or deleting an entry. */
export function invalidateOverview() {
  fetchedAt = 0;
  void refresh();
}

export function useOverview(): { data: IndexOverview | null; loading: boolean; reload: () => Promise<void> } {
  const [data, setData] = useState<IndexOverview | null>(cache);

  useEffect(() => {
    subscribers.add(setData);
    if (cache) setData(cache);
    if (!cache || Date.now() - fetchedAt > STALE_AFTER_MS) void refresh();
    return () => {
      subscribers.delete(setData);
    };
  }, []);

  return { data, loading: data === null, reload: refresh };
}
