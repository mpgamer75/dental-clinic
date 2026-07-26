import Image from 'next/image';
import Link from 'next/link';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import type { homeContent } from '@/lib/data';

type Doctor = (typeof homeContent)['es']['doctor'];

interface DoctorSectionProps {
  id?: string;
  content: Doctor;
  qualifications: string[];
  diplomaCount: number;
  diplomasHref: string;
  imageAlt: string;
}

/**
 * The clinician, as narrative rather than a wall of certificate thumbnails.
 *
 * The diploma wall still exists further down the page; this section's job is
 * to say who the person is and let the count stand in for the evidence, with
 * a link for anyone who wants to inspect it.
 */
export function DoctorSection({
  id,
  content,
  qualifications,
  diplomaCount,
  diplomasHref,
  imageAlt,
}: DoctorSectionProps) {
  return (
    <Section id={id} tone="sunk" space="loose">
      <div className="grid items-start gap-x-[6%] gap-y-12 lg:col-span-12 lg:grid-cols-12">
        {/* Portrait column — the practice interior stands in for a headshot,
            which the clinic hasn't supplied. */}
        <Reveal className="lg:col-span-5">
          <figure className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-e3">
              <Image
                src="/images/vitrine_clinique2.jpg"
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                quality={80}
              />
            </div>
            {/* Credential count as a brass plate, seated on the image edge. */}
            <figcaption className="absolute -bottom-5 left-6 right-6 rounded-xl bg-brass px-5 py-4 text-brass-on shadow-e3">
              <p className="font-heading text-h3 font-medium tabular">{diplomaCount}</p>
              <p className="text-sm leading-snug">{content.credentialsTitle}</p>
            </figcaption>
          </figure>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <SectionHeading
            lead={content.lead}
            title={content.title}
            align="left"
            className="mb-8"
          />

          <Reveal>
            <div className="max-w-measure space-y-4 text-body leading-relaxed text-ink-soft">
              {content.body.map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ul className="mt-9 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {qualifications.map((q) => (
                <li key={q} className="flex gap-3 text-ink">
                  <span
                    aria-hidden="true"
                    className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-brass-ink"
                  />
                  <span className="leading-snug">{q}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.14}>
            <Button asChild variant="outline" size="lg" className="mt-9">
              <Link href={diplomasHref}>{content.viewDiplomas}</Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
