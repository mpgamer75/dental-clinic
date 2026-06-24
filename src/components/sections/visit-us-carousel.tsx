'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';

interface CarouselImage {
  src: string;
  alt: string;
  hint: string;
}

interface VisitUsCarouselProps {
  images: CarouselImage[];
  visitUsContent: { title: string; description: string; ctaButton: string };
  contactHref: string;
}

export function VisitUsCarousel({ images, visitUsContent, contactHref }: VisitUsCarouselProps) {
  const { lang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const count = images.length;

  const labels =
    lang === 'es'
      ? {
          prev: 'Imagen anterior',
          next: 'Imagen siguiente',
          goTo: (n: number) => `Ir a la imagen ${n}`,
          region: 'Galería de imágenes de la clínica',
        }
      : {
          prev: 'Previous image',
          next: 'Next image',
          goTo: (n: number) => `Go to image ${n}`,
          region: 'Clinic image gallery',
        };

  const goNext = useCallback(() => setCurrentIndex((p) => (p + 1) % count), [count]);
  const goPrev = useCallback(() => setCurrentIndex((p) => (p - 1 + count) % count), [count]);

  // Autoplay — only with multiple images, when not paused, and when the user
  // has not requested reduced motion.
  useEffect(() => {
    if (count <= 1 || isPaused || reduceMotion) return;
    intervalRef.current = setInterval(() => setCurrentIndex((p) => (p + 1) % count), 7000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count, isPaused, reduceMotion]);

  if (!images || images.length === 0) {
    return null;
  }

  const multiple = count > 1;

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 text-center md:px-6">
        <SectionHeading title={visitUsContent.title} description={visitUsContent.description} />

        <Reveal
          className="group relative mx-auto w-full max-w-4xl"
          aria-roledescription="carousel"
          aria-label={labels.region}
        >
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
          >
            <div className="carousel-single-image-wrapper">
              {images.map((image, index) => (
                <div
                  key={`${image.src}-${index}`}
                  className={cn('carousel-single-image-item', index === currentIndex && 'active')}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${count}`}
                  aria-hidden={index !== currentIndex}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 896px) 100vw, 896px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    priority={index === 0}
                  />
                </div>
              ))}

              {multiple && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label={labels.prev}
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background hover:text-primary"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label={labels.next}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background hover:text-primary"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {multiple && (
              <div className="carousel-bullets-container">
                {images.map((_, index) => (
                  <button
                    key={`bullet-${index}`}
                    type="button"
                    className={cn('carousel-bullet', index === currentIndex && 'active')}
                    aria-label={labels.goTo(index + 1)}
                    aria-current={index === currentIndex}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal>
          <Button
            asChild
            size="lg"
            className="btn-shine mt-12 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <Link href={contactHref}>{visitUsContent.ctaButton}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
