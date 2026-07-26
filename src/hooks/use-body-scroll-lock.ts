'use client';

import { useEffect } from 'react';

/**
 * Freezes the page behind a full-screen overlay.
 *
 * The width the scrollbar was occupying is handed back to the body as padding.
 * Without that compensation the whole layout — including the sticky header the
 * overlay sits on top of — jumps sideways by the scrollbar's width (12px here,
 * the site styles its own) at the moment the menu opens and back again when it
 * closes.
 *
 * Previous inline values are restored rather than cleared, so a nested lock or
 * a page that sets its own body styles is left as it was found.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbar > 0) {
      const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbar}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [active]);
}
