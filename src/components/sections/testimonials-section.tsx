'use client';
import type { Testimonial } from '@/lib/types';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddTestimonialForm } from '@/components/add-testimonial-form';
import { Quote, MessageSquareHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';

interface TestimonialsSectionProps {
  id: string;
  title: string;
  description: string;
  testimonialsList: Testimonial[];
  loadError?: boolean;
  ctaButtonText: string;
  dialogTitleText: string;
  dialogDescriptionText: string;
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function TestimonialsSection({
  id,
  title,
  description,
  testimonialsList,
  loadError = false,
  ctaButtonText,
  dialogTitleText,
  dialogDescriptionText,
}: TestimonialsSectionProps) {
  const { lang } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = () => setIsDialogOpen(false);

  const hasTestimonials = testimonialsList.length > 0;
  const emptyMessage = loadError
    ? lang === 'es'
      ? 'No pudimos cargar los testimonios en este momento. Por favor, vuelve a intentarlo más tarde.'
      : "We couldn't load testimonials right now. Please try again later."
    : lang === 'es'
      ? 'Aún no hay testimonios publicados. ¡Sé el primero en compartir tu experiencia!'
      : 'No testimonials published yet. Be the first to share your experience!';

  return (
    <section id={id} className="bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading
          eyebrow={lang === 'es' ? 'Testimonios' : 'Testimonials'}
          title={title}
          description={description}
        />

        {hasTestimonials ? (
          <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonialsList.map((testimonial, index) => (
              <RevealItem key={index} className="h-full">
                <Card className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <CardContent className="flex flex-grow flex-col p-6">
                    <Quote className="mb-4 h-8 w-8 text-highlight/50" aria-hidden="true" />
                    <p className="mb-6 flex-grow text-base italic leading-relaxed text-foreground/80">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <div className="mt-auto flex items-center gap-3 border-t border-border/50 pt-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary ring-1 ring-primary/15">
                        {getInitials(testimonial.name)}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-primary">{testimonial.name}</p>
                        {testimonial.location && (
                          <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <Reveal className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Quote className="mx-auto mb-4 h-10 w-10 text-highlight/40" aria-hidden="true" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </Reveal>
        )}

        <Reveal className="mt-12 text-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className={cn(
                  buttonVariants({ variant: 'default', size: 'lg' }),
                  'btn-shine shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
                )}
              >
                <MessageSquareHeart className="mr-2 h-5 w-5" />
                {ctaButtonText}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl bg-card shadow-xl sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-center font-heading text-2xl font-bold text-primary">
                  {dialogTitleText}
                </DialogTitle>
                <DialogDescription className="mt-1 text-center text-muted-foreground">
                  {dialogDescriptionText}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <AddTestimonialForm onSuccess={handleSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        </Reveal>
      </div>
    </section>
  );
}
