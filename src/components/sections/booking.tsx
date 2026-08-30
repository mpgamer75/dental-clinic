import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Section } from '@/components/primitives/section';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import type { homeContent } from '@/lib/data';

type Booking = (typeof homeContent)['es']['booking'];

interface BookingSectionProps {
  id?: string;
  content: Booking;
  appointmentHref: string;
  phone: string;
  schedule: string;
}

/**
 * Conversion band.
 *
 * Drenched so it reads as the page's terminal action, and states what actually
 * happens after the form is submitted — the main reason people hesitate to send
 * one is not knowing whether it commits them to anything.
 */
export function BookingSection({
  id,
  content,
  appointmentHref,
  phone,
  schedule,
}: BookingSectionProps) {
  const tel = `tel:${phone.replace(/[^\d+]/g, '')}`;

  return (
    <Section id={id} tone="drench" space="loose">
      <div className="grid gap-x-[6%] gap-y-12 lg:col-span-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <h2 className="font-heading text-h2 font-medium text-drench-on">
              {content.title}
            </h2>
            <p className="mt-5 max-w-measure text-body leading-relaxed text-drench-on/80">
              {content.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl" variant="brass">
                <Link href={appointmentHref}>{content.ctaPrimary}</Link>
              </Button>
              <Button asChild size="xl" variant="onDrench">
                <a href={tel}>
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  {content.ctaCall}
                </a>
              </Button>
            </div>

            <p className="mt-5 text-sm text-drench-on/65">{content.reassurance}</p>
            <p className="mt-2 text-sm text-drench-on/65">{schedule}</p>
          </Reveal>
        </div>

        {/* What happens next — an ordered process, so numbers are load-bearing
            here rather than decorative section markers.

            The rows are `RevealItem as="li"`, not `<Reveal>` wrapped around an
            `<li>`. The wrapper version put a div between the `<ol>` and its
            rows, which cost the list its semantics *and* made every row the
            only child of its own wrapper — so `last:pb-0` matched all four and
            the steps rendered flush with no separation at all. */}
        <div className="lg:col-span-6 lg:col-start-7">
          <RevealGroup as="ol" stagger={0.07} className="relative">
            {content.steps.map((s, i) => (
              <RevealItem
                key={s.title}
                as="li"
                className="relative grid grid-cols-[auto_1fr] gap-x-5 pb-9 last:pb-0"
              >
                {/* Connector rail between steps. */}
                {i < content.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[1.375rem] top-11 h-[calc(100%-2.75rem)] w-px bg-drench-on/20"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="relative z-raised flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brass/40 bg-drench-deep font-heading text-lg font-medium text-brass tabular"
                >
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-heading text-h4 font-medium text-drench-on">{s.title}</h3>
                  <p className="mt-1.5 max-w-measure leading-relaxed text-drench-on/70">
                    {s.desc}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </Section>
  );
}
