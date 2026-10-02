import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';
import { TestimonialDialog } from '@/components/testimonial-dialog';
import type { Testimonial } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TestimonialsSectionProps {
  id: string;
  title: string;
  description: string;
  testimonials: Testimonial[];
  /** Null when the clinic has switched new testimonials off. */
  dialog: null | {
    ctaButton: string;
    title: string;
    description: string;
    closeLabel: string;
  };
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/**
 * Patient testimonials — rendered only when there is one to show.
 *
 * The band used to render regardless, so with nothing approved (or the
 * database slow to wake during a rebuild) every visitor read "Todavía no hay
 * testimonios" or "No pudimos cargar los testimonios" in the middle of the
 * page's case for trust. An empty or failed load now renders NOTHING here; the
 * invitation to past patients lives in the doctor band instead.
 *
 * The first testimonial is set as a pull quote; the rest sit in a denser grid.
 */
export function TestimonialsSection({ id, title, description, testimonials, dialog }: TestimonialsSectionProps) {
  if (testimonials.length === 0) return null;

  const [featured, ...rest] = testimonials;

  return (
    <Section id={id} tone="surface" space="normal">
      <SectionHeading title={title} description={description} align="left" className="lg:col-span-6" />

      <Reveal as="figure" className="m-0 border-y border-line py-9">
        <blockquote className="font-heading text-h3 font-normal text-ink">
          <p className="max-w-[38ch]">&ldquo;{featured.quote}&rdquo;</p>
        </blockquote>
        <figcaption className="mt-6 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-soft font-body text-sm font-semibold text-brass-ink"
          >
            {getInitials(featured.name)}
          </span>
          <span>
            <span className="block font-medium text-ink">{featured.name}</span>
            {featured.location && <span className="block text-sm text-ink-soft">{featured.location}</span>}
          </span>
        </figcaption>
      </Reveal>

      {rest.length > 0 && (
        <RevealGroup
          className={cn(
            'mt-10 grid gap-x-10 gap-y-9',
            rest.length > 1 && 'sm:grid-cols-2',
            rest.length > 2 && 'lg:grid-cols-3',
          )}
        >
          {rest.map((testimonial, index) => (
            <RevealItem key={`${testimonial.name}-${index}`} as="figure" index={index} className="m-0 h-full border-t border-line pt-6">
              <blockquote className="leading-relaxed text-ink-soft">
                <p>&ldquo;{testimonial.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-medium text-ink">{testimonial.name}</span>
                {testimonial.location && <span className="text-ink-soft"> · {testimonial.location}</span>}
              </figcaption>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      {dialog && (
        <div className="mt-11">
          <TestimonialDialog
            triggerLabel={dialog.ctaButton}
            title={dialog.title}
            description={dialog.description}
            closeLabel={dialog.closeLabel}
          />
        </div>
      )}
    </Section>
  );
}
