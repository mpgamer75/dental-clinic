'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';

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
import type { TestimonialFormSubmitData, ZodMessages } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages, formCommon } from '@/lib/data';
import {
  CharacterCounter,
  ConsentNotice,
  RequiredFieldsNote,
  RequiredMark,
  fieldClass,
  fieldLabelClass,
  textareaClass,
} from '@/components/form-feedback';

/** `app.testimonials` CHECKs the quote at 15–500. */
const QUOTE_MAX = 500;

const FIELD_ORDER = ['name', 'quote', 'location'] as const;
type TestimonialField = (typeof FIELD_ORDER)[number];

const isTestimonialField = (key: string): key is TestimonialField =>
  (FIELD_ORDER as readonly string[]).includes(key);

/** Client-side hint; `createTestimonialFormSchema` in src/app/actions.ts is
 *  authoritative and these rules mirror it. */
function createTestimonialSchema(m: ZodMessages) {
  return z.object({
    name: z.string().trim().min(2, { message: m.nameMin }).max(100, { message: m.nameMax }),
    quote: z
      .string()
      .trim()
      .min(15, { message: m.quoteMin })
      .max(QUOTE_MAX, { message: m.quoteMax }),
    location: z.string().trim().max(100, { message: m.locationMax }).optional(),
  });
}

type TestimonialFormValues = z.infer<ReturnType<typeof createTestimonialSchema>>;

interface AddTestimonialFormProps {
  onSuccess?: () => void;
}

export function AddTestimonialForm({ onSuccess }: AddTestimonialFormProps) {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const strings = formTranslations.testimonialForm[lang];
  const messages = actionMessages[lang];
  const c = formCommon[lang];

  const schema = useMemo(() => createTestimonialSchema(messages.zod), [messages.zod]);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: '', quote: '', location: '' },
  });

  const {
    control,
    formState: { isSubmitting },
  } = form;

  async function onValid(values: TestimonialFormValues) {
    const payload: TestimonialFormSubmitData = {
      name: values.name,
      quote: values.quote,
      location: values.location,
    };

    try {
      const result = await submitTestimonialForm(payload, lang);
      if (result.success) {
        toast({ title: strings.successToastTitle, description: result.message });
        form.reset();
        onSuccess?.();
        return;
      }

      toast({
        title: strings.errorToastTitle,
        description: result.message || messages.testimonialError,
        variant: 'destructive',
      });

      if (result.errors) {
        for (const [field, fieldMessages] of Object.entries(result.errors)) {
          if (!fieldMessages?.length || !isTestimonialField(field)) continue;
          form.setError(field, { type: 'server', message: fieldMessages.join(' ') });
        }
        const firstBad = FIELD_ORDER.find((field) => result.errors?.[field]?.length);
        if (firstBad) requestAnimationFrame(() => form.setFocus(firstBad));
      }
    } catch {
      toast({
        title: strings.unexpectedErrorToastTitle,
        description: messages.testimonialError,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(event) => form.handleSubmit(onValid)(event)} noValidate className="space-y-6">
        <RequiredFieldsNote lang={lang} />

        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                {strings.nameLabel}
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={strings.namePlaceholder}
                  autoComplete="name"
                  maxLength={100}
                  aria-required="true"
                  className={fieldClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="quote"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                {strings.quoteLabel}
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={strings.quotePlaceholder}
                  maxLength={QUOTE_MAX}
                  aria-required="true"
                  className={textareaClass}
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex justify-end text-small text-ink-soft">
                <span className="sr-only">
                  {c.characterLimitNote.replace('{{max}}', String(QUOTE_MAX))}
                </span>
                <CharacterCounter
                  control={control}
                  name="quote"
                  max={QUOTE_MAX}
                  remainingLabel={c.charactersRemaining}
                  limitLabel={c.characterLimitReached.replace('{{max}}', String(QUOTE_MAX))}
                />
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>{strings.locationLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={strings.locationPlaceholder}
                  autoComplete="address-level2"
                  maxLength={100}
                  className={fieldClass}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-5 w-5" aria-hidden="true" />
          )}
          {isSubmitting ? strings.submittingButtonText : strings.submitButtonText}
        </Button>

        <p className="text-center text-small leading-relaxed text-ink-soft">{c.testimonialConsent}</p>
        <ConsentNotice lang={lang} />
      </form>
    </Form>
  );
}
