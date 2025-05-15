'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submitContactForm } from '@/app/actions';
import type { ContactFormData } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages } from '@/lib/data';
import { Loader2 } from 'lucide-react';

// Schema is now defined in actions.ts based on language
// const contactFormSchema = z.object({ ... });

export function ContactForm() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const currentFormStrings = formTranslations.contactForm[lang];
  const currentActionMessages = actionMessages[lang];

  // Define schema dynamically for client-side validation hint, though server-side is authoritative
  const clientSchema = z.object({
    name: z.string().min(2, { message: currentActionMessages.zod.nameMin }),
    email: z.string().email({ message: currentActionMessages.zod.emailInvalid }),
    phone: z.string().optional().refine(value => !value || /^[0-9+\s()-]*$/.test(value), {
      message: currentActionMessages.zod.phoneInvalid
    }),
    message: z.string().min(10, { message: currentActionMessages.zod.messageMin }),
  });
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(clientSchema), // Zod schema for client-side, server uses its own
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const {formState: {isSubmitting}} = form;

  async function onSubmit(data: ContactFormData) {
    try {
      // Pass lang to the server action
      const result = await submitContactForm(data, lang); 
      if (result.success) {
        toast({
          title: currentFormStrings.successToastTitle,
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: currentFormStrings.errorToastTitle,
          description: result.message || currentActionMessages.contactError,
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof ContactFormData, { type: 'manual', message: messages.join(', ') });
            }
          });
        }
      }
    } catch {
      toast({
        title: currentFormStrings.unexpectedErrorToastTitle,
        description: currentActionMessages.contactError,
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
                <Input placeholder={currentFormStrings.namePlaceholder} {...field} className="bg-input"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentFormStrings.emailLabel}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={currentFormStrings.emailPlaceholder} {...field} className="bg-input"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentFormStrings.phoneLabel}</FormLabel>
              <FormControl>
                <Input type="tel" placeholder={currentFormStrings.phonePlaceholder} {...field} className="bg-input"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentFormStrings.messageLabel}</FormLabel>
              <FormControl>
                <Textarea placeholder={currentFormStrings.messagePlaceholder} {...field} className="min-h-[120px] bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full shadow-md hover:shadow-lg transition-shadow" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? currentFormStrings.submittingButtonText : currentFormStrings.submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
