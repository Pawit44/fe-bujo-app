'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_THEME, THEME_STORAGE_KEY, isThemeId, type ThemeId } from './theme';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start at the default so server and client render the same markup on hydration;
  // the inline boot script in layout.tsx already applied the real theme's CSS variables
  // before paint — this just brings React's own state (icons, titles) in sync, before paint too.
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored) && stored !== theme) setThemeState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (next: ThemeId) => {
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage can be unavailable (private mode, etc) — theme still applies for this session.
    }
  };

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
