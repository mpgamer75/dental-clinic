
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 10000); // 10 seconds
  }, [images.length]);

  useEffect(() => {
    if (images.length > 1) {
      startAutoplay();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images.length, startAutoplay]);

  const handleBulletClick = (index: number) => {
    setCurrentIndex(index);
    if (images.length > 1) { // Reset autoplay timer on manual navigation
      startAutoplay();
    }
  };

  if (!images || images.length === 0) {
    return (
      <section className="py-12 md:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p>No images to display for the carousel.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">{visitUsContent.title}</h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          {visitUsContent.description}
        </p>
        
        <div 
            className="relative w-full max-w-4xl mx-auto group" 
            aria-label="Image gallery of clinic and surroundings"
            role="region"
        >
          <div className="carousel-single-image-wrapper shadow-2xl rounded-xl overflow-hidden">
            {images.map((image, index) => (
              <div
                key={`${image.src}-${index}`}
                className={cn(
                  'carousel-single-image-item',
                  index === currentIndex ? 'active' : ''
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                  data-ai-hint={image.hint}
                  priority={index === 0} 
                />
              </div>
            ))}
          </div>
          
          {images.length > 1 && (
            <div className="carousel-bullets-container">
              {images.map((_, index) => (
                <button
                  key={`bullet-${index}`}
                  type="button"
                  className={cn(
                    'carousel-bullet',
                    index === currentIndex ? 'active' : ''
                  )}
                  aria-label={`Go to image ${index + 1}`}
                  onClick={() => handleBulletClick(index)}
                />
              ))}
            </div>
          )}
        </div>

        <Button asChild size="lg" className="mt-12 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105">
          <Link href={contactHref}>{visitUsContent.ctaButton}</Link>
        </Button>
      </div>
    </section>
  );
}
