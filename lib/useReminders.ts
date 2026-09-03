'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { addDays, fromISODate, toISODate, todayISO } from './date';
import { timeToMinutes } from './timeline';

const ENABLED_KEY = 'bujo:reminders-enabled';
const FIRED_KEY = 'bujo:reminders-fired';
const POLL_MS = 30_000;
// How long after the reminder moment a check is still allowed to fire it —
// wide enough that a poll every 30s never misses one, narrow enough that
// reopening the app a day later doesn't fire a flood of stale reminders.
const GRACE_MS = 4 * 60_000;

function loadFired(): Set<string> {
  try {
    const raw = window.localStorage.getItem(FIRED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveFired(ids: Set<string>) {
  try {
    // Keep the set from growing forever — only "today and yesterday" keys
    // can ever matter again, so anything else is safe to drop.
    const today = todayISO();
    const yesterday = toISODate(addDays(fromISODate(today), -1));
    const pruned = [...ids].filter((k) => k.startsWith(today) || k.startsWith(yesterday));
    window.localStorage.setItem(FIRED_KEY, JSON.stringify(pruned));
  } catch {
    /* localStorage unavailable — reminders still fire, just may repeat across reloads */
  }
}

/**
 * Polls today's and tomorrow's weekly-log entries for due reminders and
 * fires a browser Notification for each, once. Entirely client-side — no
 * server push, so it only works while a tab is open, which is the tradeoff
 * for needing zero extra infrastructure.
 */
export function useReminderEngine(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const fired = loadFired();

    const check = async () => {
      if (Notification.permission !== 'granted') return;
      const today = todayISO();
      const tomorrow = toISODate(addDays(fromISODate(today), 1));
      let entries;
      try {
        entries = await api.entries({ logKind: 'weekly', from: today, to: tomorrow });
      } catch {
        return;
      }

      const now = Date.now();
      let changed = false;
      for (const entry of entries) {
        if (!entry.startTime || entry.reminderMinutes === null) continue;
        if (entry.status !== 'open') continue;
        const key = `${entry.date}:${entry.id}`;
        if (fired.has(key)) continue;

        const dayStart = fromISODate(entry.date).getTime();
        const remindAt = dayStart + (timeToMinutes(entry.startTime) - entry.reminderMinutes) * 60_000;
        if (now >= remindAt && now - remindAt <= GRACE_MS) {
          new Notification(entry.content, {
            body: entry.endTime ? `${entry.startTime}–${entry.endTime}` : entry.startTime,
            tag: key,
          });
          fired.add(key);
          changed = true;
        }
      }
      if (changed) saveFired(fired);
    };

    check();
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, [active]);
}

/** Reads/writes the user's reminders-on preference, and exposes the current
 * Notification permission so the bell toggle can show the right state. */
export function useReminderPreference() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
    try {
      setEnabled(window.localStorage.getItem(ENABLED_KEY) === '1' && Notification.permission === 'granted');
    } catch {
      /* ignore */
    }
  }, []);

  const enable = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setEnabled(true);
      try {
        window.localStorage.setItem(ENABLED_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
    try {
      window.localStorage.setItem(ENABLED_KEY, '0');
    } catch {
      /* ignore */
    }
  }, []);

  return { enabled, permission, enable, disable };
}
