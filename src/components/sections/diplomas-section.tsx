'use client';

import { useLanguage } from '@/contexts/language-context';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { CertificateGallery } from '@/components/certificate-gallery';
import { diplomasUi } from '@/lib/data';
import type { Diploma } from '@/lib/types';

interface DiplomasSectionProps {
  id: string;
  title: string;
  description: string;
  diplomasList: Diploma[];
}

/**
 * Credentials, as readable evidence.
 *
 * The section previously rendered each certificate into an 88–112px box at
 * `aspect-[3/4]` with `object-cover`, at `quality={60}`, with `sizes` asking
 * for roughly a seventh of the file's native resolution. Every landscape
 * document — five of the nine — was cropped to a vertical sliver of its
 * middle, and none of them could be read or enlarged. The images were present
 * without being evidence of anything.
 *
 * Three things changed:
 *
 *  1. A uniform 4:3 paper mat with `object-contain`, so nothing is cropped.
 *     See certificate-gallery.tsx for why that beats masonry here.
 *  2. A Radix-Dialog lightbox, because a credential you cannot read is
 *     decoration.
 *  3. The grid moved onto the `wide` track while the prose stayed on
 *     `content`. Widening the text was never the option: it is already at its
 *     measure. Widening the media is the whole point of the breakout grid.
 */
export function DiplomasSection({ id, title, description, diplomasList }: DiplomasSectionProps) {
  const { lang } = useLanguage();
  const t = diplomasUi[lang];

  // Newest first. Non-numeric years sort last rather than becoming NaN.
  const sorted = [...diplomasList].sort((a, b) => {
    const ay = Number.parseInt(a.year, 10);
    const by = Number.parseInt(b.year, 10);
    if (Number.isNaN(ay) && Number.isNaN(by)) return 0;
    if (Number.isNaN(ay)) return 1;
    if (Number.isNaN(by)) return -1;
    return by - ay;
  });

  // Span of the record, for the gutter rail. Same NaN discipline as the sort:
  // a year that is not a number contributes nothing rather than poisoning the
  // range, and if none of them parse the rail is dropped instead of printing
  // "Infinity–-Infinity".
  const years = sorted
    .map((d) => Number.parseInt(d.year, 10))
    .filter((n) => Number.isFinite(n));
  const range =
    years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : null;

  return (
    <Section id={id} tone="canvas" grain>
      {/* Fills the outer gutter with structure instead of dead margin. Hidden
          below `lg`, where that gutter collapses to a thumb's width. */}
      {range && (
        <p className="rail hidden text-eyebrow uppercase text-ink-soft lg:block">
          {t.rail.replace('{{range}}', range)}
        </p>
      )}

      <SectionHeading title={title} description={description} align="left" className="mb-6 md:mb-8" />

      {/* Says out loud what the pictures are: photographs of paper, not
          scans. It is the honest frame for their quality, and it tells the
          visitor the cards do something when pressed. */}
      <Reveal className="mb-11 md:mb-14">
        <p className="max-w-measure text-small text-ink-soft">{t.photoNote}</p>
      </Reveal>

      {sorted.length === 0 ? (
        <Reveal>
          <p className="text-ink-soft">{t.empty}</p>
        </Reveal>
      ) : (
        <CertificateGallery items={sorted} className="col-wide" />
      )}
    </Section>
  );
}
