'use client';

import type { Testimonial } from '@/lib/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddTestimonialForm } from '@/components/add-testimonial-form';
import { MessageSquareQuote, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { Section } from '@/components/primitives/section';
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

  const hasTestimonials = testimonialsList.length > 0;

  // The two empty states are genuinely different situations and must not be
  // collapsed: "nothing published yet" invites a submission, "we couldn't load
  // them" is a fault the visitor should be told about rather than silently
  // shown an invitation.
  const empty = loadError
    ? {
        title: lang === 'es' ? 'No pudimos cargar los testimonios' : "We couldn't load testimonials",
        body:
          lang === 'es'
            ? 'Es un problema temporal de nuestro lado. Vuelva a intentarlo en unos minutos.'
            : "This is a temporary problem on our side. Please try again in a few minutes.",
      }
    : {
        title: lang === 'es' ? 'Todavía no hay testimonios' : 'No testimonials yet',
        body:
          lang === 'es'
            ? '¿Ha sido paciente de la consulta? Su experiencia ayuda a quien está decidiendo.'
            : "Have you been a patient here? Your experience helps someone who's deciding.",
      };

  // The first testimonial is given the full width as a pull quote; the rest sit
  // in a denser grid. Uniform cards for every quote is the template reflex.
  const [featured, ...rest] = testimonialsList;

  return (
    <Section id={id} tone="sunk" space="normal">
      <SectionHeading
        title={title}
        description={description}
        align="left"
        className="lg:col-span-5"
      />

      {hasTestimonials ? (
        <>
          <Reveal>
            <figure className="border-y border-line py-9">
              <blockquote className="font-heading text-h3 font-normal italic text-ink">
                <p className="max-w-[38ch]">&ldquo;{featured.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-soft font-body text-sm font-semibold text-brass-ink"
                >
                  {getInitials(featured.name)}
                </span>
                <span>
                  <span className="block font-medium text-ink">{featured.name}</span>
                  {featured.location && (
                    <span className="block text-sm text-ink-soft">{featured.location}</span>
                  )}
                </span>
              </figcaption>
            </figure>
          </Reveal>

          {rest.length > 0 && (
            <RevealGroup
              className={cn(
                'mt-10 grid gap-x-10 gap-y-9',
                rest.length > 1 && 'sm:grid-cols-2',
                rest.length > 2 && 'lg:grid-cols-3',
              )}
            >
              {rest.map((t, i) => (
                <RevealItem key={`${t.name}-${i}`}>
                  <figure className="h-full border-t border-line pt-6">
                    <blockquote className="leading-relaxed text-ink-soft">
                      <p>&ldquo;{t.quote}&rdquo;</p>
                    </blockquote>
                    <figcaption className="mt-4 text-sm">
                      <span className="font-medium text-ink">{t.name}</span>
                      {t.location && <span className="text-ink-soft"> · {t.location}</span>}
                    </figcaption>
                  </figure>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </>
      ) : (
        <Reveal>
          <div className="max-w-measure-tight rounded-2xl border border-dashed border-line-strong bg-surface p-9">
            {loadError ? (
              <AlertCircle className="h-7 w-7 text-warning" aria-hidden="true" />
            ) : (
              <MessageSquareQuote className="h-7 w-7 text-brass-ink" aria-hidden="true" />
            )}
            <h3 className="mt-4 font-heading text-h4 font-medium text-ink">{empty.title}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{empty.body}</p>
          </div>
        </Reveal>
      )}

      <Reveal className="mt-11">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg">
              <MessageSquareQuote className="h-5 w-5" aria-hidden="true" />
              {ctaButtonText}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-medium text-ink">
                {dialogTitleText}
              </DialogTitle>
              <DialogDescription className="text-ink-soft">
                {dialogDescriptionText}
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">
              <AddTestimonialForm onSuccess={() => setIsDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </Reveal>
    </Section>
  );
}
