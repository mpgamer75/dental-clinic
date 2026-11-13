import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Tone = 'canvas' | 'sunk' | 'surface' | 'tint' | 'drench' | 'drench-deep';

const TONE: Record<Tone, string> = {
  canvas: 'bg-canvas text-ink',
  sunk: 'bg-canvas-sunk text-ink',
  surface: 'bg-surface text-ink',
  /* The one *coloured* band that is not drenched.
     `--primary-soft` is the brand tint, and it is authored as a tonal fill in
     both themes — a pale wash at L 0.945 in light, a deep navy at L 0.305
     in dark — so it takes the ordinary `--ink` ramp on top and needs none of
     the on-colour overrides a drenched band does. That is what makes it usable
     on a section full of body copy, hairlines and a white figure card, where a
     drenched band would have required re-toning every token inside it. */
  tint: 'bg-primary-soft text-ink',
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
  /**
   * Draws the band as a sheet laid over the one before it: rounded top
   * corners, pulled up so the previous band's colour shows in the corners.
   *
   * Use it where a blue band meets a light one, in either direction. Those
   * joins used to be a hard horizontal line across the full width, the
   * strongest contrast on the page spent on a seam; a rounded sheet turns the
   * seam into an edge that belongs to something. Do NOT use it between two
   * light bands — a curve between two near-whites is invisible and only adds
   * an overlap to get wrong.
   *
   * The band before must not keep anything in its last 3rem: that strip is
   * covered. Every band's own vertical padding already guarantees it.
   */
  sheet?: boolean;
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
  sheet = false,
  className,
  shellClassName,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative isolate',
        TONE[tone],
        SPACE[space],
        grain && 'grain',
        sheet && '-mt-8 rounded-t-[2rem] sm:-mt-12 sm:rounded-t-[3rem]',
        className,
      )}
    >
      {/* No `w-full` here. Tailwind utilities are emitted after the components
          layer, so `w-full` beat `.shell`'s own
          `width: min(100% - gap*2, --shell-max)` and the grid ran edge to edge
          with no gutters at all. */}
      <div className={cn('shell relative z-raised', shellClassName)}>{children}</div>
    </section>
  );
}
