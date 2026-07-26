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
            'mb-3 font-body text-small font-medium text-brass-ink',
            centered && 'mx-auto',
          )}
        >
          {lead}
        </p>
      )}
      {/* The heading takes the full content track. A display serif at this size
          holds only ~25–35 characters per line, so it does not need the prose
          measure — capping it at the same width as body copy is what makes
          headings look timid. */}
      <Tag className={cn('font-heading text-h2 font-medium text-ink', titleClassName)}>
        {title}
      </Tag>
      {description && (
        <p
          className={cn(
            'mt-4 text-body leading-relaxed text-ink-soft',
            centered ? 'mx-auto max-w-measure' : 'max-w-measure',
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
