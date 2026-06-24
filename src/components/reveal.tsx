'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

// Gentle ease-out (easeOutQuint-ish) — calm, premium entrance.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VIEWPORT = { once: true, margin: '0px 0px -80px 0px' };

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to delay the animation. */
  delay?: number;
  /** Vertical offset (px) the content travels from. */
  y?: number;
}

/**
 * Scroll-reveal wrapper. Fades + lifts content as it enters the viewport.
 * Respects prefers-reduced-motion (renders static, fully visible, no transform).
 */
export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's entrance. */
  stagger?: number;
  /** Seconds before the first child animates. */
  delayChildren?: number;
}

/**
 * Staggered container — pair with <RevealItem> children for a sequenced
 * entrance (card grids, lists). Respects prefers-reduced-motion.
 */
export function RevealGroup({ children, className, stagger = 0.08, delayChildren = 0 }: RevealGroupProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren } },
      }}
    >
      {children}
    </motion.div>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  /** Vertical offset (px) the item travels from. */
  y?: number;
}

/** A single staggered child for use inside <RevealGroup>. */
export function RevealItem({ children, className, y = 24 }: RevealItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
