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
  DialogTrigger
} from '@/components/ui/dialog';
import { AddTestimonialForm } from '@/components/add-testimonial-form';
import { Quote, MessageSquareHeart } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TestimonialsSectionProps {
  id: string; // Added id for anchor linking
  title: string;
  description: string;
  testimonialsList: Testimonial[];
  ctaButtonText: string;
  dialogTitleText: string;
  dialogDescriptionText: string;
}

export function TestimonialsSection({
  id,
  title,
  description,
  testimonialsList,
  ctaButtonText,
  dialogTitleText,
  dialogDescriptionText
}: TestimonialsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = () => {
    setIsDialogOpen(false);
  };

  return (
    <section id={id} className="bg-secondary py-12 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">{title}</h2>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsList.map((testimonial, index) => (
            <Card
              key={index}
              className="shadow-lg bg-card transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl flex flex-col rounded-xl overflow-hidden"
            >
              <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
                <Quote className="h-10 w-10 text-accent mb-4" />
                <p className="text-foreground/80 italic mb-6 flex-grow text-base leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center mt-auto pt-4 border-t border-border/50 w-full justify-center">
                  <Image
                    src={`https://picsum.photos/seed/patient${index}/100/100`}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full mr-4 border-2 border-primary"
                    data-ai-hint="person happy"
                  />
                  <div>
                    <p className="font-semibold text-primary text-lg">{testimonial.name}</p>
                    {testimonial.location && (
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild> 
              <Button className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                "shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105"
              )}>
                <MessageSquareHeart className="mr-2 h-5 w-5" />
                {ctaButtonText}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-card rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary text-center">{dialogTitleText}</DialogTitle>
                <DialogDescription className="text-center text-muted-foreground mt-1">
                  {dialogDescriptionText}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <AddTestimonialForm onSuccess={handleSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
