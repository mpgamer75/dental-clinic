'use client';

import Link from 'next/link';
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
 * The visual is delegated to <ImplantStage>, which renders a scroll-driven
 * WebGL assembly on capable desktop clients and a static SVG cross-section
 * everywhere else. Both carry the same information; the numbered legend below
 * is the authoritative version, so nothing is conveyed by the graphic alone.
 */
export function ImplantEducation({ id = 'implantes' }: { id?: string }) {
  const { lang } = useLanguage();
  const t = implantEducation[lang];
  const appointmentHref = `/${lang}/agendar-cita`;

  return (
    <Section id={id} tone="canvas">
      <SectionHeading lead={t.eyebrow} title={t.title} description={t.description} align="left" />

      <div className="grid items-center gap-x-14 gap-y-12 lg:grid-cols-2">
        <div className="flex justify-center lg:justify-start">
          <ImplantStage label={t.svgAlt} />
        </div>

        {/* Numbered legend — the accessible source of truth for the diagram. */}
        <Reveal>
          <ol className="space-y-1">
            {t.parts.map((part, i) => (
              <li
                key={part.label}
                className="grid grid-cols-[auto_1fr] gap-x-4 border-b border-line py-5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta font-heading text-sm font-medium text-primary-foreground tabular"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-heading text-lg font-medium text-ink">{part.label}</h3>
                  <p className="mt-1 max-w-measure leading-relaxed text-ink-soft">{part.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      {/* Treatment sequence. A real ordered process, so the numbering earns it. */}
      <div className="mt-[clamp(3rem,6vw,5rem)]">
        <Reveal>
          <h3 className="font-heading text-2xl font-medium text-ink">{t.stepsTitle}</h3>
        </Reveal>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {t.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.07} className="bg-surface">
              <div className="h-full p-7">
                <span className="font-heading text-sm font-medium text-brass-ink tabular">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h4 className="mt-3 font-heading text-lg font-medium text-ink">{step.title}</h4>
                <p className="mt-2 leading-relaxed text-ink-soft">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal className="mt-10">
        <Button asChild size="lg">
          <Link href={appointmentHref}>{t.ctaLabel}</Link>
        </Button>
      </Reveal>
    </Section>
  );
}
