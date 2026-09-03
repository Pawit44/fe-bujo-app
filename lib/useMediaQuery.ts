'use client';

import { useEffect, useState } from 'react';

/** Tracks a CSS media query in React state. Starts `false` (desktop-first)
 * so server and first client render match — it flips right after mount,
 * which is invisible since layout-affecting reads happen post-mount anyway. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
