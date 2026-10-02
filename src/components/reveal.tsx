import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll reveal, as a class.
 *
 * The motion lives in globals.css (`.reveal`, a CSS view timeline). These
 * components only place the class, so they have no hooks, no state and no
 * effects, render on the server, and cost nothing to hydrate.
 *
 * The previous implementation gave every instance its own IntersectionObserver,
 * React state and inline styles. It measured ~400 ms of style recalculation on
 * a throttled phone, and a 3-second fail-open timer revealed everything off
 * screen shortly after load, so most visitors never saw the effect at all.
 *
 * Two invariants carried over unchanged:
 *
 *   1. Content is visible by default. Without view-timeline support, without
 *      CSS, or under `prefers-reduced-motion`, nothing is hidden.
 *   2. The element is the caller's choice (`as`). A wrapper <div> between an
 *      <ol> and its <li> children breaks the list for screen readers and makes
 *      `first:`/`last:` match every row — the bug that once collapsed the
 *      booking steps. Inside a list, pass the list item itself.
 *
 * Use it sparingly. The page has one authored motion moment — the implant
 * figure assembling as it is scrolled — and reveals are the quiet supporting
 * layer under it: section headings and short lists, not every paragraph.
 */

/** Elements a single reveal may render as. Extend deliberately. */
type RevealTag = 'div' | 'li' | 'article' | 'figure' | 'section' | 'header';
/** Elements a stagger container may render as — the list owners. */
type RevealGroupTag = 'div' | 'ol' | 'ul' | 'dl';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility. A scroll-linked reveal is positioned by
   *  scroll, not by time, so a delay has nothing to delay. */
  delay?: number;
  as?: RevealTag;
}

export function Reveal({ children, className, as: Tag = 'div' }: RevealProps) {
  return <Tag className={cn('reveal', className)}>{children}</Tag>;
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility; the stagger comes from each item's index. */
  stagger?: number;
  delayChildren?: number;
  as?: RevealGroupTag;
}

/** The list owner. Renders the element; the items carry the motion. */
export function RevealGroup({ children, className, as: Tag = 'div' }: RevealGroupProps) {
  return <Tag className={className}>{children}</Tag>;
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  /** Position in the group. Offsets the reveal range so siblings that enter
   *  together settle in order. Capped, so a long list does not trail. */
  index?: number;
  as?: RevealTag;
}

export function RevealItem({ children, className, index = 0, as: Tag = 'div' }: RevealItemProps) {
  const style = { '--reveal-i': Math.min(index, 4) } as CSSProperties;
  return (
    <Tag className={cn('reveal', className)} style={style}>
      {children}
    </Tag>
  );
}
