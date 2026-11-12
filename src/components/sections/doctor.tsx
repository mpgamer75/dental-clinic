import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { DiplomaShowcase } from '@/components/diploma-showcase';
import { TestimonialDialog } from '@/components/testimonial-dialog';
import CountUp from '@/components/reactbits/count-up';
import type { diplomasUi, homeContent } from '@/lib/data';
import type { Diploma } from '@/lib/types';

type DoctorCopy = (typeof homeContent)['es']['doctor'];

interface DoctorSectionProps {
  id?: string;
  content: DoctorCopy;
  qualifications: string[];
  diplomas: { items: Diploma[]; ui: (typeof diplomasUi)['es']; title: string; description: string };
  /** The testimonial invitation, when it should be shown here: the clinic
   *  accepts testimonials and none is published yet (otherwise the
   *  testimonials band carries its own button). */
  invite: null | {
    dialogTitle: string;
    dialogDescription: string;
    closeLabel: string;
  };
}

/**
 * Who will treat you, and the documents behind it — two bands, one argument.
 *
 * The first band is the claim: the narrative, the qualifications, and three
 * figures that are each a fact about the record rather than a slogan. The
 * second is the evidence: the diplomas themselves, on their own blue band
 * directly underneath, so "cada diploma de abajo corresponde a un curso o
 * certificación concreta" is literally true.
 *
 * The figures count up once as they scroll into view; under reduced motion
 * they are simply the final numbers. The earliest year is read from the
 * diplomas, so the figure cannot drift from the documents below it.
 *
 * When the clinic supplies a portrait of Dr. Valerio it belongs beside the
 * narrative, in the column the qualifications occupy on wide screens.
 */
export function DoctorSection({ id, content, qualifications, diplomas, invite }: DoctorSectionProps) {
  const years = diplomas.items.map((d) => Number.parseInt(d.year, 10)).filter(Number.isFinite);
  const firstYear = years.length > 0 ? Math.min(...years) : null;

  return (
    <>
      <Section id={id} tone="sunk" space="loose">
        <div className="grid gap-x-[6%] gap-y-10 lg:col-span-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading lead={content.lead} title={content.title} align="left" className="mb-7 md:mb-8" />
            <div className="max-w-measure space-y-4 text-body leading-relaxed text-ink-soft">
              {content.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </div>

          <Reveal className="lg:col-span-4 lg:col-start-9 lg:pt-[clamp(3rem,6vw,5.5rem)]">
            <ul className="border-t border-line-strong">
              {qualifications.map((qualification) => (
                <li
                  key={qualification}
                  className="flex gap-3.5 border-b border-line py-3.5 leading-snug text-ink"
                >
                  <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {qualification}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <dl className="mt-[clamp(3rem,6vw,5rem)] grid gap-y-8 border-t border-line-strong pt-9 sm:grid-cols-3 sm:gap-x-8">
          <Figure label={content.stats.practice}>
            <CountUp to={30} from={1} duration={1.4} suffix="+" />
          </Figure>
          <Figure label={content.stats.documents}>
            <CountUp to={diplomas.items.length} from={0} duration={1.1} />
          </Figure>
          {firstYear !== null && (
            <Figure label={content.stats.since}>
              <CountUp to={firstYear} from={firstYear - 24} duration={1.6} />
            </Figure>
          )}
        </dl>

        {/* Replaces a full band that told every prospective patient "Todavía no
            hay testimonios" — the most damaging sentence on the page, placed
            exactly where proof should have been. The invitation is addressed
            to the people who CAN help, and it carries the #testimonios anchor
            the header and footer link to. */}
        {invite && (
          <div
            id="testimonios"
            className="mt-12 flex scroll-mt-28 flex-col gap-x-8 gap-y-2 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-ink-soft">
              <span className="font-medium text-ink">{content.inviteQuestion}</span> {content.inviteBody}
            </p>
            <TestimonialDialog
              variant="link"
              triggerLabel={content.inviteCta}
              title={invite.dialogTitle}
              description={invite.dialogDescription}
              closeLabel={invite.closeLabel}
              className="shrink-0 self-start sm:self-auto"
            />
          </div>
        )}
      </Section>

      {/* `overflow-hidden`: the deck's side cards are rotated in 3D and a
          rotated card's far corner projects past the strip's own box. */}
      <Section id="diplomas" tone="drench" space="normal" className="overflow-hidden">
        {/* One wash of light behind the centred document. Static. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[38%] -z-10 h-[46rem] w-[min(120vw,70rem)] -translate-x-1/2 -translate-y-1/2"
          style={{
            backgroundImage:
              'radial-gradient(closest-side, oklch(var(--primary-base) / 0.55), oklch(var(--primary-base) / 0))',
          }}
        />
        <DiplomaShowcase
          items={diplomas.items}
          ui={diplomas.ui}
          title={diplomas.title}
          description={diplomas.description}
        />
      </Section>
    </>
  );
}

/** One figure and what it counts. `dd` before `dt` visually, by flex order:
 *  the number is what the eye should land on, the label is its name. */
function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 max-w-[22ch] text-small leading-snug text-ink-soft">{label}</dt>
      <dd className="tabular font-heading text-h2 font-semibold text-primary">{children}</dd>
    </div>
  );
}
