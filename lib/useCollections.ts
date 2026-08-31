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
const subscribers = new Set<(next: Collection[]) => void>();

function publish(next: Collection[]) {
  cache = next;
  fetchedAt = Date.now();
  subscribers.forEach((fn) => fn(next));
}

function refresh(): Promise<void> {
  // Collapse concurrent callers onto one request — the sidebar and a page can
  // both ask during the same navigation.
  inFlight ??= api
    .collections()
    .then(publish)
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Drops the cache and refetches — call after creating, editing or deleting one. */
export function invalidateCollections() {
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
