import Link from 'next/link';
import { getImageProps } from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import { clinicPhotos, type homeContent } from '@/lib/data';
import type { Language } from '@/lib/types';

type HeroCopy = (typeof homeContent)['es']['hero'];

interface HeroProps {
  lang: Language;
  content: HeroCopy;
  appointmentHref: string;
  implantHref: string;
}

/**
 * Hero.
 *
 * One claim, one action, and the place. Three things the previous version did
 * are gone on purpose:
 *
 *  - The three-number trust strip (30+ / 3 / AOD). It sat at the very bottom
 *    of a band 1019px tall, so on a 1440×900 screen the numbers were sliced in
 *    half by the fold, and "AOD" set as a statistic meant nothing to anyone who
 *    did not already know the acronym. The one fact worth a hero — thirty
 *    years in Santiago — now sits on the photograph as its caption, and the
 *    association membership is stated in words in the doctor band.
 *  - The full-bleed photo. It was a 16:9 file cropped into a near-square box
 *    and stretched about 2.4× (the browser picked the 750w variant for a box
 *    1018px tall), which is why it looked soft and why "Dr. F…" was cut at the
 *    edge. Wide screens now get the PORTRAIT shot of the door in a tall panel
 *    it actually fits; phones get the landscape front. One <picture>, so each
 *    device downloads exactly one of them.
 *  - The ambient "drift" animation: two gradient layers looping every 26 s for
 *    as long as the page was open, including off screen.
 *
 * Server component: nothing here needs the client.
 */
export function Hero({ lang, content, appointmentHref, implantHref }: HeroProps) {
  const links = contactLinkLabels(lang);
  const { door, front } = clinicPhotos;
  const alt = front.alt[lang];

  /* Art direction. `sizes` is the width each source is DRAWN at: the portrait
     panel is ~5 of 12 columns on wide screens; the landscape front spans the
     column on phones and tablets. */
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({ src: door.src, width: door.width, height: door.height, quality: 82, alt, sizes: '(min-width: 1024px) 38vw' });
  const {
    props: { srcSet: narrowSrcSet, ...img },
  } = getImageProps({ src: front.src, width: front.width, height: front.height, quality: 80, alt, sizes: '100vw' });

  return (
    <section className="drenched-deep relative isolate overflow-hidden">
      {/* Static light wash. Pre-blurred into the gradient itself (no `filter`),
          and fading to the same hue at zero alpha rather than to `transparent`,
          which interpolates through grey and leaves a muddy ring. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-1/4 top-[-30%] -z-10 h-[70vw] w-[70vw]"
        style={{
          backgroundImage:
            'radial-gradient(closest-side, oklch(var(--brass) / 0.14), oklch(var(--brass) / 0))',
        }}
      />

      <div className="shell items-center gap-y-10 py-[clamp(3rem,7vw,6.5rem)] lg:min-h-[min(calc(100svh-4.5rem),54rem)]">
        {/* ── Copy ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 xl:col-span-6">
          <p className="font-body text-small font-medium tracking-[0.02em] text-brass-lift">
            {content.eyebrow}
          </p>

          <h1 className="mt-4 max-w-[15ch] font-heading text-h1 font-medium text-drench-on">
            {content.title}
          </h1>

          <p className="mt-6 max-w-measure text-body leading-relaxed text-drench-on/80">
            {content.standfirst}
          </p>

          <div className="mt-9 flex flex-col gap-x-7 gap-y-4 sm:flex-row sm:items-center">
            <Button asChild size="xl" variant="brass">
              <Link href={appointmentHref}>{content.ctaPrimary}</Link>
            </Button>
            {/* A text link, not a second button: two equal buttons side by side
                asked the visitor to choose between booking and reading, and
                reading is not the decision this band exists for. */}
            <Link
              href={implantHref}
              className="group/more inline-flex min-h-11 items-center gap-2 self-start font-medium text-drench-on underline-offset-[6px] hover:underline sm:self-auto"
            >
              {content.ctaSecondary}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-base ease-out-quart group-hover/more:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* The two direct channels, at a size a thumb can hit (44px). Phone
              first because the clinic answers it; WhatsApp because that is how
              most Dominican patients would rather ask. */}
          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-drench-on/15 pt-5 text-drench-on/80">
            <li>
              <a
                href={TEL_HREF}
                aria-label={links.callAria}
                className="inline-flex min-h-11 items-center gap-2.5 transition-colors duration-fast hover:text-brass-lift"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="tabular">{links.phone}</span>
              </a>
            </li>
            <li>
              <a
                href={whatsappHref(lang)}
                aria-label={links.whatsappAria}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2.5 transition-colors duration-fast hover:text-brass-lift"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                {links.whatsapp}
              </a>
            </li>
          </ul>
        </div>

        {/* ── Photograph ───────────────────────────────────────── */}
        <figure className="relative m-0 lg:col-span-5 lg:col-start-8 xl:col-span-5 xl:col-start-8">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl sm:aspect-[16/9] lg:aspect-[4/5] lg:max-h-[min(calc(100svh-10rem),46rem)]">
            <picture>
              <source media="(min-width: 1024px)" srcSet={wideSrcSet} sizes="38vw" />
              {/* A plain <img> inside <picture> is the documented art-direction
                  pattern; its props come from getImageProps, so it is still
                  optimised, sized and given a srcset. */}
              <img
                {...img}
                src={img.src}
                srcSet={narrowSrcSet}
                sizes="100vw"
                alt={alt}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[62%_50%] lg:object-[50%_42%]"
              />
            </picture>
            {/* Seats the caption plate on wide screens: a short scrim at the
                foot only, so the photograph keeps its own light elsewhere. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 hidden h-2/5 bg-gradient-to-t from-drench-deep/85 to-drench-deep/0 lg:block"
            />
          </div>
          {/* Overlaid on the portrait panel, where the lower third of the door
              shot is plain glass; BELOW the landscape crop on smaller screens,
              where the clinic's own lettering sits exactly where an overlay
              would go and the two texts would read on top of each other. */}
          <figcaption className="mt-4 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:p-6">
            <p className="font-heading text-h4 font-medium leading-snug text-drench-on">
              {content.photoLead}
            </p>
            <p className="mt-1 text-small text-drench-on/80">{content.photoPlace}</p>
          </figcaption>
        </figure>
      </div>

      {/* Brass hairline closing the band. */}
      <div aria-hidden="true" className="h-px w-full bg-brass/30" />
    </section>
  );
}
