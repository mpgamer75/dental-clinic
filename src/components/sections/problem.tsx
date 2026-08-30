import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';
import type { homeContent } from '@/lib/data';

type Problem = (typeof homeContent)['es']['problem'];

/**
 * Why treatment matters, stated before any treatment is offered.
 *
 * Rendered as a ruled definition list rather than a three-card grid: the
 * points are consequences of one situation, not three parallel products, and
 * identical icon+heading+text cards are the template reflex this page is
 * trying not to be.
 */
export function ProblemSection({ id, content }: { id?: string; content: Problem }) {
  return (
    <Section id={id} tone="canvas" grain space="loose">
      <div className="grid gap-x-[6%] gap-y-8 lg:col-span-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading title={content.title} align="left" className="mb-0" />
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <Reveal>
            <p className="max-w-measure text-body leading-relaxed text-ink-soft">
              {content.description}
            </p>
          </Reveal>

          {/* A `<dl>` may group each term/description pair in a `<div>` — but
              exactly one level of it. `<Reveal>` wrapped around the row added
              a second, which put the `<dt>`/`<dd>` two divs deep and stopped
              them being list content at all. The group now *is* the `<dl>` and
              each row is its own grouping div, so the pairing survives. */}
          <RevealGroup as="dl" stagger={0.06} className="mt-10">
            {content.points.map((p, i) => (
              <RevealItem
                key={p.title}
                className="grid grid-cols-[auto_1fr] gap-x-5 border-t border-line py-6"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 font-heading text-small font-medium text-brass-ink tabular"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <dt className="font-heading text-h4 font-medium text-ink">{p.title}</dt>
                  <dd className="mt-2 max-w-measure leading-relaxed text-ink-soft">{p.desc}</dd>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </Section>
  );
}
