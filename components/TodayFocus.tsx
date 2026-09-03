'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, PartyPopper, Star } from 'lucide-react';
import Bullet from './Bullet';
import { useI18n } from '@/lib/i18n';
import { useEntries } from '@/lib/useEntries';
import { todayISO } from '@/lib/date';
import { timeToMinutes } from '@/lib/timeline';
import type { Entry } from '@/lib/types';

/** Actionable — the things "today" can mean done/not-done. Notes and ideas
 * are records, not to-dos, so they don't belong in a completion percentage. */
function isActionable(e: Entry): boolean {
  return (e.type === 'task' || e.type === 'event') && e.status !== 'migrated' && e.status !== 'scheduled';
}

function messageFor(pct: number, t: ReturnType<typeof useI18n>['t']): string {
  if (pct >= 100) return t.todayFocus.messages.complete;
  if (pct >= 60) return t.todayFocus.messages.almost;
  if (pct > 0) return t.todayFocus.messages.going;
  return t.todayFocus.messages.start;
}

/**
 * The single most important thing on the Index page: exactly what today
 * asks of you, how much of it is already done, and one tap to knock out the
 * next thing — instead of that only being discoverable by clicking into the
 * Weekly log and finding today's column.
 */
export default function TodayFocus() {
  const { t } = useI18n();
  const today = todayISO();
  const day = useEntries({ logKind: 'weekly', date: today });

  const { open, done, total, pct } = useMemo(() => {
    const actionable = day.entries.filter(isActionable);
    const doneList = actionable.filter((e) => e.status === 'done');
    const openList = actionable
      .filter((e) => e.status === 'open')
      .sort((a, b) => {
        if (!!a.startTime !== !!b.startTime) return a.startTime ? -1 : 1;
        if (a.startTime && b.startTime) return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        return a.position - b.position;
      });
    const totalCount = actionable.length;
    return {
      open: openList,
      done: doneList,
      total: totalCount,
      pct: totalCount ? Math.round((doneList.length / totalCount) * 100) : 0,
    };
  }, [day.entries]);

  if (day.loading) {
    return <div className="skeleton today-focus-skeleton" />;
  }

  return (
    <section className={`today-focus ${total > 0 && pct >= 100 ? 'is-complete' : ''}`}>
      <div className="today-focus-head">
        <div>
          <div className="eyebrow">{t.todayFocus.title}</div>
          <p className="today-focus-sub">
            {total > 0 ? t.todayFocus.subtitleCount(open.length) : t.todayFocus.emptySubtitle}
          </p>
        </div>
        {total > 0 && (
          <div className="today-focus-ring">
            <TodayRing value={pct} celebrate={pct >= 100} />
            <div className="today-focus-ring-label">
              <div className="today-focus-pct">{pct}%</div>
              <div className="today-focus-pct-sub">{t.todayFocus.percentDone}</div>
            </div>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="today-focus-message">
          {pct >= 100 && <PartyPopper size={15} strokeWidth={1.8} />}
          {messageFor(pct, t)}
        </div>
      )}

      {total === 0 ? (
        <div className="today-focus-empty">
          <span className="today-focus-empty-glyph">🌤️</span>
          {t.todayFocus.emptyTitle}
        </div>
      ) : (
        <div className="today-focus-list">
          {open.map((entry) => (
            <div key={entry.id} className="today-focus-row">
              <Bullet type={entry.type} status={entry.status} onClick={() => day.toggle(entry)} />
              {entry.priority && (
                <Star size={12} strokeWidth={1.8} fill="currentColor" className="today-focus-star" />
              )}
              <span className="today-focus-text">{entry.content}</span>
              <span className={`today-focus-time entry-time-badge ${entry.color ? `ev-color-${entry.color}` : ''}`}>
                {entry.startTime || t.todayFocus.noTime}
              </span>
            </div>
          ))}
          {done.length > 0 && (
            <details className="today-focus-done">
              <summary>{t.todayFocus.doneSectionTitle(done.length)}</summary>
              {done.map((entry) => (
                <div key={entry.id} className="today-focus-row is-done">
                  <Bullet type={entry.type} status={entry.status} onClick={() => day.toggle(entry)} />
                  <span className="today-focus-text">{entry.content}</span>
                </div>
              ))}
            </details>
          )}
        </div>
      )}

      <Link href="/daily" className="today-focus-link">
        {total === 0 ? t.todayFocus.goAddCta : t.todayFocus.goToDailyLogCta}
        <ArrowRight size={14} strokeWidth={2} />
      </Link>
    </section>
  );
}

function TodayRing({ value, celebrate }: { value: number; celebrate: boolean }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--paper-sunken)" strokeWidth="6" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke={celebrate ? 'var(--done)' : 'var(--accent)'}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * Math.min(value, 100)) / 100}
        transform="rotate(-90 34 34)"
        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,0.61,0.36,1), stroke 300ms' }}
      />
    </svg>
  );
}
