'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { useLanguage } from '@/contexts/language-context';
import { implantEducation } from '@/lib/data';
import { CalendarCheck } from 'lucide-react';

/**
 * Calm, educational dental-implant cross-section.
 *
 * Implemented as a token-themed SVG (adapts to light/dark) rather than WebGL/3D:
 * zero JS-bundle/perf cost, fully accessible (labelled + a text legend so nothing
 * is conveyed by colour or motion alone), and degrades to a clean static image
 * under prefers-reduced-motion. Content is general patient education only.
 */
export function ImplantEducation({ id = 'implantes' }: { id?: string }) {
  const { lang } = useLanguage();
  const reduce = useReducedMotion();
  const t = implantEducation[lang];
  const appointmentHref = `/${lang}/agendar-cita`;

  // Marker positions on the diagram, in the same order as the parts legend.
  const markers = [
    { x: 168, y: 56 }, // crown
    { x: 168, y: 116 }, // abutment
    { x: 168, y: 232 }, // titanium post
    { x: 52, y: 300 }, // bone
  ];

  const partAnim = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: 0.5, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section id={id} className="bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} description={t.description} />

        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Diagram */}
          <Reveal className="flex justify-center">
            <div className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <svg
                viewBox="0 0 220 360"
                role="img"
                aria-label={t.svgAlt}
                className="mx-auto h-auto w-full max-w-[260px]"
              >
                {/* Bone (4) */}
                <motion.rect
                  {...partAnim(3)}
                  x="26" y="132" width="168" height="208" rx="22"
                  className="fill-secondary"
                />
                {/* Gum band */}
                <rect x="14" y="116" width="192" height="22" rx="8" className="fill-muted" />

                {/* Titanium implant post (3) */}
                <motion.g {...partAnim(2)}>
                  <path
                    d="M92 122 H128 L122 318 Q110 332 98 318 Z"
                    className="fill-primary"
                  />
                  {/* threads */}
                  {[150, 174, 198, 222, 246, 270, 294].map((y) => (
                    <line
                      key={y}
                      x1="96" y1={y} x2="124" y2={y - 8}
                      className="stroke-primary-foreground/40"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  ))}
                </motion.g>

                {/* Abutment (2) */}
                <motion.path
                  {...partAnim(1)}
                  d="M96 92 H124 L120 120 H100 Z"
                  className="fill-primary/80"
                />

                {/* Crown (1) */}
                <motion.g {...partAnim(0)}>
                  <path
                    d="M74 86 Q70 40 110 34 Q150 40 146 86 Q132 96 110 96 Q88 96 74 86 Z"
                    className="fill-card stroke-primary"
                    strokeWidth="3"
                  />
                  <path d="M110 40 V92" className="stroke-primary/25" strokeWidth="2.5" />
                </motion.g>

                {/* Numbered markers */}
                {markers.map((m, i) => (
                  <motion.g key={i} {...partAnim(i)}>
                    <circle cx={m.x} cy={m.y} r="13" className="fill-primary" />
                    <text
                      x={m.x} y={m.y + 5}
                      textAnchor="middle"
                      className="fill-primary-foreground"
                      fontSize="14"
                      fontWeight="700"
                    >
                      {i + 1}
                    </text>
                  </motion.g>
                ))}
              </svg>
            </div>
          </Reveal>

          {/* Parts legend */}
          <Reveal>
            <ol className="space-y-4">
              {t.parts.map((part, i) => (
                <li key={part.label} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{part.label}</h3>
                    <p className="text-muted-foreground">{part.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        {/* Process steps */}
        <div className="mt-16">
          <h3 className="mb-8 text-center font-heading text-xl font-semibold text-foreground md:text-2xl">
            {t.stepsTitle}
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            {t.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="h-full rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-highlight/12 font-heading text-lg font-bold text-highlight">
                    {i + 1}
                  </span>
                  <h4 className="mt-4 font-heading text-lg font-semibold text-foreground">{step.title}</h4>
                  <p className="mt-1 text-muted-foreground">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-10 text-center">
          <Button asChild variant="cta" size="lg" className="btn-shine">
            <Link href={appointmentHref}>
              <CalendarCheck className="mr-2 h-5 w-5" />
              {t.ctaLabel}
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
