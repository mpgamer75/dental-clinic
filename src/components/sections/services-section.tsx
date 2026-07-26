'use client';

import type { Service } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { generalUiStrings } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { DENTAL_ICONS, ToothIcon, type DentalIconName } from '@/components/icons/dental';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';

interface ServicesSectionProps {
  id: string;
  title: string;
  description: string;
  servicesList: Service[];
  lead?: string;
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
}: ServicesSectionProps) {
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ui = generalUiStrings[lang];
  const appointmentsHref = `/${lang}/agendar-cita`;

  return (
    <Section id={id} tone="canvas">
      <SectionHeading lead={lead} title={title} description={description} align="left" />

      <RevealGroup className="grid gap-x-12 sm:grid-cols-2">
        {servicesList.map((service) => {
          const Icon =
            DENTAL_ICONS[service.iconName as DentalIconName] ?? ToothIcon;
          const isOpen = expanded[service.title] ?? false;
          const isLong = service.description.length > MAX_CHARS_BEFORE_TRUNCATE;
          const panelId = `svc-${service.title.replace(/\W+/g, '-').toLowerCase()}`;

          return (
            <RevealItem key={service.title}>
              <article className="border-t border-line py-7">
                <div className="flex items-start gap-4">
                  <Icon className="mt-0.5 h-8 w-8 shrink-0 text-brass-ink" strokeWidth={1.4} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-xl font-medium text-ink">
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
                        className="mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-terracotta underline-offset-4 transition-colors duration-fast hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  </div>
                </div>
              </article>
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
