import { Reveal } from '@/components/reveal';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
  titleClassName?: string;
}

/**
 * Shared section header — one consistent type rhythm + scroll-reveal across
 * every section. Headings inherit the heading font via the global base layer.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
  titleClassName,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <Reveal className={cn('mb-12 md:mb-16', centered && 'text-center', className)}>
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-highlight/30 bg-highlight/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-highlight">
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'text-3xl font-bold text-primary md:text-4xl lg:text-[2.6rem] lg:leading-[1.1]',
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-lg leading-relaxed text-muted-foreground',
            centered && 'mx-auto max-w-2xl',
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
