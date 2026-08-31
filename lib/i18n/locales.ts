import type { Dictionary } from './en';
import en from './en';
import th from './th';

export type Locale = 'en' | 'th';

export const DEFAULT_LOCALE: Locale = 'th';
export const LOCALE_STORAGE_KEY = 'bujo:locale';

export const LOCALES: { id: Locale; nativeName: string }[] = [
  { id: 'en', nativeName: 'EN' },
  { id: 'th', nativeName: 'ไทย' },
];

export const dictionaries: Record<Locale, Dictionary> = { en, th };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'th';
}
