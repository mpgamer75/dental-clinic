import { Reveal } from '@/components/reveal';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
  titleClassName?: string;
  /** Renders as <h1> on the one section that owns the page's top-level heading. */
  as?: 'h1' | 'h2';
  /**
   * Optional short lead-in, rendered inline as a sentence rather than as a
   * tracked uppercase chip. Use it when the section genuinely needs framing —
   * not on every band.
   */
  lead?: string;
}

/**
 * Section header.
 *
 * Deliberately has no "eyebrow" prop. A tiny uppercase tracked label above
 * every section is the single most recognisable AI-template tell; the previous
 * version applied one to all six homepage sections. Framing, where a section
 * actually needs it, is carried by `lead` as real prose.
 */
export function SectionHeading({
  title,
  description,
  align = 'left',
  className,
  titleClassName,
  as: Tag = 'h2',
  lead,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <Reveal className={cn('mb-10 md:mb-14', centered && 'text-center', className)}>
      {lead && (
        <p
          className={cn(
            'mb-3 font-body text-sm font-medium text-brass-ink',
            centered && 'mx-auto',
          )}
        >
          {lead}
        </p>
      )}
      <Tag
        className={cn(
          'font-heading text-[clamp(1.9rem,4.4vw,3.1rem)] font-medium text-ink',
          centered ? 'mx-auto max-w-3xl' : 'max-w-3xl',
          titleClassName,
        )}
      >
        {title}
      </Tag>
      {description && (
        <p
          className={cn(
            'mt-4 text-lg leading-relaxed text-ink-soft',
            centered ? 'mx-auto max-w-measure' : 'max-w-measure',
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
