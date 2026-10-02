'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { ImplantStage } from '@/components/implant/implant-stage';
import type { implantEducation } from '@/lib/data';
import type { Language } from '@/lib/types';
import { cn } from '@/lib/utils';

type ImplantCopy = (typeof implantEducation)['es'];

interface GuideLink {
  href: string;
  label: string;
  summary: string;
}

interface ImplantEducationProps {
  id?: string;
  lang: Language;
  content: ImplantCopy;
  appointmentHref: string;
  /** The implant guide's pages, resolved on the server so the guide's prose
   *  never enters this client component's props or bundle. */
  guide: { allHref: string; links: GuideLink[] };
}

/**
 * How an implant works — the page's one authored motion moment.
 *
 * A STICKY figure beside a SCROLLING legend: the right-hand column's height is
 * the scroll distance the assembly plays out over, while the figure stays
 * pinned in view. The figure reports which part it is showing
 * (`onPhaseChange`) and the matching legend row lights up, so the picture and
 * the words are always talking about the same thing. They used to disagree: the
 * legend ran crown-first while the figure assembled fixture-first, and the
 * caption under the figure named one part while the row beside it described
 * another. Both now follow assembly order (see `implantEducation.parts`).
 *
 * The highlight is a state change four times per pass through the section —
 * never per frame — and it is decoration on top of a legend that is complete
 * and readable on its own; nothing is conveyed by the figure alone.
 */
export function ImplantEducation({
  id = 'implantes',
  lang,
  content,
  appointmentHref,
  guide,
}: ImplantEducationProps) {
  const driverRef = useRef<HTMLDivElement>(null);
  const [activePart, setActivePart] = useState(0);

  const phases = content.parts.map((part) => part.label);
  // A dimension, not copy: only the decimal separator is locale-dependent.
  const scaleNote = `Ø ${lang === 'es' ? '4,1' : '4.1'} × 10 mm`;

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

      {/* EVERYTHING in the right-hand column is inside the driver: a sticky
          element can only travel within its containing block, and when the
          legend alone sat opposite the figure the column was shorter than the
          figure, leaving zero room to stick. */}
      <div ref={driverRef} className="mt-2 grid items-start gap-x-[6%] gap-y-10 lg:grid-cols-12">
        {/* Pinned at every breakpoint. `relative z-raised`: the legend rows
            below carry transforms (reveal), and a transformed sibling later in
            the DOM would otherwise paint over the pinned figure. The opaque
            backing tracks the band's tone; the gradient foot below it fades the
            legend as it slides underneath, instead of slicing a line of text
            in half at the figure's edge. */}
        <div className="sticky top-[4.5rem] z-raised self-start bg-primary-soft pb-3 lg:top-24 lg:col-span-6 lg:pb-2">
          <ImplantStage
            label={content.svgAlt}
            driverRef={driverRef}
            scaleNote={scaleNote}
            phases={phases}
            onPhaseChange={setActivePart}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full h-10 bg-gradient-to-b from-primary-soft to-primary-soft/0 lg:hidden"
          />
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          {/* The legend — the accessible source of truth for the figure. */}
          <ol>
            {content.parts.map((part, index) => {
              const active = index === activePart;
              return (
                <li
                  key={part.key}
                  data-active={active}
                  /* `line-strong`, not `line`: on the tint ground in dark mode
                     the ordinary hairline (L 0.32) vanishes against L 0.31. */
                  className="group/part grid grid-cols-[auto_1fr] gap-x-5 border-b border-line-strong py-7 first:pt-0 last:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-heading text-small tabular',
                      'transition-colors duration-base ease-out-quart',
                      active
                        ? 'border-brass bg-brass text-brass-on'
                        : 'border-brass/45 text-brass-ink',
                    )}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3
                      className={cn(
                        'font-heading text-h4 font-medium transition-colors duration-base ease-out-quart',
                        active ? 'text-primary' : 'text-ink',
                      )}
                    >
                      {part.label}
                    </h3>
                    <p className="mt-1.5 max-w-measure leading-relaxed text-ink-soft">{part.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* The treatment sequence — a real order, so numbering earns it. */}
          <div className="mt-[clamp(3.5rem,6vw,5rem)]">
            <h3 className="reveal font-heading text-h3 font-medium text-ink">{content.stepsTitle}</h3>
            <RevealGroup as="ol" className="mt-8 border-l border-line-strong">
              {content.steps.map((step, index) => (
                <RevealItem key={step.title} as="li" index={index} className="relative py-6 pl-7 first:pt-0 last:pb-0">
                  {/* The tick's offset follows the row's own top padding, which
                      the first row does not have — so the index decides, not a
                      `first:` variant on the span (which matched every row). */}
                  <span
                    aria-hidden="true"
                    className={cn('absolute left-0 h-px w-4 bg-brass/60', index === 0 ? 'top-2.5' : 'top-[2.1rem]')}
                  />
                  <span className="font-heading text-small font-medium text-brass-ink tabular">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h4 className="mt-1.5 font-heading text-h4 font-medium text-ink">{step.title}</h4>
                  <p className="mt-1.5 max-w-measure leading-relaxed text-ink-soft">{step.desc}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <div className="mt-11">
            <Button asChild size="lg">
              <Link href={appointmentHref}>{content.ctaLabel}</Link>
            </Button>
          </div>

          {/* Into the guide. The homepage had no link to any of its pages —
              price, All-on-4, immediate loading, bone grafts — which are exactly
              the questions a patient has after this section, and the cluster's
              only internal route in was the header. */}
          <nav aria-labelledby="implant-guide-title" className="mt-14 border-t border-line-strong pt-8">
            <h3 id="implant-guide-title" className="font-heading text-h4 font-medium text-ink">
              {content.guideTitle}
            </h3>
            <ul className="mt-3 divide-y divide-line-strong">
              {guide.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group/guide flex items-center justify-between gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary-soft"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-ink transition-colors duration-fast group-hover/guide:text-primary">
                        {link.label}
                      </span>
                      <span className="mt-0.5 block text-small leading-snug text-ink-soft">{link.summary}</span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-brass-ink transition-transform duration-base ease-out-quart group-hover/guide:translate-x-0.5"
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
      </div>
    </Section>
  );
}
