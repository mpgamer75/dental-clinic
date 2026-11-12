import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import SpotlightCard from '@/components/reactbits/spotlight-card';
import type { implantEducation } from '@/lib/data';

type ImplantCopy = (typeof implantEducation)['es'];
type PartKey = ImplantCopy['parts'][number]['key'];

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
 * A server component. The cards' pointer light is the only script in it.
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
            {/* A faint blue light follows the pointer across the card. A
                gradient on one card, not a shadow or a filter, and it only
                runs while a pointer is over the row. */}
            <SpotlightCard
              theme="light"
              spotlightColor="oklch(var(--primary-base) / 0.14)"
              intensity={0.7}
              className="h-full rounded-2xl"
            >
              <div className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <PartGlyph part={part.key} />
                  <span aria-hidden="true" className="tabular font-heading text-h4 font-semibold text-primary-border">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h4 className="mt-6 font-heading text-h4 font-semibold text-ink">{part.label}</h4>
                <p className="mt-2 leading-relaxed text-ink-soft">{part.desc}</p>
              </div>
            </SpotlightCard>
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

/**
 * One line drawing per part, in the stroke weight of the service icons. Drawn
 * here rather than taken from an icon set because none has an abutment, and a
 * generic "tooth" on all four cards would say nothing.
 */
function PartGlyph({ part }: { part: PartKey }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {part === 'fixture' && (
        <>
          <path d="M17 6h14v5l-1.2 26.5a5.8 5.8 0 0 1-11.6 0L17 11z" />
          <path d="M17.3 16.5l13.2 3M17.6 23l12.6 3M17.9 29.5l12 3M18.4 36l10.6 2.6M17 11h14" />
        </>
      )}
      {part === 'abutment' && (
        <>
          <path d="M14 10h20l-4 15H18z" />
          <path d="M18 25h12v7H18zM21 32h6v8h-6zM14 10c3 2.2 17 2.2 20 0" />
        </>
      )}
      {part === 'crown' && (
        <>
          <path d="M11 20c0-7 4-11 8-11 2.4 0 3.4 1.6 5 1.6S26.6 9 29 9c4 0 8 4 8 11 0 6-2.5 10-4.5 15H15.5C13.5 30 11 26 11 20z" />
          <path d="M15.5 35c2.2 2 14.8 2 17 0M24 10.6V17" />
        </>
      )}
      {part === 'bone' && (
        <>
          <path d="M7 14c5-3 11-3 14 1v24H7zM41 14c-5-3-11-3-14 1v24h14z" />
          <path d="M21 39h6M11.5 22h.01M15.5 28h.01M12 33.5h.01M32.5 22h.01M36 27.5h.01M32 33.5h.01" strokeWidth="2.4" />
          <path d="M21 15v24M27 15v24" strokeDasharray="2.5 3" />
        </>
      )}
    </svg>
  );
}
