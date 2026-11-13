import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

import { DENTAL_ICONS, ToothIcon, type DentalIconName } from '@/components/icons/dental';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { TiltCard } from '@/components/tilt-card';
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
  /** True when the band directly above is the blue diploma band — i.e. when
   *  there is no testimonials band between them — so this one is drawn as a
   *  sheet over it. */
  followsBlueBand?: boolean;
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
export function ServicesSection({
  id,
  copy,
  description,
  services,
  implantGuideHref,
  followsBlueBand = false,
}: ServicesSectionProps) {
  const specialties = services.filter((service) => service.specialty);
  const general = services.filter((service) => !service.specialty);

  return (
    <Section id={id} tone="canvas" space="normal" sheet={followsBlueBand}>
      <SectionHeading title={copy.title} description={description} align="left" className="lg:col-span-7" />

      <h3 className="font-body text-small font-semibold text-brass-ink">{copy.specialtiesTitle}</h3>
      {/* Three cards, and they are not equal. Implants are the practice's
          priority, so that card is the one filled with the brand blue and the
          one that leads somewhere — to the guide, six pages of it, which is
          where the real answer lives. All three lean towards the pointer with
          their render lifting off the surface (see <TiltCard>); the other two
          keep their long description behind a disclosure. */}
      <RevealGroup as="ul" className="mt-4 grid gap-4 lg:grid-cols-3">
        {specialties.map((service, index) => (
          <RevealItem key={service.key} as="li" index={index} className="h-full">
            {service.key === 'implants' ? (
              <TiltCard className="drenched h-full rounded-2xl shadow-e3">
                {/* The wash is clipped in its OWN box. Clipping the card
                    itself would flatten it and press the lifted render back
                    into the surface. */}
                <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[inherit]">
                  <span
                    className="absolute -right-1/4 -top-1/2 h-[150%] w-[90%]"
                    style={{
                      backgroundImage:
                        'radial-gradient(closest-side, oklch(var(--primary-base) / 0.7), oklch(var(--primary-base) / 0))',
                    }}
                  />
                </span>
                <div className="tilt-layer relative flex h-full flex-col p-7 md:p-8">
                  <SpecialtyRender serviceKey={service.key} onDrench />
                  <h4 className="mt-5 font-heading text-h3 font-semibold text-drench-on">{service.title}</h4>
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
              </TiltCard>
            ) : (
              <TiltCard className="h-full rounded-2xl border border-line bg-surface">
                <div className="tilt-layer relative flex h-full flex-col p-7 md:p-8">
                  <SpecialtyRender serviceKey={service.key} />
                  <h4 className="mt-5 font-heading text-h3 font-semibold text-ink">{service.title}</h4>
                  <p className="mt-3 leading-relaxed text-ink-soft">{service.summary}</p>
                  <DetailsBody service={service} label={copy.moreLabel} />
                </div>
              </TiltCard>
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

function ServiceIcon({ service, className }: { service: Service; className: string }) {
  const Icon = DENTAL_ICONS[service.iconName as DentalIconName] ?? ToothIcon;
  return <Icon className={`${className} shrink-0 text-brass-ink`} strokeWidth={1.4} aria-hidden="true" />;
}

/**
 * The three specialties get a render of the thing itself — an implant, a
 * bridge, a set of braces — in the same light as the hero film; general
 * dentistry below keeps the small line icons. The difference in weight is the
 * point: it is the page saying which three the practice specialises in.
 *
 * The files are named by service KEY (`public/images/icons/<key>.webp`), which
 * is stable; a title is not. Transparent, so one file serves the white cards,
 * the blue one and the dark theme. Decorative: the heading names the service.
 */
function SpecialtyRender({ serviceKey, onDrench = false }: { serviceKey: string; onDrench?: boolean }) {
  return (
    <span className="tilt-layer relative flex h-32 w-32 items-center justify-center">
      {/* The plinth: a pool of light the render rises out of when the card
          tilts. Paler on the blue card, where the brand blue would vanish. */}
      <span aria-hidden="true" className={onDrench ? 'icon-plinth icon-plinth-on-drench' : 'icon-plinth'} />
      <Image
        src={`/images/icons/${serviceKey}.webp`}
        alt=""
        width={128}
        height={128}
        loading="lazy"
        className="tilt-pop relative h-28 w-28 object-contain"
      />
    </span>
  );
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
