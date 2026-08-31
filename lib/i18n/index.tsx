'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, dictionaries, isLocale, type Locale } from './locales';
import type { Dictionary } from './en';

export type { Locale } from './locales';
export { LOCALES } from './locales';

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start at the default so server and client render the same markup on hydration;
  // the real stored locale (if any) is applied in useLayoutEffect, before the browser paints.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored) && stored !== locale) setLocaleState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // localStorage can be unavailable (private mode, etc) — locale still works for this session.
    }
    document.documentElement.lang = next;
  };

  const value = useMemo<I18nContextValue>(() => ({ locale, t: dictionaries[locale], setLocale }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Access the active locale, its dictionary (`t`), and a setter — the one hook every component needs for text. */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
