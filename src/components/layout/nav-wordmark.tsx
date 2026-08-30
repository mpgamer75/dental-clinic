'use client';

import Image from 'next/image';
import Link from 'next/link';

import { navStrings } from '@/lib/data';
import type { Language } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NavWordmarkProps {
  lang: Language;
  href: string;
  /** Marks the home route, not an in-page anchor. */
  current?: boolean;
  onClick?: () => void;
  /**
   * Shows the descriptor beside the name behind a hairline. Only true where
   * there is genuinely room for it — see the note on optical lines below.
   */
  withTagline?: boolean;
  className?: string;
}

/**
 * The masthead — the one element in the bar carried at full ink weight.
 *
 * It reads as a single optical line. The previous lockup stacked the name over
 * a descriptor inside a 4.25rem bar, which put two type sizes, two colours and
 * a 0.7rem line into a 68px-tall strip; at that size the second line is not
 * read, it is only registered as clutter under the name. Setting the descriptor
 * *beside* the name behind a hairline keeps the information and returns the
 * lockup to one line — and the hairline is the same device the bar uses to
 * fence its utilities, so the header has one idea rather than three.
 *
 * `min-w-0` + `truncate` rather than `shrink-0`: at 320px the mark, the name
 * and the controls together exceeded the viewport and pushed the page into
 * horizontal scroll. The name is the right thing to give way — the controls
 * keep their full 44px hit targets.
 */
export function NavWordmark({
  lang,
  href,
  current,
  onClick,
  withTagline = false,
  className,
}: NavWordmarkProps) {
  const t = navStrings[lang];

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'group/mark flex min-w-0 items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        className,
      )}
    >
      <span className="relative h-[1.9rem] w-[1.9rem] shrink-0">
        <Image
          src="/images/logo_valerio.png"
          alt=""
          fill
          className="object-contain dark:brightness-0 dark:invert"
          priority
          sizes="34px"
        />
      </span>

      <span className="truncate font-heading text-[1.14rem] font-medium leading-[1.18] tracking-[-0.012em] text-ink transition-colors duration-fast ease-out-quart group-hover/mark:text-primary">
        Orthoprotesis
      </span>

      {withTagline && (
        <>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px shrink-0 bg-line min-[1700px]:block"
          />
          {/* `ink-soft`, not `ink-faint`: measured against this canvas the faint
              step is 3.58:1, which is fine for an icon (1.4.11 wants 3:1) and
              short of the 4.5:1 that real text needs. Size and case demote the
              descriptor here — colour does not have to. */}
          <span className="hidden whitespace-nowrap text-eyebrow uppercase text-ink-soft min-[1700px]:block">
            {t.tagline}
          </span>
        </>
      )}
    </Link>
  );
}
