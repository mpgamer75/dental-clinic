import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { RevealGroup, RevealItem } from '@/components/reveal';
import type { homeContent } from '@/lib/data';

type Problem = (typeof homeContent)['es']['problem'];

/**
 * Why treatment matters, stated before any treatment is offered.
 *
 * A ruled definition list rather than a three-card grid: the points are
 * consequences of one situation, not three parallel products. They are not
 * numbered either — "01 / 02 / 03" announces a sequence, and bone loss, drifting
 * teeth and a loosening denture happen together, not in order. A brass tick
 * marks each row instead.
 */
export function ProblemSection({ id, content }: { id?: string; content: Problem }) {
  return (
    <Section id={id} tone="canvas" grain space="normal">
      <div className="grid gap-x-[6%] gap-y-8 lg:col-span-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading title={content.title} align="left" className="mb-0 md:mb-0" />
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <p className="max-w-measure text-body leading-relaxed text-ink-soft">
            {content.description}
          </p>

          {/* A <dl> may wrap each <dt>/<dd> pair in exactly one <div>. The row
              IS that div (the RevealItem), and the tick is drawn by the <dt>
              itself — a separate tick element used to force a second wrapper
              around the pair, which stopped it being list content at all. */}
          <RevealGroup as="dl" className="mt-9">
            {content.points.map((point, index) => (
              <RevealItem
                key={point.title}
                index={index}
                className="relative border-t border-line py-6 pl-10 last:pb-0"
              >
                <dt className="font-heading text-h4 font-medium text-ink before:absolute before:left-0 before:top-[calc(1.5rem+0.66em)] before:h-px before:w-5 before:bg-brass-ink">
                  {point.title}
                </dt>
                <dd className="mt-2 max-w-measure leading-relaxed text-ink-soft">{point.desc}</dd>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </Section>
  );
}
