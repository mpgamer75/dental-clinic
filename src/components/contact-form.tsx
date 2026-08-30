'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { submitContactForm } from '@/app/actions';
import type { ContactFormData } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages, formCommon } from '@/lib/data';
import { Loader2, Send, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { FormSuccess, ConsentNotice } from '@/components/form-feedback';

const inputClass =
  'h-12 border-2 border-muted-foreground/20 bg-background text-base transition-colors focus-visible:border-primary';
const labelClass = 'flex items-center gap-2 text-base font-medium';

export function ContactForm() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const currentFormStrings = formTranslations.contactForm[lang];
  const currentActionMessages = actionMessages[lang];
  const c = formCommon[lang];
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Client-side validation hint; the server action remains authoritative.
  //
  // These rules must MIRROR createContactFormSchema in src/app/actions.ts.
  // They had drifted: the client checked only the character set, while the
  // server additionally required 7-15 digits and capped the message at 1000.
  // So "555" looked valid, submitted cleanly, and came back rejected after a
  // network round-trip with no field highlighted — the worst kind of form
  // error, because nothing on screen said what was wrong.
  const clientSchema = z.object({
    name: z.string().min(2, { message: currentActionMessages.zod.nameMin }),
    email: z.string().email({ message: currentActionMessages.zod.emailInvalid }),
    phone: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value || value.trim() === '') return true;
          // 40 is the column's own CHECK. Seven digits padded with thirty
          // spaces satisfies both the digit count and the character class, so
          // without this the value reaches Postgres and comes back as a generic
          // failure on a number that looked perfectly fine on screen.
          if (value.length > 40) return false;
          const digitsOnly = value.replace(/[^0-9]/g, '');
          return (
            digitsOnly.length >= 7 &&
            digitsOnly.length <= 15 &&
            /^[0-9+\s()-]*$/.test(value)
          );
        },
        { message: currentActionMessages.zod.phoneInvalid },
      ),
    message: z
      .string()
      .min(10, { message: currentActionMessages.zod.messageMin })
      /* 1000, because that is what `app.contact_messages` CHECKs. The cap here
         was 2000, so a longer message passed the browser, passed the server,
         and was refused by Postgres — the patient wrote at length, waited, and
         was told the site had a problem. A client limit that disagrees with the
         column is not a looser limit, it is a delayed one. */
      .max(1000, { message: currentActionMessages.zod.messageMax }),
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const {
    formState: { isSubmitting },
    watch,
  } = form;
  const messageValue = watch('message');

  async function onSubmit(data: ContactFormData) {
    try {
      const result = await submitContactForm(data, lang);
      if (result.success) {
        toast({ title: currentFormStrings.successToastTitle, description: result.message });
        form.reset();
        setSubmittedMessage(result.message);
      } else {
        toast({
          title: currentFormStrings.errorToastTitle,
          description: result.message || currentActionMessages.contactError,
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof ContactFormData, {
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
        description: currentActionMessages.contactError,
        variant: 'destructive',
      });
    }
  }

  if (submittedMessage) {
    return (
      <FormSuccess
        title={c.successTitle}
        message={submittedMessage}
        responseTime={c.responseTime}
        resetLabel={c.successAnother}
        onReset={() => setSubmittedMessage(null)}
      />
    );
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  <Mail className="h-4 w-4 text-primary" />
                  {currentFormStrings.emailLabel}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={currentFormStrings.emailPlaceholder}
                    autoComplete="email"
                    maxLength={255}
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  <Phone className="h-4 w-4 text-primary" />
                  {currentFormStrings.phoneLabel}
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder={currentFormStrings.phonePlaceholder}
                    autoComplete="tel"
                    className={inputClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                <MessageSquare className="h-4 w-4 text-primary" />
                {currentFormStrings.messageLabel}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={currentFormStrings.messagePlaceholder}
                  maxLength={1000}
                  className="min-h-[140px] resize-none border-2 border-muted-foreground/20 bg-background text-base transition-colors focus-visible:border-primary"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-right text-xs">
                {messageValue?.length || 0} / 1000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="cta"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          {isSubmitting ? currentFormStrings.submittingButtonText : currentFormStrings.submitButtonText}
        </Button>

        <ConsentNotice lang={lang} />
      </form>
    </Form>
  );
}
