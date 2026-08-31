import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';
import { THEME_STORAGE_KEY, DEFAULT_THEME } from '@/lib/theme';
import { LOCALE_STORAGE_KEY, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bujo — Bullet Journal',
  description: 'A calm bullet journal: index, future log, monthly log and weekly log.',
};

// Applies the saved theme/locale before first paint, so there is no flash
// of the default theme or language while React hydrates.
const bootScript = `
(function () {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME}';
    document.documentElement.setAttribute('data-theme', theme);
    var locale = localStorage.getItem('${LOCALE_STORAGE_KEY}') || '${DEFAULT_LOCALE}';
    document.documentElement.lang = locale;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE} data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=Kanit:wght@300;400;500;600&family=Noto+Sans+Thai:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
