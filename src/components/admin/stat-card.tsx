import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* ============================================================================
   A STAT CARD THAT CANNOT LIE
   ----------------------------------------------------------------------------
   `value` and `caption` both come from `count(*)` over the whole table (see
   getDashboardCounts in _lib/queries.ts). Nothing on this card is ever derived
   from the length of a page of rows.

   That constraint has a name and a history. The panel this replaces read ten
   rows with a hard `.limit(10)` and printed "de 45 totales" underneath them:
   the 45 was true, the ten were a truncation, and the two numbers together
   invited exactly the wrong conclusion — that the ten were the interesting
   ones. Anything urgent that arrived eleventh was invisible.

   Hence `href`: every card is a way into the list it counts, filtered to the
   thing it is counting. A number nobody can act on is decoration.
   ========================================================================== */

export type StatTone = 'neutral' | 'attention' | 'alert';

const TONE = {
  neutral: {
    surface: 'border-line',
    chip: 'bg-canvas-sunk text-ink-soft',
    value: 'text-ink',
  },
  attention: {
    surface: 'border-brass/30',
    chip: 'bg-brass-soft text-brass-ink',
    value: 'text-ink',
  },
  /* Reserved for a count that means someone is waiting on the clinic right
     now. Deliberately rare: if every card shouts, none of them does. */
  alert: {
    surface: 'border-destructive/30',
    chip: 'bg-destructive/10 text-destructive',
    value: 'text-destructive',
  },
} satisfies Record<StatTone, { surface: string; chip: string; value: string }>;

export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  href,
  linkLabel,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  /** Always a sentence about a real count, never about `rows.length`. */
  caption: string;
  icon: LucideIcon;
  href: string;
  linkLabel: string;
  tone?: StatTone;
}) {
  const styles = TONE[tone];

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col rounded-xl border bg-surface p-5 shadow-e1',
        /* Transform and colour only. A `box-shadow` in this transition would
           make the browser re-rasterise a large blurred shadow on every frame
           of the lift, for four cards at once, which is the most expensive
           possible way to say "this is a link". The translate reads as depth on
           its own and runs on the compositor. */
        'transition-[border-color,transform] duration-base ease-out-quart',
        'hover:-translate-y-0.5 hover:border-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        styles.surface,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-eyebrow font-semibold uppercase tracking-[0.09em] text-ink-faint">
          {label}
        </span>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', styles.chip)}>
          <Icon className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
        </span>
      </div>

      <p className={cn('tabular mt-3 font-heading text-[2.4rem] leading-none', styles.value)}>
        {value}
      </p>

      <p className="mt-3 text-small text-ink-soft">{caption}</p>

      <span className="mt-4 inline-flex items-center gap-1.5 text-small font-medium text-primary">
        {linkLabel}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-fast ease-out-quart group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
