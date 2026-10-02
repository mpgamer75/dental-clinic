import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

import { DENTAL_ICONS, ToothIcon, type DentalIconName } from '@/components/icons/dental';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import type { contactDetails } from '@/lib/data';
import type { Service } from '@/lib/types';

type ServicesCopy = (typeof contactDetails.servicesSection)['es'];

interface ServicesSectionProps {
  id: string;
  copy: ServicesCopy;
  /** Description with `{{doctorName}}` already filled. */
  description: string;
  services: Service[];
  implantGuideHref: string;
}

/**
 * What the practice does, in two tiers.
 *
 * Eight services used to sit in one grid at one weight, each truncated to
 * three lines behind a "Leer Más" toggle — the template every clinic site
 * ships, and the reason implants (the practice's priority) read as one option
 * in eight. Now the three specialties are an editorial index with their full
 * summary, and general dentistry is a compact list under them.
 *
 * The long descriptions are behind native <details>, not a scripted toggle:
 * no JavaScript, Ctrl+F still finds text inside a closed one, and the open
 * state is announced by every screen reader. A server component — the old one
 * was a client component only to hold eight booleans of toggle state.
 */
export function ServicesSection({ id, copy, description, services, implantGuideHref }: ServicesSectionProps) {
  const specialties = services.filter((service) => service.specialty);
  const general = services.filter((service) => !service.specialty);

  return (
    <Section id={id} tone="canvas" space="normal">
      <SectionHeading title={copy.title} description={description} align="left" className="lg:col-span-7" />

      <h3 className="font-body text-small font-semibold text-brass-ink">{copy.specialtiesTitle}</h3>
      <RevealGroup as="ul" className="mt-4 border-t border-line-strong">
        {specialties.map((service, index) => (
          <RevealItem key={service.key} as="li" index={index} className="border-b border-line py-7 md:py-8">
            <div className="grid gap-x-[5%] gap-y-3 md:grid-cols-12 md:items-baseline">
              <div className="flex items-center gap-4 md:col-span-4">
                <ServiceIcon service={service} className="h-9 w-9" />
                <h4 className="font-heading text-h3 font-medium text-ink">{service.title}</h4>
              </div>
              <div className="md:col-span-5">
                <p className="max-w-measure leading-relaxed text-ink-soft">{service.summary}</p>
                {/* Implants get the guide — six pages of it — instead of a
                    paragraph: that is where the real answer lives. */}
                {service.key !== 'implants' && <DetailsBody service={service} label={copy.moreLabel} />}
              </div>
              {service.key === 'implants' && (
                <div className="md:col-span-3 md:justify-self-end">
                  <Link
                    href={implantGuideHref}
                    className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {copy.implantGuide}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      <h3 className="mt-[clamp(3rem,6vw,4.5rem)] font-body text-small font-semibold text-brass-ink">
        {copy.generalTitle}
      </h3>
      <ul className="mt-4 grid gap-x-[5%] border-t border-line-strong sm:grid-cols-2">
        {general.map((service) => (
          <li key={service.key} className="border-b border-line py-5">
            <details className="disclosure group">
              <summary className="flex items-start gap-3.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <ServiceIcon service={service} className="mt-0.5 h-7 w-7" />
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-h4 font-medium text-ink">{service.title}</span>
                  <span className="mt-1 block leading-relaxed text-ink-soft">{service.summary}</span>
                </span>
                <ChevronDown
                  className="disclosure-chevron mt-1.5 h-5 w-5 shrink-0 text-ink-soft"
                  aria-hidden="true"
                />
              </summary>
              <p className="disclosure-body mt-3 max-w-measure pl-[2.65rem] text-small leading-relaxed text-ink-soft">
                {service.description}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ServiceIcon({ service, className }: { service: Service; className: string }) {
  const Icon = DENTAL_ICONS[service.iconName as DentalIconName] ?? ToothIcon;
  return <Icon className={`${className} shrink-0 text-brass-ink`} strokeWidth={1.4} aria-hidden="true" />;
}

function DetailsBody({ service, label }: { service: Service; label: string }) {
  return (
    <details className="disclosure mt-2">
      <summary className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-small font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        {label}
        <span className="sr-only">: {service.title}</span>
        <ChevronDown className="disclosure-chevron h-4 w-4" aria-hidden="true" />
      </summary>
      <p className="disclosure-body mt-2 max-w-measure leading-relaxed text-ink-soft">{service.description}</p>
    </details>
  );
}
