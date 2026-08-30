'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reading-progress bar.
 *
 * Sits at `z-overlay` — above the `z-header` navbar, below the `z-modal`
 * mobile menu. It was `z-50`, the same layer as the navbar but earlier in the
 * DOM, so the header painted straight over it and the bar was never visible on
 * any page; the fix for that was an arbitrary `z-[31]`, in a codebase whose
 * token file says in as many words never to write an arbitrary z-index. The
 * scale has a step that means exactly this, so use it.
 *
 * Scroll handling is passive and rAF-throttled, and — the part that matters —
 * the document height is CACHED. Reading `scrollHeight` inside the rAF made
 * every frame of every scroll flush layout for the whole document, which on
 * this page is roughly 13,700px of content; that is the single most expensive
 * thing a scroll handler can do. The height only changes when the document
 * reflows, so it is measured on resize and whenever a ResizeObserver says the
 * page actually grew (lazy images arriving, an accordion opening, the
 * testimonial grid filling in).
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const scrollable = useRef(0);

  useEffect(() => {
    const doc = document.documentElement;

    const remeasure = () => {
      scrollable.current = doc.scrollHeight - window.innerHeight;
    };

    const paint = () => {
      frame.current = null;
      // Guard the divide: a page shorter than the viewport has nothing to
      // scroll, and 0/0 would put NaN into the style attribute.
      setProgress(
        scrollable.current > 0
          ? Math.min(100, (window.scrollY / scrollable.current) * 100)
          : 0,
      );
    };

    const schedule = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(paint);
    };

    const onResize = () => {
      remeasure();
      schedule();
    };

    remeasure();
    paint();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // `resize` alone is not enough: the document grows without the window
    // changing size every time a lazily-loaded image lands or a disclosure
    // opens, and a stale height makes the bar reach 100% early and then stick.
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    observer?.observe(doc);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-overlay h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left bg-brass"
        style={{ transform: `scaleX(${progress / 100})`, transition: 'transform 120ms linear' }}
      />
    </div>
  );
}
