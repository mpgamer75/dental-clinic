'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
 * The practice, photographed.
 *
 * Autoplay stops permanently once the visitor takes manual control, and never
 * starts under `prefers-reduced-motion`. The previous version only paused on
 * hover, so it kept moving under a reader's eye on touch devices where there
 * is no hover to detect.
 *
 * The slide indicators are real 44px targets: the visible bar is slim, but the
 * button's padded box meets the touch minimum.
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
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const count = images.length;

  const t =
    lang === 'es'
      ? {
          prev: 'Imagen anterior',
          next: 'Imagen siguiente',
          region: 'Galería de la consulta',
          slide: (n: number) => `Ir a la imagen ${n} de ${count}`,
        }
      : {
          prev: 'Previous image',
          next: 'Next image',
          region: 'Practice gallery',
          slide: (n: number) => `Go to image ${n} of ${count}`,
        };

  const select = useCallback((i: number) => {
    setActive(i);
    setAutoplay(false);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => select((active + dir + count) % count),
    [active, count, select],
  );

  useEffect(() => {
    if (!autoplay || reduce || count < 2) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % count), INTERVAL);
    return () => window.clearInterval(timer);
  }, [autoplay, reduce, count]);

  if (count === 0) return null;
  const multiple = count > 1;

  return (
    <Section id={id} tone="canvas" space="tight">
      <div className="grid items-center gap-x-14 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
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

        <Reveal className="lg:col-span-8">
          <div
            className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-e3"
            aria-roledescription="carousel"
            aria-label={t.region}
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

            {multiple && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={t.prev}
                  className="absolute left-3 top-1/2 z-raised flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/85 text-ink shadow-e2 backdrop-blur transition-colors duration-fast hover:bg-surface hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={t.next}
                  className="absolute right-3 top-1/2 z-raised flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/85 text-ink shadow-e2 backdrop-blur transition-colors duration-fast hover:bg-surface hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {multiple && (
            <div className="mt-5 flex items-center gap-2">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  ref={(el) => {
                    dotsRef.current[i] = el;
                  }}
                  type="button"
                  aria-label={t.slide(i + 1)}
                  aria-current={i === active}
                  onClick={() => select(i)}
                  className="group/dot -my-5 flex h-11 items-center py-5 focus-visible:outline-none"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-1 rounded-full transition-all duration-base ease-out-quart group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-ring group-focus-visible/dot:ring-offset-4 group-focus-visible/dot:ring-offset-background',
                      i === active
                        ? 'w-10 bg-terracotta'
                        : 'w-5 bg-line-strong group-hover/dot:bg-brass-ink',
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </Section>
  );
}
