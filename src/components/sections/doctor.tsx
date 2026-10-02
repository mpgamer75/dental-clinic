import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { DiplomaRail } from '@/components/diploma-rail';
import { TestimonialDialog } from '@/components/testimonial-dialog';
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
 * Who will treat you, and the documents behind it.
 *
 * This band used to lead with a photograph of the clinic's glass door standing
 * in for a portrait, captioned with a brass slab reading "9 / Formación
 * acreditada", and send the reader 2,300px further down the page to a separate
 * wall of diplomas. The evidence now sits directly under the claim it backs —
 * "cada diploma de abajo corresponde a un curso o certificación concreta" is
 * finally literally true — and the door appears once, in "Cómo llegar".
 *
 * When the clinic supplies a portrait of Dr. Valerio it belongs beside the
 * narrative, in the column the qualifications occupy on wide screens.
 */
export function DoctorSection({ id, content, qualifications, diplomas, invite }: DoctorSectionProps) {
  return (
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
                <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-brass-ink" />
                {qualification}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* `scroll-mt` so a jump to #diplomas lands the rail's heading below the
          sticky header instead of under it. */}
      <div id="diplomas" className="mt-[clamp(3.5rem,7vw,6rem)] scroll-mt-28">
        <DiplomaRail
          items={diplomas.items}
          ui={diplomas.ui}
          title={diplomas.title}
          description={diplomas.description}
        />
      </div>

      {/* Replaces a full band that told every prospective patient "Todavía no
          hay testimonios" — the most damaging sentence on the page, placed
          exactly where proof should have been. The invitation is addressed to
          the people who CAN help, and it carries the #testimonios anchor the
          header and footer link to. */}
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
  );
}
