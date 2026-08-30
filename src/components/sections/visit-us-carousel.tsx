'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

interface CarouselImage {
  src: string;
  alt: string;
  hint?: string;
}

interface VisitUsCarouselProps {
  id?: string;
  images: CarouselImage[];
  visitUsContent: { title: string; description: string; ctaButton: string };
  contactHref: string;
}

const INTERVAL = 7000;

/**
 * `prefers-reduced-motion`, read after mount.
 *
 * Deliberately not Framer Motion's `useReducedMotion()`, and deliberately not
 * read during render. A media query resolved while rendering makes the server
 * and the client's first pass disagree, and the reduced-motion visitor is the
 * one who loses: the server has no media queries, so it renders the rotating
 * state, and the client agrees with it for exactly one commit before the
 * effect corrects it. That is one live autoplay timer handed to somebody who
 * asked the operating system for none. Starting at `false` and narrowing to
 * the truth in an effect is the same discipline reveal.tsx and implant-stage
 * already follow.
 */
function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return reduce;
}

/**
 * The practice, photographed.
 *
 * Built to the APG carousel pattern, which for an auto-rotating carousel is
 * mostly a list of ways to give the reader control back:
 *
 *   · an explicit pause/play control — the one requirement that cannot be
 *     satisfied by any amount of implicit cleverness;
 *   · rotation suspends while the pointer is over the region or focus is
 *     inside it, and stops for good the moment the visitor picks a slide
 *     themselves;
 *   · the slide container is `aria-live="off"` while it is rotating (nobody
 *     wants a photo caption read aloud every seven seconds) and `polite` once
 *     it is not, so manual navigation IS announced;
 *   · left/right arrows move between the indicators, which is what makes the
 *     dot row usable without a mouse.
 *
 * `prefers-reduced-motion` still wins over all of it: the timer never starts,
 * and the pause control is not rendered because there would be nothing for it
 * to pause.
 */
