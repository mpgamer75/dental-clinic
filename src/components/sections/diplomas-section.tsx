'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';

interface Diploma {
  id: string;
  title: string;
  institution: string;
  year: string;
  image: string;
  description: string;
}

interface DiplomasSectionProps {
  id: string;
  title: string;
  description: string;
  diplomasList: Diploma[];
}

/**
 * Credentials, as a chronological record.
 *
 * Two changes from the previous build worth noting:
 *
 *  1. The certificate scans are actually rendered. `diploma.image` was present
 *     in the data and never used — nine real documents were being described in
 *     prose while the evidence sat unreferenced in /public/images.
 *  2. The alternating desktop timeline is gone. It duplicated every card into
 *     two DOM trees (one `hidden lg:block`, one `lg:hidden`), which doubled the
 *     markup and shipped both to every client.
 */
export function DiplomasSection({ id, title, description, diplomasList }: DiplomasSectionProps) {
  const { lang } = useLanguage();

  const t =
    lang === 'es'
      ? { institution: 'Institución', empty: 'No hay diplomas registrados.' }
      : { institution: 'Institution', empty: 'No diplomas on record.' };

  // Newest first. Non-numeric years sort last rather than becoming NaN.
  const sorted = [...diplomasList].sort((a, b) => {
    const ay = Number.parseInt(a.year, 10);
    const by = Number.parseInt(b.year, 10);
    if (Number.isNaN(ay) && Number.isNaN(by)) return 0;
    if (Number.isNaN(ay)) return 1;
    if (Number.isNaN(by)) return -1;
    return by - ay;
  });

  return (
    <Section id={id} tone="canvas" grain>
      <SectionHeading title={title} description={description} align="left" />

      {sorted.length === 0 ? (
        <Reveal>
          <p className="text-ink-soft">{t.empty}</p>
        </Reveal>
      ) : (
        <RevealGroup className="grid gap-x-12 lg:grid-cols-2">
          {sorted.map((d) => (
            <RevealItem key={d.id}>
              <article className="grid grid-cols-[5.5rem_1fr] gap-x-5 border-t border-line py-7 sm:grid-cols-[7rem_1fr] sm:gap-x-6">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-line bg-surface shadow-e1">
                  <Image
                    src={d.image}
                    alt={
                      lang === 'es'
                        ? `Diploma: ${d.title}, ${d.institution}, ${d.year}`
                        : `Diploma: ${d.title}, ${d.institution}, ${d.year}`
                    }
                    fill
                    sizes="(max-width: 640px) 88px, 112px"
                    className="object-cover"
                    quality={60}
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0">
                  <p className="font-heading text-sm font-medium text-brass-ink tabular">
                    {d.year}
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-medium leading-snug text-ink">
                    {d.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">{d.institution}</p>
                  <p className="mt-2.5 max-w-measure text-sm leading-relaxed text-ink-soft">
                    {d.description}
                  </p>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  );
}
