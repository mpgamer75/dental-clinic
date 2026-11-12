import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

import { DENTAL_ICONS, ToothIcon, type DentalIconName } from '@/components/icons/dental';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import SpotlightCard from '@/components/reactbits/spotlight-card';
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
 * in eight. Now the three specialties are three cards with their full summary
 * — implants the filled one — and general dentistry is a compact list under
 * them.
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
      {/* Three cards, and they are not equal. Implants are the practice's
          priority, so that card is the one filled with the brand blue and the
          one that leads somewhere — to the guide, six pages of it, which is
          where the real answer lives. The other two answer the pointer with a
          faint light and keep their long description behind a disclosure. */}
      <RevealGroup as="ul" className="mt-4 grid gap-4 lg:grid-cols-3">
        {specialties.map((service, index) => (
          <RevealItem key={service.key} as="li" index={index} className="h-full">
            {service.key === 'implants' ? (
              <div className="drenched relative isolate flex h-full flex-col overflow-hidden rounded-2xl p-7 shadow-e3 md:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1/4 -top-1/2 -z-10 h-[150%] w-[90%]"
                  style={{
                    backgroundImage:
                      'radial-gradient(closest-side, oklch(var(--primary-base) / 0.7), oklch(var(--primary-base) / 0))',
                  }}
                />
                <ServiceIcon service={service} className="h-10 w-10" tone="text-brass-lift" />
                <h4 className="mt-6 font-heading text-h3 font-semibold text-drench-on">{service.title}</h4>
                <p className="mt-3 leading-relaxed text-drench-on/80">{service.summary}</p>
                <Link
                  href={implantGuideHref}
                  className="group/guide mt-auto inline-flex min-h-11 items-center gap-2 pt-6 font-medium text-drench-on underline-offset-[6px] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-lift focus-visible:ring-offset-2 focus-visible:ring-offset-drench"
                >
                  {copy.implantGuide}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-base ease-out-quart group-hover/guide:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            ) : (
              <SpotlightCard
                theme="light"
                spotlightColor="oklch(var(--primary-base) / 0.12)"
                intensity={0.7}
                className="h-full rounded-2xl"
              >
                <div className="flex h-full flex-col p-7 md:p-8">
                  <ServiceIcon service={service} className="h-10 w-10" />
                  <h4 className="mt-6 font-heading text-h3 font-semibold text-ink">{service.title}</h4>
                  <p className="mt-3 leading-relaxed text-ink-soft">{service.summary}</p>
                  <DetailsBody service={service} label={copy.moreLabel} />
                </div>
              </SpotlightCard>
            )}
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

function ServiceIcon({
  service,
  className,
  tone = 'text-brass-ink',
}: {
  service: Service;
  className: string;
  tone?: string;
}) {
  const Icon = DENTAL_ICONS[service.iconName as DentalIconName] ?? ToothIcon;
  return <Icon className={`${className} shrink-0 ${tone}`} strokeWidth={1.4} aria-hidden="true" />;
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
