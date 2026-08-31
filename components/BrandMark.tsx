'use client';

import { useTheme } from '@/lib/ThemeProvider';

/**
 * The Bujo logo, in the variant that suits the active theme.
 *
 * `dusk` is the only dark theme, so it gets the light-on-dark artwork and
 * every other theme gets the dark-on-light one. The asset is a small raster
 * rendered from the source SVGs in `public/`: those are ~220KB each, which is
 * far too much to ship for a mark that never renders larger than ~40px.
 */
export default function BrandMark({ className = '' }: { className?: string }) {
  const { theme } = useTheme();
  const variant = theme === 'dusk' ? 'dark' : 'light';

  return (
    <img
      className={`brand-mark ${className}`.trim()}
      src={`/logo-${variant}.webp`}
      alt="Bujo"
      // Intrinsic size of the asset — lets the browser reserve the right box
      // before the image arrives, so the sidebar doesn't jump.
      width={180}
      height={121}
      // Above the fold in the sidebar and the mobile top bar — never defer it.
      loading="eager"
      decoding="sync"
      draggable={false}
    />
  );
}
