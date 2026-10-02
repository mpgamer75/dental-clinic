'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { MessageSquareQuote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/* The form, its react-hook-form instance and its zod schema were in the
   homepage's initial JavaScript — measured at ~100 KB gzipped, together with
   the contact form — for a dialog almost nobody opens. It now loads when the
   dialog does, and starts loading a moment earlier, when the pointer or focus
   reaches the button. */
const loadForm = () => import('@/components/add-testimonial-form');
const AddTestimonialForm = dynamic(() => loadForm().then((m) => m.AddTestimonialForm), {
  loading: () => <div className="skeleton h-72 w-full" aria-hidden="true" />,
});

interface TestimonialDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  closeLabel: string;
  /** `outline` under the testimonials themselves; `link` for the quiet
   *  invitation in the doctor band. */
  variant?: 'outline' | 'link';
  className?: string;
}

export function TestimonialDialog({
  triggerLabel,
  title,
  description,
  closeLabel,
  variant = 'outline',
  className,
}: TestimonialDialogProps) {
  const [open, setOpen] = useState(false);
  const prefetch = () => void loadForm();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'link' ? (
          <button
            type="button"
            onPointerEnter={prefetch}
            onFocus={prefetch}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              className,
            )}
          >
            <MessageSquareQuote className="h-5 w-5" aria-hidden="true" />
            {triggerLabel}
          </button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            onPointerEnter={prefetch}
            onFocus={prefetch}
            className={className}
          >
            <MessageSquareQuote className="h-5 w-5" aria-hidden="true" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent closeLabel={closeLabel} className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-[32rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-h4 font-medium text-ink">{title}</DialogTitle>
          <DialogDescription className="text-ink-soft">{description}</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          {open && <AddTestimonialForm onSuccess={() => setOpen(false)} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
