'use client';

import { useEffect } from 'react';

/**
 * Freezes the page while an overlay (dialog, mobile drawer) is open.
 *
 * Without this, a scroll gesture that starts on the overlay — or continues
 * past the end of the overlay's own content — scrolls the page underneath
 * instead, which on a phone reads as "the panel won't scroll".
 *
 * `position: fixed` rather than `overflow: hidden` on the body, because iOS
 * Safari ignores the latter. That detaches the page from its scroll offset,
 * so the offset is stashed and restored on unlock — otherwise closing the
 * overlay would silently jump the reader back to the top.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    // Keep the scrollbar gutter reserved so the layout doesn't shift sideways
    // on desktop as the page is frozen.
    body.style.overflowY = 'scroll';

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflowY = previous.overflowY;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
