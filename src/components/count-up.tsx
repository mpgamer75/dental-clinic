'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion, useInView } from 'framer-motion';

/**
 * Animated count-up for stats (e.g. "30+", "9", "8").
 * - Parses a leading integer + suffix, animates only the number.
 * - Plays once when scrolled into view; respects prefers-reduced-motion.
 * - Screen-reader safe: the final value is exposed via aria-label while the
 *   animating digits are aria-hidden, so assistive tech never reads "1, 2, 3…".
 */
export function CountUp({
  value,
  durationMs = 1300,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : '';

  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!match) return;
    if (reduce || !inView) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, durationMs, reduce, match]);

  if (!match) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className} aria-label={value}>
      <span aria-hidden="true">
        {display}
        {suffix}
      </span>
    </span>
  );
}
