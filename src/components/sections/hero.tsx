import Link from 'next/link';
import { ArrowRight, Phone, Sparkles } from 'lucide-react';

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
  /** How many diplomas are on file. Counted from the data, so the figure on
   *  the hero cannot drift from the deck further down the page. */
  diplomaCount: number;
}

/**
 * Hero: the claim, one action, and the implant going in — staged.
 *
 * Earlier versions of this band are worth remembering, because each fixed the
 * last one's fault and brought its own: a photograph of the glass door on a
 * navy band (the composition of the boutique two doors down); the implant
 * film scrubbed by scroll through a band three screens tall (300svh before
 * the page said anything else); then the film playing in a plain case on a
 * flat blue ground, which was correct and looked like a brochure. The clinic's
 * owner asked for the first screen to look like it belongs to this decade.
 *
 * So the band is now a stage, built from five layers that each do one thing:
 *
 *   grid     a fine lattice, strongest behind the film, gone before the copy
 *   aurora   three pools of blue light over it, drifting slowly on wide
 *            screens and still on phones
 *   spot    a soft light that follows the pointer across the band
 *   headline each word rising out of its own line, once, on load
 *   case     the film, edged by a light that travels round its border, tilting
 *            towards the pointer, with two facts floating in front of it
 *
 * Every moving layer animates `transform` or `opacity` only, so the whole
 * stage is composited: nothing is laid out or repainted while it runs. The
 * loops pause when the band leaves the screen and when the film is paused
 * (`data-offscreen` / `data-paused`, set by <ImplantFilm>), and reduced motion
 * removes all of it — the band is then a still, and complete.
 *
 * A server component. The headline, the standfirst and every action are in the
 * first HTML; only the case hydrates.
 */
export function Hero({ lang, content, appointmentHref, implantHref, diplomaCount }: HeroProps) {
  const links = contactLinkLabels(lang);
  const words = content.title.split(' ');

  return (
    <section className="hero-band drenched-deep relative isolate overflow-hidden">
      {/* ── The stage ────────────────────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* The lattice comes FIRST, under the lights. It is a still picture;
            painted after the drifting aurora it had to be composited above
            it as a separate, masked layer on every frame. */}
        <span className="hero-grid" />
        <span className="hero-aurora hero-aurora-a" />
        <span className="hero-aurora hero-aurora-b" />
        <span className="hero-aurora hero-aurora-c" />
        <span className="hero-spot" />
        {/* The band's foot falls back to the ground colour, so the light does
            not end in a hard line where the next band begins. */}
        <span className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-drench-deep to-drench-deep/0" />
      </div>

      {/* Three grid children — copy, film, direct channels — so their ORDER
          can differ by screen. On a phone the film comes straight after the
          main action and the channels follow it: with the channels inside the
          copy block the film started a full screen down, and most visitors
          arrive on phones. On wide screens the film spans both rows beside
          the copy and the channels sit under the copy. */}
      <div className="shell content-center gap-y-10 py-[clamp(2.5rem,5.5vw,5rem)] lg:min-h-[min(calc(100svh-4.5rem),56rem)] lg:grid-rows-[auto_auto] lg:gap-y-0">
        {/* ── Copy ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 lg:row-start-1 xl:col-span-6">
          <p className="hero-rise hero-pill relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-drench-on/20 bg-drench-on/[0.06] py-1.5 pl-2 pr-4 text-small font-medium text-drench-on">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass-lift text-brass-on">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {content.eyebrow}
          </p>

          {/* Each word sits in its own clipped line and rises into it. The
              words are real text in reading order with real spaces between
              them, so a screen reader, a crawler and a browser with no CSS all
              get one ordinary sentence. */}
          <h1 className="mt-6 max-w-[15ch] font-heading text-[clamp(2.7rem,1.4rem+4.9vw,5rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            {words.map((word, index) => (
              <span key={`${word}-${index}`}>
                <span className="hero-word">
                  <span className="hero-word-inner" style={{ '--word-i': index } as React.CSSProperties}>
                    {word}
                  </span>
                </span>
                {index < words.length - 1 ? ' ' : null}
              </span>
            ))}
          </h1>

          <p className="hero-rise mt-6 max-w-measure text-body leading-relaxed text-drench-on/75 [--rise-i:4]">
            {content.standfirst}
          </p>

          <div className="hero-rise mt-9 flex flex-col gap-x-7 gap-y-4 [--rise-i:5] sm:flex-row sm:items-center">
            <Button asChild size="xl" variant="brass" className="hero-cta sheen group/cta">
              <Link href={appointmentHref}>
                {content.ctaPrimary}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-base ease-out-quart group-hover/cta:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
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
        {/* `pb-7` below `sm`: on a phone the two facts hang off the case's
            bottom edge, and the padding is the room they hang into. */}
        <div className="pb-7 sm:pb-0 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-center">
          <ImplantFilm
            alt={content.film.alt}
            pauseLabel={content.film.pause}
            playLabel={content.film.play}
            phases={content.film.phases}
          >
            {/* Two facts, floating in front of the case and tilting with it.
                Both are counted, not claimed: thirty years in practice, and
                the number of documents on file further down this page.

                From `sm` up they hang off the case's sides. On a phone there
                are no sides to hang off — the case is nearly the width of the
                screen, so they were cut by its edge and sat on the crown and
                the bone — and they straddle the bottom edge instead, clear of
                the picture. */}
            <p className="hero-chip -bottom-7 left-1.5 sm:bottom-auto sm:left-0 sm:top-[9%] sm:-translate-x-[36%]">
              <span className="hero-chip-inner">
                <span className="tabular font-heading text-h4 font-semibold text-drench-on">30+</span>
                <span className="text-small leading-tight text-drench-on/75">{content.facts.practice}</span>
              </span>
            </p>
            <p className="hero-chip -bottom-7 right-1.5 [--chip-i:1] sm:bottom-[31%] sm:right-0 sm:translate-x-[24%]">
              <span className="hero-chip-inner">
                <span className="tabular font-heading text-h4 font-semibold text-drench-on">{diplomaCount}</span>
                <span className="text-small leading-tight text-drench-on/75">{content.facts.documents}</span>
              </span>
            </p>
          </ImplantFilm>
        </div>

        {/* ── Direct channels ──────────────────────────────────── */}
        <div className="lg:col-span-7 lg:row-start-2 xl:col-span-6">
          {/* The two direct channels, at a size a thumb can hit (44px). Phone
              first because the clinic answers it; WhatsApp because that is how
              most Dominican patients would rather ask. */}
          <ul className="hero-rise flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-drench-on/15 pt-5 text-drench-on/80 [--rise-i:6] lg:mt-9">
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
