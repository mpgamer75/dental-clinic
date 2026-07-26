'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll reveal.
 *
 * The governing rule here is that the reveal is an *enhancement over an
 * already-visible default*. Content is visible in the server HTML and stays
 * visible unless JavaScript actively decides to animate it.
 *
 * This replaces a Framer Motion implementation that inverted that rule and
 * took the whole site down for a subset of users:
 *
 *   `useReducedMotion()` returns `null` during SSR but `true` on a
 *   reduced-motion client's first render. The server therefore emitted
 *   `<motion.div style="opacity:0">` while the client rendered a plain `<div>`
 *   with no style. React 18 hydration does not strip extra DOM attributes, so
 *   `opacity: 0` stuck permanently — every section of the homepage rendered
 *   blank for anyone with "Reduce motion" enabled at OS level.
 *
 * Three properties fall out of the current approach:
 *
 *   1. No JS, no IntersectionObserver, or a headless renderer → visible.
 *   2. `prefers-reduced-motion: reduce` → visible, never animated.
 *   3. Anything already within the viewport on mount is never hidden, so
 *      above-the-fold content cannot flash out and back in.
 *
 * It also drops Framer Motion from this path entirely; CSS transitions carry
 * the same effect without the hydration hazard.
 */

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const DURATION = 620;
const IO_MARGIN = '0px 0px -80px 0px';

type Phase = 'visible' | 'hidden' | 'shown';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Drives one element from `visible` (SSR default) through `hidden` → `shown`,
 * but only when it is genuinely off-screen and motion is welcome.
 */
function useRevealPhase<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const [phase, setPhase] = useState<Phase>('visible');

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

    // Never hide something the visitor can already see.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    setPhase('hidden');

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase('shown');
          io.disconnect();
        }
      },
      { rootMargin: IO_MARGIN },
    );

    io.observe(el);

    // Fail-open safety net.
    //
    // Everything below the fold is now hidden by JS, so if the observer never
    // fires — a browser quirk, a detached/`display:none` ancestor, an
    // aggressive extension — that content would stay invisible forever. That
    // is precisely the failure this component was rewritten to eliminate, so
    // it must not be reintroduced through a different door. After 3s, reveal
    // unconditionally. Real scrolling always beats this timer, so it is
    // invisible in normal use.
    const failOpen = window.setTimeout(() => {
      setPhase('shown');
      io.disconnect();
    }, 3000);

    return () => {
      io.disconnect();
      window.clearTimeout(failOpen);
    };
  }, [enabled]);

  return { ref, phase };
}

function revealStyle(phase: Phase, y: number, delayMs: number): React.CSSProperties {
  if (phase === 'visible') return {};
  return {
    opacity: phase === 'hidden' ? 0 : 1,
    transform: phase === 'hidden' ? `translate3d(0, ${y}px, 0)` : 'translate3d(0,0,0)',
    transition:
      phase === 'shown'
        ? `opacity ${DURATION}ms ${EASE} ${delayMs}ms, transform ${DURATION}ms ${EASE} ${delayMs}ms`
        : undefined,
    willChange: phase === 'hidden' ? 'opacity, transform' : undefined,
  };
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to delay the animation (kept in seconds for API compatibility). */
  delay?: number;
  /** Vertical offset (px) the content travels from. */
  y?: number;
}

export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const { ref, phase } = useRevealPhase<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={revealStyle(phase, y, delay * 1000)}>
      {children}
    </div>
  );
}

/* ── Staggered group ───────────────────────────────────────────────────────── */

interface GroupCtx {
  phase: Phase;
  stagger: number;
  delayChildren: number;
  /** Hands each item its position so the stagger delay is deterministic. */
  claimIndex: () => number;
}

const RevealGroupContext = createContext<GroupCtx | null>(null);

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's entrance. */
  stagger?: number;
  /** Seconds before the first child animates. */
  delayChildren?: number;
}

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
}: RevealGroupProps) {
  const { ref, phase } = useRevealPhase<HTMLDivElement>();
  const counter = useRef(0);

  // Reset on every render pass so indices stay stable across re-renders
  // instead of climbing each time the tree updates.
  counter.current = 0;

  const ctx = useMemo<GroupCtx>(
    () => ({
      phase,
      stagger,
      delayChildren,
      claimIndex: () => counter.current++,
    }),
    [phase, stagger, delayChildren],
  );

  return (
    <RevealGroupContext.Provider value={ctx}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </RevealGroupContext.Provider>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  /** Vertical offset (px) the item travels from. */
  y?: number;
}

export function RevealItem({ children, className, y = 24 }: RevealItemProps) {
  const group = useContext(RevealGroupContext);
  const indexRef = useRef<number | null>(null);
  if (indexRef.current === null) indexRef.current = group ? group.claimIndex() : 0;

  // Outside a RevealGroup an item still reveals, just without the stagger.
  const solo = useRevealPhase<HTMLDivElement>(!group);

  if (!group) {
    return (
      <div ref={solo.ref} className={className} style={revealStyle(solo.phase, y, 0)}>
        {children}
      </div>
    );
  }

  const delayMs = (group.delayChildren + indexRef.current * group.stagger) * 1000;

  return (
    <div className={cn(className)} style={revealStyle(group.phase, y, delayMs)}>
      {children}
    </div>
  );
}
