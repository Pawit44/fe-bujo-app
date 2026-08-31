/**
 * Centralized theme registry. Every color a theme needs lives in
 * `app/globals.css` under a `[data-theme="<id>"]` block — this file only
 * knows the list of theme ids and their display names, so the toggle UI
 * and persistence logic never need to change when a theme is added.
 *
 * To add a theme: add an entry here, add a matching
 * `[data-theme="<id>"] { --paper: ...; }` block in globals.css.
 */

export type ThemeId = 'paper' | 'dusk' | 'sage';

export interface ThemeMeta {
  id: ThemeId;
}

/** Each id must also exist as a key under `theme.*` in every i18n dictionary. */
export const THEMES: ThemeMeta[] = [{ id: 'paper' }, { id: 'dusk' }, { id: 'sage' }];

export const DEFAULT_THEME: ThemeId = 'paper';
export const THEME_STORAGE_KEY = 'bujo:theme';

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && THEMES.some((t) => t.id === value);
}

export function nextThemeId(current: ThemeId): ThemeId {
  const i = THEMES.findIndex((t) => t.id === current);
  return THEMES[(i + 1) % THEMES.length].id;
}
