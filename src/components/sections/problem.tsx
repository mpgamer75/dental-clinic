import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';

import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { TiltCard } from '@/components/tilt-card';
import type { homeContent } from '@/lib/data';

type Problem = (typeof homeContent)['es']['problem'];
type Point = Problem['points'][number];

interface ProblemSectionProps {
  id?: string;
  content: Problem;
  /** The implant explainer, one band down: where the closing line leads. */
  implantHref: string;
}

/**
 * Why treatment matters, stated before any treatment is offered.
 *
 * The band used to be a heading beside a paragraph and a ruled list, and the
 * clinic's owner read it as empty: nothing in it showed what the words
 * described. It now tells the same thing in three beats.
 *
 *   1. What a patient notices. The three everyday moments were the first three
 *      sentences of a paragraph; they are the most recognisable thing in the
 *      section, so they stand beside the heading as ruled statements.
 *   2. What is happening meanwhile. Three illustrated panels of UNEQUAL size:
 *      the bone leads, because it is the change nobody can see and the one the
 *      denture's fit depends on. Three equal cards would also repeat the
 *      four-card row of the implant band directly below, and two identical
 *      rows two bands apart read as a template.
 *   3. Where the page goes next: one sentence and a link to the explainer.
 *
 * The panels are not numbered. "01 / 02 / 03" announces a sequence, and bone
 * loss, drifting teeth and a loosening denture happen together, not in order.
 *
 * A server component. The panels' tilt is the only script in it.
 */
export function ProblemSection({ id, content, implantHref }: ProblemSectionProps) {
  /* The first point is the lead panel. `points` is authored in that order in
     data.ts (bone first), so the emphasis is an editorial decision made there
     rather than a key lookup hidden here. */
  const [lead, ...rest] = content.points;

  return (
    <Section id={id} tone="canvas" grain space="normal">
      {/* ── What a patient notices ─────────────────────────────────── */}
      <div className="grid gap-x-[6%] gap-y-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-6">
          <SectionHeading title={content.title} align="left" className="mb-0 md:mb-0" />
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <p className="font-body text-small font-semibold text-brass-ink">
            {content.momentsLabel}
          </p>
          <RevealGroup as="ul" className="mt-3 border-b border-line-strong">
            {content.moments.map((moment, index) => (
              <RevealItem
                key={moment}
                as="li"
                index={index}
                className="border-t border-line-strong py-4 font-heading text-h3 font-medium text-ink"
              >
                {moment}
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>

      {/* ── What is happening meanwhile ────────────────────────────── */}
      <div className="mt-[clamp(3rem,6vw,5rem)]">
        <h3 className="font-body text-small font-semibold text-brass-ink">{content.pointsTitle}</h3>
        <p className="mt-3 max-w-measure text-body leading-relaxed text-ink-soft">{content.description}</p>

        {/* Two rows on wide screens: the lead panel takes both, the other two
            stack beside it. `auto-rows-fr` is what makes the pair exactly as
            tall as the lead, so the block closes on one straight edge. */}
        <RevealGroup as="ul" className="mt-8 grid gap-4 lg:auto-rows-fr lg:grid-cols-12">
          {lead && (
            <RevealItem as="li" index={0} className="lg:col-span-7 lg:row-span-2">
              <TiltCard className="h-full rounded-2xl border border-line bg-surface">
                <div className="tilt-layer flex h-full flex-col gap-x-8 gap-y-4 p-6 sm:flex-row sm:items-center sm:p-8 lg:flex-col lg:items-start lg:justify-between xl:flex-row xl:items-center xl:justify-start">
                  <PointRender point={lead} size="lead" />
                  <div className="min-w-0">
                    <h4 className="font-heading text-h3 font-semibold text-ink">{lead.title}</h4>
                    <p className="mt-3 max-w-measure leading-relaxed text-ink-soft">{lead.desc}</p>
                  </div>
                </div>
              </TiltCard>
            </RevealItem>
          )}

          {rest.map((point, index) => (
            <RevealItem key={point.key} as="li" index={index + 1} className="lg:col-span-5">
              <TiltCard className="h-full rounded-2xl border border-line bg-surface">
                <div className="tilt-layer flex h-full items-center gap-4 p-5 sm:gap-6 sm:p-6">
                  <PointRender point={point} size="aside" />
                  <div className="min-w-0">
                    <h4 className="font-heading text-h4 font-semibold text-ink">{point.title}</h4>
                    <p className="mt-2 leading-relaxed text-ink-soft">{point.desc}</p>
                  </div>
                </div>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      {/* ── Into the explainer ─────────────────────────────────────────
          The band stated a problem and offers nothing; the answer is the next
          band's job. One factual sentence hands over to it, so the section
          ends on a direction instead of on the third consequence. */}
      <div className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-col gap-x-10 gap-y-2 border-t border-line-strong pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-measure font-heading text-h4 font-medium text-ink">{content.bridge.text}</p>
        <Link
          href={implantHref}
          className="group/next inline-flex min-h-11 shrink-0 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
        >
          {content.bridge.cta}
          <ArrowDown
            className="h-4 w-4 transition-transform duration-base ease-out-quart group-hover/next:translate-y-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </Section>
  );
}

/* Rendered box and intrinsic request per size. The lead asks for a larger
   file because it is drawn at up to 224px; the asides never exceed 112px, and
   asking for the same file there would download four times the pixels shown. */
const RENDER = {
  lead: { box: 'h-40 w-40 sm:h-56 sm:w-56', image: 'h-36 w-36 sm:h-52 sm:w-52', px: 224 },
  aside: { box: 'h-20 w-20 sm:h-28 sm:w-28', image: 'h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24', px: 112 },
} as const;

/**
 * A render of the consequence itself, in the same light as the part icons one
 * band down, on the same plinth. The files are named by the point's stable
 * `key` (`public/images/problem/<file>.webp`); a title is copy and changes.
 * Transparent, so one file serves both themes. Decorative: the heading beside
 * it says what it shows.
 */
function PointRender({ point, size }: { point: Point; size: keyof typeof RENDER }) {
  const { box, image, px } = RENDER[size];
  return (
    <span className={`tilt-layer relative flex shrink-0 items-center justify-center ${box}`}>
      <span aria-hidden="true" className="icon-plinth" />
      <Image
        src={`/images/problem/${POINT_IMAGE[point.key]}.webp`}
        alt=""
        width={px}
        height={px}
        loading="lazy"
        className={`tilt-pop relative object-contain ${image}`}
      />
    </span>
  );
}

/* The key names the consequence; the file names the picture. They differ for
   the bone (`bone` → bone-loss.webp) because `public/images/icons/bone.webp`
   already exists and shows HEALTHY bone around an implant — the same basename
   for the opposite picture is a mix-up waiting to happen. */
const POINT_IMAGE: Record<Point['key'], string> = {
  bone: 'bone-loss',
  drift: 'drift',
  denture: 'denture',
};
