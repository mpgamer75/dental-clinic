import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Tone = 'canvas' | 'sunk' | 'surface' | 'tint' | 'drench' | 'drench-deep';

const TONE: Record<Tone, string> = {
  canvas: 'bg-canvas text-ink',
  sunk: 'bg-canvas-sunk text-ink',
  surface: 'bg-surface text-ink',
  /* The one *coloured* band that is not drenched.
     `--primary-soft` is the brand tint, and it is authored as a tonal fill in
     both themes — a warm blush at L 0.93 in light, a deep terracotta at L 0.31
     in dark — so it takes the ordinary `--ink` ramp on top and needs none of
     the on-colour overrides a drenched band does. That is what makes it usable
     on a section full of body copy, hairlines and a white figure card, where a
     drenched band would have required re-toning every token inside it. */
  tint: 'bg-terracotta-soft text-ink',
  drench: 'drenched',
  'drench-deep': 'drenched-deep',
};

const SPACE = {
  none: '',
  tight: 'py-section-tight',
  normal: 'py-section',
  loose: 'py-section-loose',
} as const;

interface SectionProps {
  id?: string;
  children: ReactNode;
  /**
   * Surface colour. `drench` bands are where colour carries the page; `tint`
   * is the lighter-weight way to mark a band as important without spending a
   * full drench on it. VARY this — a run of three identical bands undoes the
   * whole strategy.
   */
  tone?: Tone;
  /** Vertical rhythm. VARY this between sections — uniform spacing reads flat. */
  space?: keyof typeof SPACE;
  /** Adds the plaster grain overlay. Only meaningful on canvas/drench tones. */
  grain?: boolean;
  className?: string;
  /** Extra classes on the inner grid, e.g. row gaps. */
  shellClassName?: string;
}

/**
 * Section shell: owns surface tone, vertical rhythm, and the page's one
 * horizontal grid.
 *
 * The inner element is `.shell` (see globals.css), a named-line breakout grid.
 * Children land on the `content` track (68ch) unless they opt into a wider one
 * with `col-popout` / `col-feature` / `col-wide` / `col-full`, or an asymmetric
 * span with `col-lead` / `col-trail`.
 *
 * This replaces a single centered `max-w-6xl` div. That shell had two faults at
 * once, measured: at 2560px it used 48% of the viewport, while the prose inside
 * it already ran 88–90 characters — past the 80ch WCAG ceiling. Widening it
 * would have made the text worse; narrowing it would have wasted more screen.
 * A breakout grid is the only thing that fixes both, because the measure and
 * the page width stop being the same number.
 *
 * The corollary, which matters more than the grid: DO NOT give every band the
 * same span. Identical spans at a wider measure is the same stack, just bigger.
 */
export function Section({
  id,
  children,
  tone = 'canvas',
  space = 'normal',
  grain = false,
  className,
  shellClassName,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn('relative isolate', TONE[tone], SPACE[space], grain && 'grain', className)}
    >
      {/* No `w-full` here. Tailwind utilities are emitted after the components
          layer, so `w-full` beat `.shell`'s own
          `width: min(100% - gap*2, --shell-max)` and the grid ran edge to edge
          with no gutters at all. */}
      <div className={cn('shell relative z-raised', shellClassName)}>{children}</div>
    </section>
  );
}
