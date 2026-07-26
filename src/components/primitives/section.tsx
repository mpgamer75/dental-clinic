import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Tone = 'canvas' | 'sunk' | 'surface' | 'drench' | 'drench-deep';

const TONE: Record<Tone, string> = {
  canvas: 'bg-canvas text-ink',
  sunk: 'bg-canvas-sunk text-ink',
  surface: 'bg-surface text-ink',
  drench: 'drenched',
  'drench-deep': 'drenched-deep',
};

interface SectionProps {
  id?: string;
  children: ReactNode;
  /** Surface colour. `drench` bands are where colour carries the page. */
  tone?: Tone;
  /** Vertical rhythm. Vary this between sections — uniform spacing reads flat. */
  space?: 'tight' | 'normal' | 'none';
  /** Adds the plaster grain overlay. Only meaningful on canvas/drench tones. */
  grain?: boolean;
  className?: string;
  /** Container width. `wide` for grids, `prose` for reading. */
  width?: 'default' | 'wide' | 'prose';
}

const WIDTH: Record<NonNullable<SectionProps['width']>, string> = {
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  prose: 'max-w-3xl',
};

/**
 * Section shell: owns surface tone, vertical rhythm and the content measure.
 *
 * Replaces the old global `section { @apply py-12 … }` base rule, which
 * double-padded any nested section and gave every band identical spacing.
 * Rhythm is now explicit per section so it can actually vary.
 */
export function Section({
  id,
  children,
  tone = 'canvas',
  space = 'normal',
  grain = false,
  className,
  width = 'default',
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative isolate',
        TONE[tone],
        space === 'normal' && 'py-section',
        space === 'tight' && 'py-section-tight',
        grain && 'grain',
        className,
      )}
    >
      <div className={cn('relative z-raised mx-auto w-full px-5 sm:px-8', WIDTH[width])}>
        {children}
      </div>
    </section>
  );
}
