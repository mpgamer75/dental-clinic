'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submitTestimonialForm } from '@/app/actions';
import type { TestimonialFormSubmitData } from '@/lib/types';
import { Loader2, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages } from '@/lib/data';

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
    quote: z.string().min(15, { message: currentActionMessages.zod.quoteMin }).max(500, { message: currentActionMessages.zod.quoteMax }),
    location: z.string().optional(),
  });

  const form = useForm<TestimonialFormSubmitData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      quote: '',
      location: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(data: TestimonialFormSubmitData) {
    try {
      const result = await submitTestimonialForm(data, lang);
      if (result.success) {
        toast({
          title: currentFormStrings.successToastTitle,
          description: result.message,
          // className: 'bg-green-100 border-green-500 text-green-700', // Keep styling consistent with theme
        });
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: currentFormStrings.errorToastTitle,
          description: result.message || currentActionMessages.testimonialError,
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof TestimonialFormSubmitData, { type: 'manual', message: messages.join(', ') });
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
              <FormLabel>{currentFormStrings.nameLabel}</FormLabel>
              <FormControl>
                <Input placeholder={currentFormStrings.namePlaceholder} {...field} className="bg-input" />
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
              <FormLabel>{currentFormStrings.quoteLabel}</FormLabel>
              <FormControl>
                <Textarea placeholder={currentFormStrings.quotePlaceholder} {...field} className="min-h-[100px] bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentFormStrings.locationLabel}</FormLabel>
              <FormControl>
                <Input placeholder={currentFormStrings.locationPlaceholder} {...field} className="bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-3 shadow-md hover:shadow-lg transition-shadow" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
          {isSubmitting ? currentFormStrings.submittingButtonText : currentFormStrings.submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
