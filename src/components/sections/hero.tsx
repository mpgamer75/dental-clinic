import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { ImplantFilm } from '@/components/implant/implant-film';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import type { homeContent } from '@/lib/data';
import type { Language } from '@/lib/types';

type HeroCopy = (typeof homeContent)['es']['hero'];

interface HeroProps {
  lang: Language;
  content: HeroCopy;
  appointmentHref: string;
  implantHref: string;
}

/**
 * Hero: the claim, one action, and the implant going in.
 *
 * Two earlier versions of this band are worth remembering, because each fixed
 * the other's fault and brought its own:
 *
 *  - A photograph of the clinic's glass door on a navy band. The door was the
 *    only photograph there was, it is the same composition the boutique two
 *    doors down uses, and it says nothing about implants.
 *  - The implant film scrubbed by scroll through a pinned band three screens
 *    tall. The picture was right; the mechanism made a visitor scroll 300svh
 *    before the page said anything else, and showed a still to anyone who did
 *    not think to scroll.
 *
 * This keeps the picture and drops the mechanism: the film plays by itself in
 * a case beside the copy (see <ImplantFilm>), and the band is one screen tall.
 *
 * A server component. The headline, the standfirst and every action are in the
 * first HTML; only the case hydrates.
 */
export function Hero({ lang, content, appointmentHref, implantHref }: HeroProps) {
  const links = contactLinkLabels(lang);

  return (
    <section className="drenched-deep relative isolate overflow-hidden">
      {/* The band's light. Three static layers, each painted once: a wash of
          the brand blue from the top-left, a dot lattice that fades out before
          it reaches the copy, and a hairline closing the band. Every gradient
          fades to its own hue at zero alpha rather than to `transparent`,
          which interpolates through grey and leaves a muddy ring. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[20%] -top-[45%] -z-10 h-[78vw] w-[78vw]"
        style={{
          backgroundImage:
            'radial-gradient(closest-side, oklch(var(--primary-base) / 0.5), oklch(var(--primary-base) / 0))',
        }}
      />
      <div aria-hidden="true" className="hero-lattice pointer-events-none absolute inset-0 -z-10" />

      {/* Three grid children — copy, film, direct channels — so their ORDER
          can differ by screen. On a phone the film comes straight after the
          main action and the channels follow it: with the channels inside the
          copy block the film started a full screen down, and most visitors
          arrive on phones. On wide screens the film spans both rows beside
          the copy and the channels sit under the copy as before. */}
      <div className="shell content-center gap-y-9 py-[clamp(2.25rem,5vw,4.5rem)] lg:min-h-[min(calc(100svh-4.5rem),54rem)] lg:grid-rows-[auto_auto] lg:gap-y-0">
        {/* ── Copy ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 lg:row-start-1 xl:col-span-6">
          <p className="hero-rise inline-flex items-center gap-2.5 rounded-full border border-drench-on/20 bg-drench-on/[0.07] px-3.5 py-1.5 text-small font-medium text-brass-lift">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brass-lift" />
            {content.eyebrow}
          </p>

          {/* Not animated: it is the largest text in the first viewport, and
              an element that starts at opacity 0 is not counted as painted. */}
          <h1 className="mt-6 max-w-[17ch] font-heading text-[clamp(2.55rem,1.5rem+4.1vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-drench-on">
            {content.title}
          </h1>

          <p className="hero-rise mt-6 max-w-measure text-body leading-relaxed text-drench-on/80 [--rise-i:1]">
            {content.standfirst}
          </p>

          <div className="hero-rise mt-9 flex flex-col gap-x-7 gap-y-4 [--rise-i:2] sm:flex-row sm:items-center">
            <Button asChild size="xl" variant="brass" className="sheen">
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

        </div>

        {/* ── The film ─────────────────────────────────────────── */}
        <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-center">
          <ImplantFilm
            alt={content.film.alt}
            pauseLabel={content.film.pause}
            playLabel={content.film.play}
            phases={content.film.phases}
          />
        </div>

        {/* ── Direct channels ──────────────────────────────────── */}
        <div className="lg:col-span-7 lg:row-start-2 xl:col-span-6">
          {/* The two direct channels, at a size a thumb can hit (44px). Phone
              first because the clinic answers it; WhatsApp because that is how
              most Dominican patients would rather ask. */}
          <ul className="hero-rise flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-drench-on/15 pt-5 text-drench-on/80 [--rise-i:3] lg:mt-8">
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
      </div>

      <div aria-hidden="true" className="h-px w-full bg-drench-on/15" />
    </section>
  );
}
