import type { Metadata } from 'next';
import { Inter, Kanit, Newsreader, Noto_Sans_Thai } from 'next/font/google';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';
import { THEME_STORAGE_KEY, DEFAULT_THEME } from '@/lib/theme';
import { LOCALE_STORAGE_KEY, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bujo — Bullet Journal',
  description: 'A calm bullet journal: index, future log, monthly log and weekly log.',
};

/*
 * Fonts are self-hosted through next/font rather than pulled from
 * fonts.googleapis.com at runtime. The stylesheet link this replaces was
 * render-blocking and sat behind a DNS lookup, a TLS handshake and a redirect
 * to a second origin before a single glyph could be measured; next/font emits
 * the @font-face rules inline and serves the files from the app's own origin,
 * so first paint no longer waits on Google.
 *
 * Latin faces are preloaded because the app chrome always uses them. The two
 * Thai faces are not: they only matter once Thai text is on screen, and the
 * default locale is English, so preloading them would spend bandwidth before
 * first paint that most sessions never need.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-noto-thai',
  display: 'swap',
  preload: false,
});

const kanit = Kanit({
  subsets: ['thai'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-kanit',
  display: 'swap',
  preload: false,
});

const fontVariables = [inter, newsreader, notoSansThai, kanit].map((f) => f.variable).join(' ');

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
    <html lang={DEFAULT_LOCALE} data-theme={DEFAULT_THEME} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
