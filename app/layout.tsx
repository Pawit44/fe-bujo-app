import type { Metadata, Viewport } from 'next';
import { Inter, Kanit, Newsreader, Noto_Sans_Thai } from 'next/font/google';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';
import { THEME_STORAGE_KEY, DEFAULT_THEME } from '@/lib/theme';
import { LOCALE_STORAGE_KEY, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bujo — Bullet Journal',
  description: 'A calm bullet journal: index, future log, monthly log and weekly log.',
  // manifestlink + every iOS-specific tag below (apple-touch-icon,
  // apple-mobile-web-app-capable/-title, the theme-color meta) are emitted by
  // Next's metadata API from this one object — no hand-written <meta> tags.
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    // iOS ignores the web app manifest entirely and only ever looks for this
    // link tag, which also has to be an opaque (non-transparent) PNG.
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    // Without this, "Add to Home Screen" on iOS just bookmarks the page —
    // every navigation still opens inside Safari's chrome (URL bar, tab
    // switcher). This is what actually makes the installed icon launch as a
    // standalone window with no browser UI.
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bujo',
  },
};

// theme-color lives on the separate `viewport` export (Next.js 14+), not on
// `metadata` — this is what tints the OS status bar / task switcher to match
// the icon's background instead of leaving it default white or black.
export const viewport: Viewport = {
  themeColor: '#1b1b19',
};

/*
 * Fonts are self-hosted through next/font rather than pulled from
 * fonts.googleapis.com at runtime. The stylesheet link this replaces was
 * render-blocking and sat behind a DNS lookup, a TLS handshake and a redirect
 * to a second origin before a single glyph could be measured; next/font emits
 * the @font-face rules inline and serves the files from the app's own origin,
 * so first paint no longer waits on Google.
 *
 * The Thai faces are preloaded because DEFAULT_LOCALE is 'th' — that's what
 * paints on first load for anyone without a saved preference, which is most
 * first visits. The Latin faces still load (the brand name, digits, and an
 * English-locale session all need them) but not before first paint, since
 * the default session doesn't need them yet.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  preload: false,
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-noto-thai',
  display: 'swap',
});

const kanit = Kanit({
  subsets: ['thai'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-kanit',
  display: 'swap',
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
        {/* Next's `appleWebApp.capable` metadata (below) only emits the
            newer `mobile-web-app-capable` tag. iOS versions before 17.4 don't
            recognize that name and fall back to opening in Safari's normal
            chrome, so the legacy Apple-prefixed tag is added by hand to cover
            them too — both point at the same standalone-mode behavior. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
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
