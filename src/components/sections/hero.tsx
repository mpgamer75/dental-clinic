import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Phone } from 'lucide-react';
import type { homeContent } from '@/lib/data';


type Hero = (typeof homeContent)['es']['hero'];

interface HeroProps {
  content: Hero;
  trust: { value: string; label: string }[];
  appointmentHref: string;
  implantHref: string;
  phone: string;
}

/**
 * Hero.
 *
 * Drenched deep-terracotta band: colour carries the surface here rather than
 * sitting as an accent on a pale page. Asymmetric 7/5 split with the clinic's
 * own photograph bleeding off the right edge — the room is the proof, so it
 * gets real estate instead of a stock illustration.
 *
 * Server component: no state, no effects, so the headline and CTA are in the
 * initial HTML with nothing to hydrate before they're usable.
 */
export function Hero({ content, trust, appointmentHref, implantHref, phone }: HeroProps) {
  return (
    <section className="drenched-deep relative isolate overflow-hidden">
      {/* Ambient light-wash. Decorative only, long and low-amplitude so it
          reads as light moving through a room. Hidden under reduced-motion
          by the global media query, which zeroes the animation. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/4 top-[-30%] h-[70vw] w-[70vw] rounded-full bg-brass/10 blur-3xl animate-drift" />
        <div
          className="absolute -right-1/3 bottom-[-40%] h-[60vw] w-[60vw] rounded-full bg-terracotta/20 blur-3xl animate-drift"
          style={{ animationDelay: '-13s' }}
        />
      </div>

      {/* The shell, so the hero's left rule is the SAME rule every other band
          and the header align to. A hero on its own container is the classic
          "stretched template" tell: it promises a wide composition the rest of
          the page then fails to deliver. */}
      <div className="shell items-center gap-y-12 pb-[clamp(3.5rem,7vw,6rem)] pt-[clamp(4.5rem,9vw,8rem)] lg:pb-0 lg:pt-0">
        {/* ── Copy ─────────────────────────────────────────────── */}
        <div className="lg:col-span-6 lg:py-[clamp(5rem,9vw,9rem)]">
          <p className="flex items-center gap-2 font-body text-small text-brass-lift">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            {content.locationNote}
          </p>

          <h1 className="mt-5 max-w-[16ch] font-heading text-h1 font-medium text-drench-on">
            {content.title}
          </h1>

          <p className="mt-6 max-w-measure text-body leading-relaxed text-drench-on/80">
            {content.standfirst}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="xl" variant="brass">
              <Link href={appointmentHref}>{content.ctaPrimary}</Link>
            </Button>
            <Button asChild size="xl" variant="onDrench">
              <Link href={implantHref}>{content.ctaSecondary}</Link>
            </Button>
          </div>

          <a
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            className="mt-6 inline-flex items-center gap-2 text-drench-on/75 underline-offset-4 transition-colors duration-fast hover:text-brass hover:underline"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="tabular">{phone}</span>
          </a>

          {/* Trust strip — inline with the hero rather than as its own band,
              so the claim and its evidence stay in one eyeful. */}
          {/* Fixed three-column grid rather than flex-wrap: the middle label is
              long enough to wrap onto two lines, which pushed the third item
              onto its own row and clipped it against the band's bottom edge. */}
          <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-drench-on/15 pt-7 sm:grid-cols-3">
            {trust.map((t) => (
              <div key={t.label}>
                <dt className="font-heading text-h3 font-medium text-brass tabular">
                  {t.value}
                </dt>
                <dd className="mt-1 text-small leading-snug text-drench-on/70">{t.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Photograph ───────────────────────────────────────── */}
        <div className="relative lg:col-span-6 lg:col-start-7 lg:h-full">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl lg:absolute lg:inset-y-0 lg:right-[calc(50%-50vw)] lg:aspect-auto lg:h-full lg:w-[calc(100%+50vw-50%)] lg:rounded-none lg:rounded-l-2xl">
            <Image
              src="/images/vitrine_clinique1.jpg"
              alt={content.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
              priority
              quality={82}
            />
            {/* Ties the photograph into the drenched band so it reads as part
                of the surface rather than a pasted-in rectangle. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-drench-deep/70 via-drench-deep/10 to-transparent"
            />
          </div>
        </div>
      </div>

      {/* Brass hairline closing the band. */}
      <div aria-hidden="true" className="h-px w-full bg-brass/30" />
    </section>
  );
}
