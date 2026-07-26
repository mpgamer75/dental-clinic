'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * "Has the sticky element left the top of the page?" — without a scroll listener.
 *
 * A zero-height sentinel is rendered immediately above the sticky element. An
 * IntersectionObserver watches it: while the sentinel is in view the element is
 * still in its resting position; once it scrolls out, the element is stuck.
 *
 * Why not a scroll handler: `scroll` fires on every frame of every gesture and
 * anything reading layout inside it (`scrollY`, `getBoundingClientRect`) sits on
 * the main thread during the scroll. The observer fires exactly twice per
 * crossing, off the scrolling hot path, and needs no rAF throttle.
 *
 * `offset` grows the observer root upward, which gives the crossing a small
 * dead zone — without it the header would re-style at a single pixel of scroll
 * and flicker under a trackpad's rubber-band.
 *
 * 6px, not 24px: the header is transparent until `data-stuck`, so a 24px dead
 * zone meant the top of the hero slid behind an unbacked, unblurred bar and
 * collided with the wordmark for the first 24px of every scroll. 6px still
 * absorbs rubber-band jitter without opening that window.
 *
 * A zero-area target is intentional and well defined: the observer spec treats
 * a target whose rect merely touches the root as intersecting, so the sentinel
 * reports `true` at rest and `false` the moment it passes the root's top edge.
 */
export function useStickySentinel<T extends HTMLElement = HTMLDivElement>(offset = 6) {
  const ref = useRef<T>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setStuck(!entry.isIntersecting);
      },
      { rootMargin: `${offset}px 0px 0px 0px`, threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [offset]);

  return { ref, stuck };
}
