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
// Bumped by invalidateOverview. A request that started under an older
// version discards its own result instead of publishing it — see refresh().
let version = 0;
const subscribers = new Set<(next: IndexOverview) => void>();
const refreshingSubscribers = new Set<(refreshing: boolean) => void>();

function publish(next: IndexOverview) {
  cache = next;
  fetchedAt = Date.now();
  subscribers.forEach((fn) => fn(next));
}

function setRefreshing(refreshing: boolean) {
  refreshingSubscribers.forEach((fn) => fn(refreshing));
}

function refresh(): Promise<void> {
  if (inFlight) return inFlight;

  const myVersion = version;
  setRefreshing(true);
  inFlight = api
    .overview()
    .then((data) => {
      // Something invalidated the cache *while this request was in flight* —
      // its response reflects the database from before that change. Applying
      // it would overwrite the fresh numbers with stale ones and, because
      // publish() also stamps fetchedAt, nothing downstream would know to
      // retry. Dropping it and letting the finally-block retry below run is
      // what actually fixes that instead of just reducing how often it shows.
      if (myVersion === version) publish(data);
    })
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
      if (myVersion !== version) {
        void refresh();
      } else {
        setRefreshing(false);
      }
    });
  return inFlight;
}

/** Call after any mutation that changes counts — adding, completing, migrating, or deleting an entry. */
export function invalidateOverview() {
  version++;
  fetchedAt = 0;
  void refresh();
}

export function useOverview(): {
  data: IndexOverview | null;
  loading: boolean;
  /** A background refresh is in flight while `data` already has a value —
   * for a small inline indicator, not the full-page skeleton `loading` covers. */
  refreshing: boolean;
  reload: () => Promise<void>;
} {
  const [data, setData] = useState<IndexOverview | null>(cache);
  const [refreshing, setRefreshingState] = useState(inFlight !== null);

  useEffect(() => {
    subscribers.add(setData);
    refreshingSubscribers.add(setRefreshingState);
    if (cache) setData(cache);
    setRefreshingState(inFlight !== null);
    if (!cache || Date.now() - fetchedAt > STALE_AFTER_MS) void refresh();
    return () => {
      subscribers.delete(setData);
      refreshingSubscribers.delete(setRefreshingState);
    };
  }, []);

  return { data, loading: data === null, refreshing, reload: refresh };
}
