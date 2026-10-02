import Link from 'next/link';
import { Phone } from 'lucide-react';

import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Section } from '@/components/primitives/section';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import type { homeContent } from '@/lib/data';
import type { Language } from '@/lib/types';

type Booking = (typeof homeContent)['es']['booking'];

interface BookingSectionProps {
  id?: string;
  lang: Language;
  content: Booking;
  appointmentHref: string;
  schedule: string;
}

/**
 * The ask — and now the last thing the page says.
 *
 * It used to be followed by a general contact form, a map and a long footer,
 * so the page ended on "¿Listo para mejorar tu sonrisa?" instead of on the
 * reassurance that sending a request commits nobody to anything. Peak-end: the
 * final band before the footer is the one people remember, so it is this one.
 *
 * States what actually happens after the form is sent — not knowing whether
 * it commits them to anything is the main reason people hesitate.
 */
export function BookingSection({ id, lang, content, appointmentHref, schedule }: BookingSectionProps) {
  const links = contactLinkLabels(lang);

  return (
    <Section id={id} tone="drench" space="loose">
      <div className="grid gap-x-[6%] gap-y-12 lg:col-span-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <h2 className="font-heading text-h2 font-medium text-drench-on">{content.title}</h2>
            <p className="mt-5 max-w-measure text-body leading-relaxed text-drench-on/80">
              {content.description}
            </p>
          </Reveal>

          <div className="mt-9 flex flex-col gap-3 sm:max-w-md">
            <Button asChild size="xl" variant="brass">
              <Link href={appointmentHref}>{content.ctaPrimary}</Link>
            </Button>
            {/* The two direct channels, as a pair under the main action rather
                than two more equal buttons beside it. */}
            <div className="grid grid-cols-2 gap-3">
              <Button asChild size="lg" variant="onDrench">
                <a href={TEL_HREF} aria-label={links.callAria}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {content.ctaCall}
                </a>
              </Button>
              <Button asChild size="lg" variant="onDrench">
                <a href={whatsappHref(lang)} aria-label={links.whatsappAria} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-4 w-4" />
                  {content.ctaWhatsapp}
                </a>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-small text-drench-on/75">{content.reassurance}</p>
          <p className="mt-1.5 text-small text-drench-on/75">{schedule}</p>
        </div>

        {/* What happens next — an ordered process, so the numbers carry
            meaning. Rows are the list items themselves (`as="li"`): a wrapper
            div between <ol> and <li> cost the list its semantics and made
            `last:pb-0` match every row. */}
        <div className="lg:col-span-6 lg:col-start-7">
          <RevealGroup as="ol" className="relative">
            {content.steps.map((step, index) => (
              <RevealItem
                key={step.title}
                as="li"
                index={index}
                className="relative grid grid-cols-[auto_1fr] gap-x-5 pb-9 last:pb-0"
              >
                {index < content.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[1.375rem] top-11 h-[calc(100%-2.75rem)] w-px bg-drench-on/20"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-raised flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brass/40 bg-drench-deep font-heading text-lg font-medium text-brass-lift tabular"
                >
                  {index + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-heading text-h4 font-medium text-drench-on">{step.title}</h3>
                  <p className="mt-1.5 max-w-measure leading-relaxed text-drench-on/75">{step.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </Section>
  );
}
