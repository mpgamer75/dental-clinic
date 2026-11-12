'use client';

/*
 * CountUp, after the React Bits component of the same name (reactbits.dev).
 *
 * Rewritten rather than vendored. The upstream file is built on framer-motion
 * (`animate`, `useInView`), and this project took framer-motion OUT of the
 * bundle on purpose: it was costing an 86 ms script task and a 76 ms style
 * recalculation on a throttled phone to drive one scroll value. Re-adding
 * ~40 KB of animation library to count to thirty would undo that. What a
 * count-up actually needs is an IntersectionObserver and a dozen frames of
 * requestAnimationFrame, so that is what this is.
 *
 * Kept from upstream: the `to` / `from` / `duration` / `prefix` / `suffix`
 * props, starting when the figure scrolls into view, and running once.
 */

import { useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  /** Seconds. */
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function CountUp({ to, from = 0, duration = 1.4, prefix = '', suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    /* The server renders the FINAL number, so the figure is right without
       script, for crawlers, and under reduced motion — where this returns
       before touching anything. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;

    /* Writes into the text node React rendered, rather than replacing it:
       `textContent =` would detach that node, and React would then be
       updating one that is no longer in the document. */
    const write = (value: number) => {
      const text = node.firstChild;
      if (text) text.nodeValue = `${prefix}${Math.round(value)}${suffix}`;
    };

    let raf = 0;
    let started = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (started) return;
        /* Already past it when the observer first reports (a reload half-way
           down the page, an anchor link): leave the final number alone rather
           than replay a count nobody is looking at. */
        if (!entry.isIntersecting) {
          if (entry.boundingClientRect.top < 0) {
            started = true;
            io.disconnect();
          }
          return;
        }
        started = true;
        io.disconnect();
        const begin = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - begin) / (duration * 1000));
          write(from + (to - from) * easeOutExpo(t));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        write(from);
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(node);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      write(to);
    };
  }, [to, from, duration, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${to}${suffix}`}
    </span>
  );
}
