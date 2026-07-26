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

      <div ref={driverRef} className="mt-2 grid items-start gap-x-[6%] gap-y-12 lg:grid-cols-12">
        {/* `self-start` is load-bearing: a sticky child inside a grid otherwise
            stretches to the full row height and never actually sticks. */}
        <div className="lg:col-span-6 lg:sticky lg:top-28 lg:self-start">
          <ImplantStage
            label={t.svgAlt}
            driverRef={driverRef}
            scaleNote={scaleNote}
            phases={phases}
          />
        </div>

        {/* Numbered legend — the accessible source of truth for the diagram.
            Offset one column off the visual so the pair reads as a spread
            rather than two abutting blocks. */}
        <Reveal className="lg:col-span-5 lg:col-start-8">
          <ol className="space-y-0">
            {t.parts.map((part, i) => (
              <li
                key={part.label}
                className="grid grid-cols-[auto_1fr] gap-x-5 border-b border-line py-7 first:pt-0 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/45 font-heading text-small text-brass-ink tabular"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-heading text-h4 font-medium text-ink">{part.label}</h3>
                  <p className="mt-1.5 max-w-measure leading-relaxed text-ink-soft">{part.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      {/* Treatment sequence. A real ordered process, so the numbering earns it.
          Indented one column from the left rule — a deliberate step in, so the
          page does not read as one flush-left stack. */}
      <div className="mt-[clamp(3.5rem,7vw,6rem)] lg:col-span-10 lg:col-start-2">
        <Reveal>
          <h3 className="font-heading text-h3 font-medium text-ink">{t.stepsTitle}</h3>
        </Reveal>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {t.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.07} className="bg-surface">
              <div className="h-full p-8">
                <span className="font-heading text-small font-medium text-brass-ink tabular">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4 className="mt-3 font-heading text-h4 font-medium text-ink">{step.title}</h4>
                <p className="mt-2 leading-relaxed text-ink-soft">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal className="mt-12 lg:col-span-6 lg:col-start-2">
        <Button asChild size="lg">
          <Link href={appointmentHref}>{t.ctaLabel}</Link>
        </Button>
      </Reveal>
    </Section>
  );
}
