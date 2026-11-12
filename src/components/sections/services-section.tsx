'use client';

import type { Service } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { generalUiStrings } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { DENTAL_ICONS, ToothIcon, type DentalIconName } from '@/components/icons/dental';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';
import SpotlightCard from '@/components/reactbits/spotlight-card';

interface ServicesSectionProps {
  id: string;
  title: string;
  description: string;
  servicesList: Service[];
  lead?: string;
  /** Where the implants card sends a visitor who wants to read more. */
  implantGuide?: { href: string; label: string };
}

const MAX_CHARS_BEFORE_TRUNCATE = 200;

/**
 * Service list.
 *
 * Demoted from a grid of identical bordered cards to a ruled two-column list:
 * on this page implants and prosthetics are the argument, and the remaining
 * services are supporting detail. Giving all eight equal visual weight was
 * flattening that hierarchy.
 */
export function ServicesSection({
  id,
  title,
  description,
  servicesList,
  lead,
  implantGuide,
}: ServicesSectionProps) {
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ui = generalUiStrings[lang];
  const appointmentsHref = `/${lang}/agendar-cita`;

  /* Implants first and twice as wide: they are the practice's priority, and
     a grid where all eight weigh the same was hiding that. Matched on the
     icon, which is language-independent, rather than on the title. */
  const ordered = [...servicesList].sort(
    (a, b) => Number(b.iconName === 'Scan') - Number(a.iconName === 'Scan'),
  );

  return (
    <Section id={id} tone="canvas" space="normal">
      <SectionHeading
        lead={lead}
        title={title}
        description={description}
        align="left"
        className="lg:col-span-6"
      />

      <RevealGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ordered.map((service, index) => {
          const Icon =
            DENTAL_ICONS[service.iconName as DentalIconName] ?? ToothIcon;
          const isOpen = expanded[service.title] ?? false;
          const isLong = service.description.length > MAX_CHARS_BEFORE_TRUNCATE;
          const panelId = `svc-${service.title.replace(/\W+/g, '-').toLowerCase()}`;

          return (
            <RevealItem
              key={service.title}
              className={cn(index === 0 && 'sm:col-span-2 xl:col-span-2')}
            >
              {/* A faint blue light follows the pointer across the card: the
                  one place the page answers a hover with colour. It only moves
                  under a fine pointer, and it is a gradient on a card, not a
                  shadow or a filter, so nothing heavier than a repaint of one
                  card runs per frame. */}
              <SpotlightCard
                theme="light"
                spotlightColor="oklch(var(--primary-base) / 0.10)"
                intensity={0.6}
                className="h-full rounded-xl border border-line"
              >
              <article className={cn('p-6', index === 0 && 'lg:p-8')}>
                <div className="flex items-start gap-4">
                  <Icon className="mt-0.5 h-8 w-8 shrink-0 text-brass-ink" strokeWidth={1.4} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-h4 font-medium text-ink">
                      {service.title}
                    </h3>

                    <p
                      id={panelId}
                      className={cn(
                        'mt-2 max-w-measure leading-relaxed text-ink-soft',
                        isLong && !isOpen && 'line-clamp-3',
                      )}
                    >
                      {service.description}
                    </p>

                    {isLong && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((p) => ({ ...p, [service.title]: !p[service.title] }))
                        }
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        // `-my-3 py-3` grows the hit area to ~45px without
                        // moving anything: the rendered control was 86×21,
                        // under the 24px WCAG 2.2 AA minimum, on a site whose
                        // patients skew older.
                        className="-my-3 mt-3 inline-flex items-center gap-1.5 rounded py-3 text-small font-medium text-primary underline-offset-4 transition-colors duration-fast hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {isOpen ? ui.readLess : ui.readMore}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform duration-base ease-out-quart',
                            isOpen && 'rotate-180',
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    )}

                    {/* Implants are the practice's priority and have a full
                        guide (candidacy, surgery, healing, cost, risks), so
                        this card is the one that leads somewhere instead of
                        only expanding in place. */}
                    {index === 0 && service.iconName === 'Scan' && implantGuide && (
                      <Link
                        href={implantGuide.href}
                        className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-primary underline-offset-4 transition-colors duration-fast hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {implantGuide.label}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
              </SpotlightCard>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Reveal className="mt-11">
        <Button asChild size="lg">
          <Link href={appointmentsHref}>{ui.appointments}</Link>
        </Button>
      </Reveal>
    </Section>
  );
}
