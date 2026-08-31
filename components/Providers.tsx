'use client';

import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { AuthProvider } from '@/lib/AuthProvider';

/**
 * Single place to add app-wide client providers. Theme and language are
 * independent contexts on purpose — either can be extended (more themes,
 * more locales) without touching the other.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
