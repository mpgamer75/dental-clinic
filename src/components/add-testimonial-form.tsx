'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submitTestimonialForm } from '@/app/actions';
import type { TestimonialFormSubmitData } from '@/lib/types';
import { Loader2, Send, User, MessageSquareHeart, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages } from '@/lib/data';

const inputClass =
  'h-12 border-2 border-muted-foreground/20 bg-background text-base transition-colors focus-visible:border-primary';
const labelClass = 'flex items-center gap-2 text-base font-medium';

interface AddTestimonialFormProps {
  onSuccess?: () => void;
}

export function AddTestimonialForm({ onSuccess }: AddTestimonialFormProps) {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const currentFormStrings = formTranslations.testimonialForm[lang];
  const currentActionMessages = actionMessages[lang];

  const clientSchema = z.object({
    name: z.string().min(2, { message: currentActionMessages.zod.nameMin }),
    quote: z
      .string()
      .min(15, { message: currentActionMessages.zod.quoteMin })
      .max(500, { message: currentActionMessages.zod.quoteMax }),
    location: z.string().optional(),
  });

  const form = useForm<TestimonialFormSubmitData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', quote: '', location: '' },
  });

  const {
    formState: { isSubmitting },
    watch,
  } = form;
  const quoteValue = watch('quote');

  async function onSubmit(data: TestimonialFormSubmitData) {
    try {
      const result = await submitTestimonialForm(data, lang);
      if (result.success) {
        toast({ title: currentFormStrings.successToastTitle, description: result.message });
        form.reset();
        onSuccess?.();
      } else {
        toast({
          title: currentFormStrings.errorToastTitle,
          description: result.message || currentActionMessages.testimonialError,
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof TestimonialFormSubmitData, {
                type: 'manual',
                message: messages.join(', '),
              });
            }
          });
        }
      }
    } catch {
      toast({
        title: currentFormStrings.unexpectedErrorToastTitle,
        description: currentActionMessages.testimonialError,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                <User className="h-4 w-4 text-primary" />
                {currentFormStrings.nameLabel}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={currentFormStrings.namePlaceholder}
                  autoComplete="name"
                  maxLength={100}
                  className={inputClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quote"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                <MessageSquareHeart className="h-4 w-4 text-primary" />
                {currentFormStrings.quoteLabel}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={currentFormStrings.quotePlaceholder}
                  maxLength={500}
                  className="min-h-[120px] resize-none border-2 border-muted-foreground/20 bg-background text-base transition-colors focus-visible:border-primary"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-right text-xs">
                {quoteValue?.length || 0} / 500
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                <MapPin className="h-4 w-4 text-primary" />
                {currentFormStrings.locationLabel}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={currentFormStrings.locationPlaceholder}
                  autoComplete="address-level2"
                  maxLength={100}
                  className={inputClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="btn-shine w-full py-6 text-base font-semibold shadow-md transition-all hover:shadow-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Send className="mr-2 h-5 w-5" />
          )}
          {isSubmitting ? currentFormStrings.submittingButtonText : currentFormStrings.submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
