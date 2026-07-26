'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Reading-progress bar.
 *
 * Sits at `z-header + 1` and is rendered above the sticky navbar. Previously it
 * was `z-50`, the same layer as the navbar but earlier in the DOM, so the
 * header painted straight over it and the bar was never visible on any page.
 *
 * Scroll handling is passive and rAF-throttled: the previous version wrote
 * state on every scroll event and read `scrollHeight` each time, forcing a
 * synchronous layout on a hot path.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      frame.current = null;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      // Guard the divide: a page shorter than the viewport has nothing to
      // scroll, and 0/0 would put NaN into the style attribute.
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[31] h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left bg-brass"
        style={{ transform: `scaleX(${progress / 100})`, transition: 'transform 120ms linear' }}
      />
    </div>
  );
}
