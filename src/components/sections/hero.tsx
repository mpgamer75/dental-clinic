import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImplantSequence } from '@/components/implant/implant-sequence';
import type { homeContent } from '@/lib/data';

type Hero = (typeof homeContent)['es']['hero'];

interface HeroProps {
  content: Hero;
  trust: { value: string; label: string }[];
  appointmentHref: string;
  implantHref: string;
  phone: string;
}

/**
 * Hero: the implant going in, scrubbed by scroll on a graphite band.
 *
 * This replaced a navy band with a photograph of the reception and the plaza's
 * address over the headline. That composition was the same one the fashion
 * boutique two doors down uses, and the photograph was too low-resolution to
 * carry a full-height band. The clinic's subject is the implant, so the hero
 * now shows one going in.
 *
 * The copy stays a server component and is handed to the client sequence as
 * children, so the headline and both actions are in the first HTML with
 * nothing to hydrate. The address moved to the visit section, where a visitor
 * looking for directions expects it.
 */
export function Hero({ content, trust, appointmentHref, implantHref, phone }: HeroProps) {
  const years = trust[0];

  return (
    <section className="drenched-deep relative isolate">
      <ImplantSequence
        alt={content.sequence.alt}
        scrollHint={content.sequence.scrollHint}
        phases={content.sequence.phases}
      >
        <h1 className="max-w-[14ch] font-heading text-[clamp(1.85rem,5.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-drench-on">
          {content.title}
        </h1>

        <p className="mt-3 max-w-[40ch] text-small leading-relaxed text-drench-on/75 sm:text-body lg:mt-6">
          {content.standfirst}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-8">
          <Button asChild size="lg" variant="brass">
            <Link href={appointmentHref}>{content.ctaPrimary}</Link>
          </Button>
          <Button asChild size="lg" variant="onDrench" className="hidden sm:inline-flex">
            <Link href={implantHref}>{content.ctaSecondary}</Link>
          </Button>
        </div>

        {/* One hard fact and the direct line, on one row. On a phone this is
            the hero's only call action, so it keeps a 44px target. */}
        <div className="mt-5 hidden flex-wrap items-center gap-x-6 gap-y-1 text-small text-drench-on/70 sm:flex">
          {years && (
            <span>
              <span className="tabular font-semibold text-drench-on">{years.value}</span>{' '}
              {years.label}
            </span>
          )}
          <a
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 transition-colors duration-fast hover:text-drench-on hover:underline"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="tabular">{phone}</span>
          </a>
        </div>
      </ImplantSequence>
    </section>
  );
}
