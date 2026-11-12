import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { TiltCard } from '@/components/tilt-card';
import type { implantEducation } from '@/lib/data';

type ImplantCopy = (typeof implantEducation)['es'];

interface GuideLink {
  href: string;
  label: string;
  summary: string;
}

interface ImplantEducationProps {
  id?: string;
  content: ImplantCopy;
  appointmentHref: string;
  /** The implant guide's pages, resolved on the server. */
  guide: { allHref: string; links: GuideLink[] };
}

/**
 * How an implant works: the parts, then the treatment, then where to read more.
 *
 * This band used to pin a second animated implant beside a scrolling legend —
 * the same object assembling in the same order as the film in the hero one
 * screen above it. Two pictures of one thing is one picture too many, and the
 * second cost a WebGL context to draw. What a visitor does not yet have after
 * the hero is the part the film cannot show: what each piece is FOR, and how
 * long the treatment takes. So this is now words and a timeline.
 *
 * A server component. The cards' tilt is the only script in it.
 */
export function ImplantEducation({ id = 'implantes', content, appointmentHref, guide }: ImplantEducationProps) {
  /* `tint`: the band the page most wants read, marked with the brand colour at
     tonal weight. Every token inside keeps its ordinary ink ramp on it. */
  return (
    <Section id={id} tone="tint" space="loose">
      <SectionHeading
        lead={content.eyebrow}
        title={content.title}
        description={content.description}
        align="left"
        className="lg:col-span-7"
      />

      {/* ── The parts ─────────────────────────────────────────────── */}
      <h3 className="font-body text-small font-semibold text-brass-ink">{content.partsTitle}</h3>
      <RevealGroup as="ol" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {content.parts.map((part, index) => (
          <RevealItem key={part.key} as="li" index={index} className="h-full">
            {/* The card leans towards the pointer and the render lifts off
                it (see <TiltCard>). The disc behind the render is its
                plinth: a pool of the brand blue it visibly rises out of. */}
            <TiltCard className="h-full rounded-2xl border border-line bg-surface">
              <div className="tilt-layer flex h-full flex-col p-6">
                <div className="tilt-layer flex items-start justify-between gap-4">
                  <span className="tilt-layer relative flex h-28 w-28 items-center justify-center">
                    <span aria-hidden="true" className="icon-plinth" />
                    {/* A render of the part itself, in the same light as the
                        hero film, on a transparent ground so it sits on the
                        card in either theme. Decorative: the heading names it. */}
                    <Image
                      src={`/images/icons/${part.key}.webp`}
                      alt=""
                      width={112}
                      height={112}
                      loading="lazy"
                      className="tilt-pop relative h-24 w-24 object-contain"
                    />
                  </span>
                  <span aria-hidden="true" className="tabular font-heading text-h4 font-semibold text-primary-border">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h4 className="mt-5 font-heading text-h4 font-semibold text-ink">{part.label}</h4>
                <p className="mt-2 leading-relaxed text-ink-soft">{part.desc}</p>
              </div>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* ── The treatment ─────────────────────────────────────────────
          A real sequence with real waiting in it, so it is drawn as a line
          with stops. The line fills as the row scrolls into view (a view
          timeline, in globals.css); where that is unsupported it is simply
          drawn whole. */}
      <div className="mt-[clamp(3.5rem,7vw,6rem)]">
        <h3 className="reveal font-heading text-h3 font-semibold text-ink">{content.stepsTitle}</h3>

        <div className="relative mt-10">
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-[1.3125rem] top-3 w-px bg-primary-border lg:bottom-auto lg:left-0 lg:right-[calc(25%-2.625rem)] lg:top-[1.3125rem] lg:h-px lg:w-auto"
          >
            <span className="journey-fill absolute inset-0 bg-primary" />
          </span>

          <ol className="relative grid gap-y-9 lg:grid-cols-4 lg:gap-x-8">
            {content.steps.map((step, index) => (
              <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-5 lg:block">
                <span
                  aria-hidden="true"
                  className="tabular flex h-[2.625rem] w-[2.625rem] items-center justify-center rounded-full border border-primary bg-primary-soft font-heading text-small font-semibold text-primary"
                >
                  {index + 1}
                </span>
                <div className="lg:mt-6 lg:pr-4">
                  <p className="inline-flex rounded-full bg-primary px-3 py-1 text-small font-medium text-primary-foreground">
                    {step.when}
                  </p>
                  <h4 className="mt-3 font-heading text-h4 font-semibold text-ink">{step.title}</h4>
                  <p className="mt-1.5 max-w-measure leading-relaxed text-ink-soft">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── Into the guide ────────────────────────────────────────────
          Price, All-on-4, immediate loading, bone grafts: exactly the
          questions a patient has after this section. */}
      <div className="mt-[clamp(3.5rem,7vw,6rem)] grid gap-x-[6%] gap-y-10 border-t border-line-strong pt-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h3 id="implant-guide-title" className="font-heading text-h3 font-semibold text-ink">
            {content.guideTitle}
          </h3>
          <Button asChild size="lg" className="mt-7">
            <Link href={appointmentHref}>{content.ctaLabel}</Link>
          </Button>
        </div>

        <nav aria-labelledby="implant-guide-title" className="lg:col-span-7 lg:col-start-6">
          <ul className="grid gap-x-10 border-t border-line-strong sm:grid-cols-2">
            {guide.links.map((link) => (
              <li key={link.href} className="border-b border-line-strong">
                <Link
                  href={link.href}
                  className="group/guide flex h-full items-start justify-between gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary-soft"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-ink transition-colors duration-fast group-hover/guide:text-primary">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-small leading-snug text-ink-soft">{link.summary}</span>
                  </span>
                  <ArrowRight
                    className="mt-1 h-4 w-4 shrink-0 text-brass-ink transition-transform duration-base ease-out-quart group-hover/guide:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={guide.allHref}
            className="mt-4 inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            {content.guideAll}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </Section>
  );
}