export function VisitUsCarousel({
  id = 'la-consulta',
  images,
  visitUsContent,
  contactHref,
}: VisitUsCarouselProps) {
  const { lang } = useLanguage();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  /* Transient, unlike `autoplay`. Tracked as two independent facts rather than
     one `suspended` flag: with a single flag, moving the mouse off the region
     while a control inside it still holds keyboard focus would restart the
     rotation under that reader's cursor. */
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const count = images.length;

  const t =
    lang === 'es'
      ? {
          prev: 'Imagen anterior',
          next: 'Imagen siguiente',
          region: 'Galería de la consulta',
          dots: 'Elegir imagen',
          pause: 'Pausar la reproducción automática',
          play: 'Reanudar la reproducción automática',
          slide: (n: number) => `Ir a la imagen ${n} de ${count}`,
        }
      : {
          prev: 'Previous image',
          next: 'Next image',
          region: 'Practice gallery',
          dots: 'Choose an image',
          pause: 'Pause automatic rotation',
          play: 'Resume automatic rotation',
          slide: (n: number) => `Go to image ${n} of ${count}`,
        };

  /** Picking a slide by hand is a statement of intent: stop rotating for good. */
  const select = useCallback((i: number) => {
    setActive(i);
    setAutoplay(false);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => select((active + dir + count) % count),
    [active, count, select],
  );

  const rotating = autoplay && !hovered && !focused && !reduce && count > 1;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % count), INTERVAL);
    return () => window.clearInterval(timer);
  }, [rotating, count]);

  /**
   * Arrow keys across the indicator row.
   *
   * Focus is moved imperatively rather than through a roving `tabIndex`: every
   * dot is already a real tab stop, and the node being focused is mounted, so
   * this needs no effect to sequence it against the re-render.
   */
  const onDotsKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target =
        event.key === 'ArrowRight'
          ? (active + 1) % count
          : event.key === 'ArrowLeft'
            ? (active - 1 + count) % count
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? count - 1
                : null;

      if (target === null) return;
      event.preventDefault();
      select(target);
      dotsRef.current[target]?.focus();
    },
    [active, count, select],
  );

  if (count === 0) return null;
  const multiple = count > 1;

  return (
    /* `sunk`, breaking the diplomas → consulta → preguntas run of three
       identical canvas bands. It also does the photographs a favour: a slightly
       recessed ground reads as a mount, where canvas let the images float. */
    <Section id={id} tone="sunk" space="tight">
      <div className="grid items-center gap-x-[6%] gap-y-10 lg:col-span-12 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <SectionHeading
            title={visitUsContent.title}
            description={visitUsContent.description}
            align="left"
            className="mb-6"
          />
          <Reveal>
            <Button asChild variant="outline" size="lg">
              <Link href={contactHref}>{visitUsContent.ctaButton}</Link>
            </Button>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-8 lg:col-start-5">
          {/* The region covers the viewport AND its controls, so tabbing from
              an arrow to a dot does not read as leaving and re-entering. */}
          <div
            role="group"
            aria-roledescription="carousel"
            aria-label={t.region}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            /* React's onFocus/onBlur are focusin/focusout, so they fire for
               descendants too. The relatedTarget check keeps focus MOVING
               between the arrows and the dots from reading as leaving. */
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setFocused(false);
              }
            }}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-e3">
              <div
                className="absolute inset-0"
                /* Silent while it rotates; announces once it does not. */
                aria-live={rotating ? 'off' : 'polite'}
                aria-atomic="false"
              >
                {images.map((img, i) => (
                  <div
                    key={img.src}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} / ${count}`}
                    aria-hidden={i !== active}
                    className={cn(
                      'absolute inset-0 transition-opacity duration-slower ease-out-quart',
                      i === active ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 62vw"
                      className="object-cover"
                      quality={78}
                      /* No `priority` here. This band sits well below the fold, so
                         preloading it competes with the hero photograph for the
                         LCP and fetches an image most visitors never scroll to. */
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {multiple && (
                <>
                  {/* Opaque, not `bg-surface/85 backdrop-blur`. These controls
                      sit on top of a photograph that fills the frame, so the
                      blur was resampling a full-bleed image behind two discs
                      for as long as the section was on screen — and the
                      translucent fill was letting the picture through behind
                      the chevron. `ring-offset-background` for the same reason:
                      the default ring offset is white, so the focus halo was a
                      white ring on a white-ish photograph. */}
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={t.prev}
                    className="absolute left-3 top-1/2 z-raised flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-e2 transition-colors duration-fast hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={t.next}
                    className="absolute right-3 top-1/2 z-raised flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-e2 transition-colors duration-fast hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {multiple && (
              <div className="mt-5 flex items-center gap-2">
                <div
                  role="group"
                  aria-label={t.dots}
                  onKeyDown={onDotsKeyDown}
                  className="flex items-center gap-2"
                >
                  {images.map((img, i) => (
                    <button
                      key={img.src}
                      ref={(el) => {
                        dotsRef.current[i] = el;
                      }}
                      type="button"
                      aria-label={t.slide(i + 1)}
                      aria-current={i === active ? 'true' : undefined}
                      onClick={() => select(i)}
                      /* The ring is on the BUTTON, not on the bar inside it.
                         A ring is a box-shadow, so on the bar it inherited the
                         `scale-x-50` and the halo came out squashed on every
                         inactive dot. No offset either: the button's box
                         already bleeds 20px upwards (`-my-5`, which buys the
                         44px target without spending 44px of layout), so an
                         offset ring would spill over the photograph above. */
                      className="group/dot -my-5 flex h-11 items-center rounded-lg py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {/* Every dot reserves the ACTIVE width and the inactive
                          ones scale down into it. The bar used to grow from
                          `w-5` to `w-10`, which is a width animation: width is
                          a layout property, so each of those 220ms transitions
                          relaid out the indicator row and everything after it.
                          A horizontal scale paints the identical 20px and 40px
                          bars and never leaves the compositor. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'block h-1 w-10 origin-center rounded-full',
                          'transition-[transform,background-color] duration-base ease-out-quart',
                          i === active
                            ? 'scale-x-100 bg-terracotta'
                            : 'scale-x-50 bg-line-strong group-hover/dot:bg-brass-ink',
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Rendered only where autoplay can actually happen: under
                    reduced motion nothing rotates, and a control that pauses
                    nothing is worse than no control. */}
                {!reduce && (
                  <button
                    type="button"
                    onClick={() => setAutoplay((on) => !on)}
                    aria-label={autoplay ? t.pause : t.play}
                    title={autoplay ? t.pause : t.play}
                    className="-my-2 ml-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft transition-colors duration-fast hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {autoplay ? (
                      <Pause className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Play className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
