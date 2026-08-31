'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Collection } from './types';

/**
 * The sidebar's collection list, shared across every route.
 *
 * It used to be refetched on each route change, which put a full API round
 * trip — browser to Vercel to Render to Postgres — on every single
 * navigation, to redraw a list that almost never differs. The list is instead
 * cached in the module and served synchronously, so navigating is instant, and
 * refreshed in the background only when it is actually stale or a mutation has
 * invalidated it.
 */
const STALE_AFTER_MS = 60_000;

let cache: Collection[] | null = null;
let fetchedAt = 0;
let inFlight: Promise<void> | null = null;
// Bumped by invalidateCollections. A request that started under an older
// version discards its own result instead of publishing it — see refresh().
let version = 0;
const subscribers = new Set<(next: Collection[]) => void>();
const loadingSubscribers = new Set<(loading: boolean) => void>();

function publish(next: Collection[]) {
  cache = next;
  fetchedAt = Date.now();
  subscribers.forEach((fn) => fn(next));
}

function setLoading(loading: boolean) {
  loadingSubscribers.forEach((fn) => fn(loading));
}

function refresh(): Promise<void> {
  // Collapse concurrent callers onto one request — the sidebar and a page can
  // both ask during the same navigation.
  if (inFlight) return inFlight;

  const myVersion = version;
  setLoading(true);
  inFlight = api
    .collections()
    .then((data) => {
      // A create/edit/delete invalidated the cache *while this request was in
      // flight*. Its response reflects the database from before that change,
      // so publishing it would briefly overwrite the fresh list with a stale
      // one — and because publish() also stamps fetchedAt, nothing would
      // consider the cache stale afterwards, so the wrong data could stick
      // until something else happened to invalidate it again. Dropping it and
      // letting the retry below run is what actually fixes that.
      if (myVersion === version) publish(data);
    })
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
      if (myVersion !== version) {
        void refresh();
      } else {
        setLoading(false);
      }
    });
  return inFlight;
}

/** Drops the cache and refetches — call after creating, editing or deleting one. */
export function invalidateCollections() {
  version++;
  fetchedAt = 0;
  void refresh();
}

export function useCollections(): Collection[] {
  const [collections, setCollections] = useState<Collection[]>(cache ?? []);

  useEffect(() => {
    subscribers.add(setCollections);
    if (cache) setCollections(cache);
    if (!cache || Date.now() - fetchedAt > STALE_AFTER_MS) void refresh();
    return () => {
      subscribers.delete(setCollections);
    };
  }, []);

  return collections;
}

/** Whether a fetch of the shared collections cache is currently in flight —
 * for a small inline spinner, not a full-page one; the sidebar and any page
 * reading `useCollections()` already have last-known-good data to show
 * underneath it. */
export function useCollectionsLoading(): boolean {
  const [loading, setLoadingState] = useState(inFlight !== null);

  useEffect(() => {
    loadingSubscribers.add(setLoadingState);
    setLoadingState(inFlight !== null);
    return () => {
      loadingSubscribers.delete(setLoadingState);
    };
  }, []);

  return loading;
}
