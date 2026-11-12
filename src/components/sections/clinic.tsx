import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';

import { Section } from '@/components/primitives/section';
import { Reveal } from '@/components/reveal';
import { clinicPhotos, type homeContent } from '@/lib/data';
import type { Language } from '@/lib/types';

type ClinicCopy = (typeof homeContent)['es']['clinic'];

interface ClinicSectionProps {
  id?: string;
  lang: Language;
  content: ClinicCopy;
  address: string;
  schedule: string;
  /** Where "how to get there" leads: the contact band further down. */
  directionsHref: string;
}

/**
 * The place, in photographs — directly under the hero.
 *
 * When the implant film took over the hero, the clinic's own photographs left
 * the first screens of the page altogether: the only one still shown was a
 * single frame in "Cómo llegar", nine bands down. A page that opens on a
 * rendered implant and never shows a real door reads as a brochure for a
 * procedure, not as a practice someone can walk into — and the clinic's owner
 * said so. So the two storefront photographs sit here, where the hero used to
 * carry one of them.
 *
 * Both are shown at their own shape. The row's two columns are sized in the
 * ratio of the photographs' aspect ratios (16:9 beside 9:16), which is what
 * makes a landscape and a portrait come out the same height with neither
 * cropped. On a phone the portrait would be a screen and a half tall at full
 * width, so there it takes a landscape crop of its LOWER part — the door, the
 * step and the walkway. The upper part is the same lettered glass as the wide
 * shot above it, and two near-identical pictures stacked read as a mistake.
 *
 * `approach`, the third photograph, stays in "Cómo llegar": it is the view a
 * visitor has while looking for the place, which is that band's subject.
 */
export function ClinicSection({ id, lang, content, address, schedule, directionsHref }: ClinicSectionProps) {
  const { front, door } = clinicPhotos;

  return (
    <Section id={id} tone="surface" space="normal">
      {/* Three blocks whose order differs by screen. On a phone the
          photographs come straight after the heading — they are the reason
          the band exists, and under four paragraphs of address they started a
          full screen down. On wide screens the heading and the details share
          the first row and the photographs run the full width beneath. */}
      <div className="grid gap-x-[6%] gap-y-8 lg:col-span-12 lg:grid-cols-12 lg:gap-y-12">
        <Reveal className="lg:col-span-6">
          <p className="mb-3 font-body text-small font-medium text-brass-ink">{content.lead}</p>
          <h2 className="font-heading text-h2 font-medium text-ink">{content.title}</h2>
        </Reveal>

        <div className="order-3 lg:order-none lg:col-span-5 lg:col-start-8 lg:self-end">
          <p className="max-w-measure leading-relaxed text-ink-soft">{content.body}</p>
          <ul className="mt-6 space-y-3 border-t border-line-strong pt-5 text-ink">
            <li className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {address}
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {schedule}
            </li>
          </ul>
          <Link
            href={directionsHref}
            className="group/go mt-4 inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            {content.directions}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-base ease-out-quart group-hover/go:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="order-2 grid gap-4 sm:grid-cols-[16fr_5.0625fr] lg:order-none lg:col-span-12">
          <Reveal as="figure" className="m-0">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-e3">
              <Image
                src={front.src}
                alt={front.alt[lang]}
                fill
                sizes="(min-width: 1024px) 70vw, (min-width: 640px) 74vw, 100vw"
                quality={80}
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal as="figure" className="m-0">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-e3 sm:aspect-[9/16]">
              <Image
                src={door.src}
                alt={door.alt[lang]}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 24vw, 100vw"
                quality={80}
                className="object-cover object-[50%_74%] sm:object-center"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
