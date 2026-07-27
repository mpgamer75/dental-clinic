'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { ImplantStage } from '@/components/implant/implant-stage';
import { useLanguage } from '@/contexts/language-context';
import { implantEducation } from '@/lib/data';

/**
 * How an implant works — the page's hero object.
 *
 * Composition: a STICKY visual paired with a SCROLLING legend. The scroll
 * position of the tall right-hand column drives the 3D assembly, so the
 * sequence has the whole column's height to play out in while the object stays
 * pinned in view. Previously the animation was driven by the canvas's own
 * ~480px box, which gave it about one viewport of travel — it completed almost
 * instantly and then sat still, which is why it read as broken.
 *
 * The visual is delegated to <ImplantStage>, which renders the WebGL assembly
 * on capable desktop clients and a static SVG cross-section everywhere else.
 * Both carry the same information; the numbered legend is the authoritative
 * version, so nothing is conveyed by the graphic alone.
 */
export function ImplantEducation({ id = 'implantes' }: { id?: string }) {
  const { lang } = useLanguage();
  const t = implantEducation[lang];
  const appointmentHref = `/${lang}/agendar-cita`;
  const driverRef = useRef<HTMLDivElement>(null);

  // The animation places the parts bottom-up — fixture, abutment, crown — and
  // then reveals osseointegration. `t.parts` is authored top-down for reading
  // (crown first), so the caption order is the reverse of the legend order.
  // Reusing the part labels keeps the caption bilingual with no new copy.
  const phases = [t.parts[2], t.parts[1], t.parts[0], t.parts[3]]
    .filter(Boolean)
    .map((p) => p.label);

  // A dimension, not copy: only the decimal separator is locale-dependent.
  const scaleNote = `Ø ${lang === 'es' ? '4,1' : '4.1'} × 10 mm`;

  return (
    <Section id={id} tone="canvas" space="loose">
      <SectionHeading
        lead={t.eyebrow}
        title={t.title}
        description={t.description}
        align="left"
        className="lg:col-span-7"
      />

      {/* Pinned visual, scrolling narrative.

          EVERYTHING in the right-hand column is inside the driver on purpose,
          and this was the bug that made the sequence look broken. A sticky
          element can only travel within its own containing block, so when the
          legend alone sat opposite the figure the column was SHORTER than the
          figure — the sticky box and its parent were both 812 px, leaving
          exactly zero room to stick. The visual scrolled away with the page and
          the assembly never got past its first phase, which is precisely the
          "it doesn't really work" complaint. Folding the treatment steps and
          the CTA into the same column gives the pin something to be pinned
          against. */}
      <div ref={driverRef} className="mt-2 grid items-start gap-x-[6%] gap-y-12 lg:grid-cols-12">
        {/* Pinned at EVERY breakpoint, not just lg.
            On a phone the plate is scroll-driven exactly as the WebGL scene is
            on a desktop, so leaving it unpinned meant the picture scrolled out
            of frame about a third of the way through its own sequence while the
            scrub rail beside it carried on to the end. The column is 1801 px
            against a 452 px figure, so there is ample room to pin.

            `self-start` is load-bearing at lg: a sticky child inside a grid
            otherwise stretches to the full row height and never actually
            sticks. */}
        {/* `relative z-raised` is not decoration. Every <Reveal> in the legend
            animates a transform, and a transformed element paints in the same
            layer as a positioned one — so with both at `z-index: auto` the
            later sibling wins and the legend text rendered straight over the
            top of the pinned figure. Only visible once the figure actually
            started sticking, which is why it appeared as a "new" bug. */}
        {/* `bg-canvas` matches the section tone, so it is invisible — but it is
            needed: the figcaption sits OUTSIDE the framed card, so without an
            opaque backing the legend scrolled visibly through the caption text
            once the figure started pinning. */}
        <div className="sticky top-20 z-raised self-start bg-canvas pb-2 lg:col-span-6 lg:top-24">
          <ImplantStage
            label={t.svgAlt}
            driverRef={driverRef}
            scaleNote={scaleNote}
            phases={phases}
          />
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          {/* Numbered legend — the accessible source of truth for the diagram. */}
          <Reveal>
            <ol className="space-y-0">
              {t.parts.map((part, i) => (
                <li
                  key={part.label}
                  className="grid grid-cols-[auto_1fr] gap-x-5 border-b border-line py-8 first:pt-0 last:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/45 font-heading text-small text-brass-ink tabular"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-h4 font-medium text-ink">{part.label}</h3>
                    <p className="mt-1.5 max-w-measure leading-relaxed text-ink-soft">
                      {part.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* Treatment sequence. A real ordered process, so the numbering earns
              it. Stacked rather than the previous three-across card row: this
              column is five of twelve, and three cards in it would each hold
              about four words per line. */}
          <div className="mt-[clamp(3.5rem,6vw,5.5rem)]">
            <Reveal>
              <h3 className="font-heading text-h3 font-medium text-ink">{t.stepsTitle}</h3>
            </Reveal>

            <ol className="mt-8 border-l border-line">
              {t.steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.06}>
                  <li className="relative py-7 pl-7 first:pt-0">
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-8 h-px w-4 bg-brass/50 first:top-1"
                    />
                    <span className="font-heading text-small font-medium text-brass-ink tabular">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h4 className="mt-2 font-heading text-h4 font-medium text-ink">
                      {step.title}
                    </h4>
                    <p className="mt-2 max-w-measure leading-relaxed text-ink-soft">{step.desc}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal className="mt-12">
            <Button asChild size="lg">
              <Link href={appointmentHref}>{t.ctaLabel}</Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
