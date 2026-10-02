'use client';

import { useMemo, useState } from 'react';
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
import { submitContactForm } from '@/app/actions';
import type { ContactFormData, ZodMessages } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages, formCommon } from '@/lib/data';
import {
  CharacterCounter,
  ConsentNotice,
  FormSuccess,
  RequiredFieldsNote,
  RequiredMark,
  fieldClass,
  fieldLabelClass,
  textareaClass,
} from '@/components/form-feedback';

/** `app.contact_messages` CHECKs `length(message) BETWEEN 10 AND 1000`. */
const MESSAGE_MAX = 1000;

/** Must match the visual order of the fields: it is the order focus is moved
 *  in when the server rejects a submission. */
const FIELD_ORDER = ['name', 'email', 'phone', 'message'] as const;
type ContactField = (typeof FIELD_ORDER)[number];

const isContactField = (key: string): key is ContactField =>
  (FIELD_ORDER as readonly string[]).includes(key);

/**
 * Client-side hint; the server action remains authoritative.
 *
 * These rules MIRROR createContactFormSchema in src/app/actions.ts. They had
 * drifted: the client checked only the character set while the server also
 * required 7–15 digits and capped the message at 1000, so "555" looked valid,
 * submitted cleanly, and came back rejected after a round-trip with no field
 * highlighted.
 *
 * `.trim()` runs BEFORE the address check. Without it, an address pasted with a
 * trailing space — which the server trims and accepts — was refused here as
 * malformed, so the patient never got as far as the server.
 */
function createContactSchema(m: ZodMessages) {
  return z.object({
    name: z.string().trim().min(2, { message: m.nameMin }).max(100, { message: m.nameMax }),
    email: z
      .string()
      .trim()
      .max(255, { message: m.emailMax })
      .refine((value) => z.email().safeParse(value).success, { message: m.emailInvalid }),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          if (!value) return true;
          // 40 is the column's own CHECK. Seven digits padded with thirty
          // spaces satisfies both the digit count and the character class, so
          // without this the value reaches Postgres and comes back as a generic
          // failure on a number that looked perfectly fine on screen.
          if (value.length > 40) return false;
          const digits = value.replace(/[^0-9]/g, '');
          return digits.length >= 7 && digits.length <= 15 && /^[0-9+\s()-]*$/.test(value);
        },
        { message: m.phoneInvalid },
      ),
    message: z
      .string()
      .trim()
      .min(10, { message: m.messageMin })
      .max(MESSAGE_MAX, { message: m.messageMax }),
  });
}

type ContactFormValues = z.infer<ReturnType<typeof createContactSchema>>;

export function ContactForm() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const strings = formTranslations.contactForm[lang];
  const messages = actionMessages[lang];
  const c = formCommon[lang];
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const schema = useMemo(() => createContactSchema(messages.zod), [messages.zod]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    // Same rhythm as the appointment form: checked the first time a field is
    // left, then live. Not on every keystroke, and not only on submit.
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const {
    control,
    formState: { isSubmitting },
  } = form;

  async function onValid(values: ContactFormValues) {
    const payload: Omit<ContactFormData, 'id' | 'submitted_at' | 'status'> = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      message: values.message,
    };

    try {
      const result = await submitContactForm(payload, lang);
      if (result.success) {
        toast({ title: strings.successToastTitle, description: result.message });
        form.reset();
        setSubmittedMessage(result.message);
        return;
      }

      toast({
        title: strings.errorToastTitle,
        description: result.message || messages.contactError,
        variant: 'destructive',
      });

      if (result.errors) {
        for (const [field, fieldMessages] of Object.entries(result.errors)) {
          if (!fieldMessages?.length || !isContactField(field)) continue;
          form.setError(field, { type: 'server', message: fieldMessages.join(' ') });
        }
        // A server-side rejection used to exist only as a toast that vanished,
        // nowhere near the field that had to change. Put the caret on it.
        const firstBad = FIELD_ORDER.find((field) => result.errors?.[field]?.length);
        if (firstBad) requestAnimationFrame(() => form.setFocus(firstBad));
      }
    } catch {
      toast({
        title: strings.unexpectedErrorToastTitle,
        description: messages.contactError,
        variant: 'destructive',
      });
    }
  }

  if (submittedMessage) {
    return (
      <FormSuccess
        title={c.messageSuccessTitle}
        message={submittedMessage}
        responseTime={c.responseTime}
        resetLabel={c.messageSuccessAnother}
        onReset={() => setSubmittedMessage(null)}
      />
    );
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabelClass}>
                  {strings.emailLabel}
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder={strings.emailPlaceholder}
                    autoComplete="email"
                    maxLength={255}
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={fieldLabelClass}>{strings.phoneLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder={strings.phonePlaceholder}
                    autoComplete="tel"
                    maxLength={25}
                    className={fieldClass}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={fieldLabelClass}>
                {strings.messageLabel}
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={strings.messagePlaceholder}
                  maxLength={MESSAGE_MAX}
                  aria-required="true"
                  className={textareaClass}
                  {...field}
                />
              </FormControl>
              {/* The description holds only the sr-only limit note, read once on
                  focus. The visible counter beside it is aria-hidden: it used to
                  BE the description, so "0 / 1000" was announced as what the
                  message box was for. */}
              <FormDescription className="flex justify-end text-small text-ink-soft">
                <span className="sr-only">
                  {c.characterLimitNote.replace('{{max}}', String(MESSAGE_MAX))}
                </span>
                <CharacterCounter
                  control={control}
                  name="message"
                  max={MESSAGE_MAX}
                  remainingLabel={c.charactersRemaining}
                  limitLabel={c.characterLimitReached.replace('{{max}}', String(MESSAGE_MAX))}
                />
              </FormDescription>
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

        <ConsentNotice lang={lang} />
      </form>
    </Form>
  );
}
