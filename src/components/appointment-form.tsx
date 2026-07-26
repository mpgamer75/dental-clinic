'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CalendarCheck, Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { submitAppointmentForm } from '@/app/actions';
import type {
  AppointmentFormData,
  AppointmentTimePreference,
  Language,
  ZodMessages,
} from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { actionMessages, appointmentBooking, formCommon, formTranslations } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ConsentNotice, FormSuccess } from '@/components/form-feedback';

/* ============================================================================
   Calendar-date helpers — LOCAL, never UTC.
   ----------------------------------------------------------------------------
   A preferred appointment day is a calendar date, not an instant. The moment it
   is round-tripped through `toISOString()` it becomes a UTC timestamp, and for
   every timezone west of UTC — Santiago de los Caballeros is UTC-4 — the date
   comes back one day earlier. A patient who asks for Tuesday gets booked for
   Monday, silently, and nothing in the UI ever shows the discrepancy.

   So the value that crosses every boundary here is a plain `YYYY-MM-DD` string,
   and every Date built from one is anchored at LOCAL NOON. Noon rather than
   midnight because a midnight anchor lands exactly on a DST transition in the
   jurisdictions that have one, which can shift the day by ±1 hour into the
   previous date.

   These rules are duplicated in `createAppointmentFormSchema` in
   src/app/actions.ts, which stays authoritative. That duplication is deliberate
   and matches the rest of this codebase: the client copy exists so the patient
   sees the problem before a network round-trip, not so the server can trust it.
   ========================================================================== */

const DAY_MS = 86_400_000;
/** Requests further out than this are not useful to the clinic's scheduling. */
const MAX_LEAD_DAYS = 180;
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toCalendarDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` at local noon. Returns null for anything malformed or
 *  non-existent (2026-02-30 rolls over in the Date constructor, so it is
 *  checked back out again rather than trusted). */
function parseCalendarDate(value: string): Date | null {
  const match = CALENDAR_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
}

/** The clinic opens Monday–Friday (contactDetails.schedule). Saturday is closed
 *  too, not only Sunday — offering a Saturday would produce a request nobody
 *  can honour. */
function isClinicClosed(date: Date): boolean {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

/**
 * The nearest open day to `from`.
 *
 * Walks FORWARD normally, but falls back to walking backward once the forward
 * candidate would exceed the booking window. Without that clamp, a weekend
 * selected at the very end of the window produced a suggestion the form then
 * rejected itself: clicking "choose Monday" swapped the "clinic is closed"
 * error for a "too far ahead" one, which is a dead end rather than a fix.
 */
function nextOpenDay(from: Date): Date {
  const limit = today().getTime() + MAX_LEAD_DAYS * DAY_MS;

  const forward = new Date(from);
  while (isClinicClosed(forward)) forward.setDate(forward.getDate() + 1);
  if (forward.getTime() <= limit) return forward;

  const backward = new Date(from);
  while (isClinicClosed(backward)) backward.setDate(backward.getDate() - 1);
  return backward;
}

function localeTag(lang: Language): string {
  return lang === 'es' ? 'es-DO' : 'en-US';
}

function formatLongDate(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(localeTag(lang), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatShortDate(date: Date, lang: Language): string {
  const formatted = new Intl.DateTimeFormat(localeTag(lang), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  // es-DO renders "lunes, 10 de agosto". That comma is Intl's separator and
  // reads as a stray mark inside a sentence-shaped button label; English wants
  // to keep it ("Monday, August 10").
  return lang === 'es' ? formatted.replace(',', '') : formatted;
}

/* ============================================================================
   Schema
   ========================================================================== */

const TIME_PREFERENCES = ['morning', 'afternoon', 'any'] as const satisfies readonly AppointmentTimePreference[];

/**
 * Built from the shared message contract so the schema and the copy cannot
 * drift apart, and declared OUTSIDE the component so the form's value type can
 * be derived from it rather than hand-written.
 */
function createAppointmentSchema(m: ZodMessages) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: m.nameMin })
      .max(100, { message: m.nameMax })
      .refine((value) => !/[\x00-\x1F\x7F]/.test(value), { message: m.invalidCharacters }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: m.emailInvalid })
      .max(255, { message: m.emailMax }),
    // Required, and required on the server too. A request the clinic cannot
    // call back is not a request.
    phone: z
      .string()
      .trim()
      .min(1, { message: m.phoneInvalid })
      .refine((value) => {
        const digits = value.replace(/[^0-9]/g, '');
        return digits.length >= 7 && digits.length <= 15 && /^[0-9+\s()-]*$/.test(value);
      }, { message: m.phoneInvalid }),
    serviceType: z
      .string()
      .min(1, { message: m.serviceTypeRequired })
      .max(100, { message: m.serviceTypeMax }),
    preferredDate: z
      .string()
      .min(1, { message: m.preferredDateRequired })
      .refine((value) => parseCalendarDate(value) !== null, { message: m.preferredDateInvalid })
      .refine((value) => {
        const date = parseCalendarDate(value);
        return date === null || date.getTime() >= today().getTime();
      }, { message: m.preferredDatePast })
      .refine((value) => {
        const date = parseCalendarDate(value);
        return date === null || !isClinicClosed(date);
      }, { message: m.preferredDateClosed })
      .refine((value) => {
        const date = parseCalendarDate(value);
        return date === null || date.getTime() - today().getTime() <= MAX_LEAD_DAYS * DAY_MS;
      }, { message: m.preferredDateTooFar }),
    timePreference: z.enum(TIME_PREFERENCES, {
      required_error: m.timePreferenceRequired,
      invalid_type_error: m.timePreferenceRequired,
    }),
    reason: z
      .string()
      .trim()
      .min(10, { message: m.reasonMin })
      .max(500, { message: m.reasonMax })
      .refine((value) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value), {
        message: m.invalidCharacters,
      }),
    isUrgent: z.boolean(),
  });
}

/** Derived, never hand-written — a hand-written mirror of a Zod schema drifts
 *  the first time either side is edited alone. */
type AppointmentFormValues = z.infer<ReturnType<typeof createAppointmentSchema>>;

/** Order matters: it is the order focus is moved in when the server rejects a
 *  submission, so it must match the visual order of the fields. */
const FIELD_ORDER = [
  'name',
  'phone',
  'email',
  'serviceType',
  'reason',
  'preferredDate',
  'timePreference',
  'isUrgent',
] as const satisfies readonly (keyof AppointmentFormValues)[];

function isFormField(key: string): key is keyof AppointmentFormValues {
  return (FIELD_ORDER as readonly string[]).includes(key);
}

/* ============================================================================
   Presentation helpers
   ========================================================================== */

/* Field chrome uses the design system's own border tokens (`border-input`,
   supplied by the base Input/Textarea) instead of the old
   `border-2 border-muted-foreground/20`, which was a hand-mixed grey that
   matched nothing else on the site and doubled the border weight of every
   control on the page.

   The invalid border keys off `aria-invalid`, which <FormControl> already sets
   from the field's error state — so the attribute a screen reader reads and the
   colour a sighted user sees can never disagree. Colour is never the only
   signal: the message below the field carries the same information. */
const invalidClass =
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive';
const fieldClass = cn(
  'h-12 text-base transition-colors duration-fast focus-visible:border-terracotta',
  invalidClass,
);
const textareaClass = cn(
  'min-h-[9rem] resize-y text-base leading-relaxed transition-colors duration-fast focus-visible:border-terracotta',
  invalidClass,
);
const labelClass = 'text-base font-medium text-ink';

function RequiredMark({ srLabel }: { srLabel: string }) {
  // Visual only. Requiredness is conveyed to assistive tech by `aria-required`
  // on each control; adding an sr-only " (required)" here folded it into the
  // accessible NAME as well, so screen readers announced it twice. The radio
  // group already made this choice — this makes the text fields agree.
  void srLabel;
  return (
    <span aria-hidden="true" className="text-terracotta">
      {' *'}
    </span>
  );
}

/** A labelled group. A real <fieldset>/<legend> rather than a styled div, so
 *  the grouping is announced instead of merely drawn. */
function FieldGroup({
  step,
  legend,
  hint,
  children,
}: {
  step: number;
  legend: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="w-full">
        <span className="flex items-baseline gap-3">
          <span
            aria-hidden="true"
            className="font-heading text-h4 font-medium leading-none text-brass-ink tabular"
          >
            {step}
          </span>
          <span className="font-heading text-h4 font-medium text-ink">{legend}</span>
        </span>
        <span className="mt-1.5 block text-small text-ink-soft">{hint}</span>
      </legend>
      <div className="mt-6 space-y-6">{children}</div>
    </fieldset>
  );
}

/* ============================================================================
   Form
   ========================================================================== */

export function AppointmentForm({ serviceOptions }: { serviceOptions: string[] }) {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const strings = formTranslations.appointmentForm[lang];
  const messages = actionMessages[lang];
  const c = formCommon[lang];
  const t = appointmentBooking[lang];

  const uid = useId();
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const alertRef = useRef<HTMLDivElement>(null);

  const schema = useMemo(() => createAppointmentSchema(messages.zod), [messages.zod]);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    // Validate a field the first time it is left, then keep it live. Not on
    // every keystroke (which scolds someone halfway through typing an email)
    // and not submit-only (which hides every problem until the end).
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      serviceType: '',
      preferredDate: '',
      reason: '',
      isUrgent: false,
      // timePreference is intentionally absent: no option starts selected, so
      // "Cualquier hora" stays a deliberate choice rather than a default the
      // patient never noticed.
    },
  });

  const {
    formState: { isSubmitting },
    watch,
  } = form;
  const isUrgent = watch('isUrgent');
  const reasonValue = watch('reason');

  /* `min`/`max` are computed after mount, not during render.
     "Today" on the server (Vercel runs UTC) and "today" in the visitor's
     browser are different dates for several hours a day, so computing this
     during render produces an attribute that changes between the server HTML
     and the first client render — a hydration mismatch, on the one control
     where a wrong value is a wrong appointment. The attributes are a
     convenience anyway; the Zod rules above and in actions.ts are the real
     constraint. */
  const [dateBounds, setDateBounds] = useState<{ min?: string; max?: string }>({});
  useEffect(() => {
    const start = today();
    const end = new Date(start);
    end.setDate(end.getDate() + MAX_LEAD_DAYS);
    setDateBounds({ min: toCalendarDate(start), max: toCalendarDate(end) });
  }, []);

  async function onValid(values: AppointmentFormValues) {
    setFormAlert(null);
    setLiveMessage(t.liveSubmitting);

    try {
      // Mapped field by field on purpose. A `{ ...values }` spread is what let
      // a renamed field go missing without the compiler noticing; naming each
      // one means the payload type is actually checked.
      const payload: AppointmentFormData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        serviceType: values.serviceType,
        reason: values.reason,
        isUrgent: values.isUrgent,
        preferredDate: values.preferredDate,
        timePreference: values.timePreference,
      };

      const result = await submitAppointmentForm(payload, lang);

      if (result.success) {
        setLiveMessage('');
        toast({ title: strings.successToastTitle, description: result.message });
        form.reset();
        setSubmittedMessage(result.message);
        return;
      }

      const description = result.message || messages.appointmentError;
      setLiveMessage('');
      setFormAlert(description);
      toast({
        title: strings.errorToastTitle,
        description,
        variant: 'destructive',
      });

      if (result.errors) {
        Object.entries(result.errors).forEach(([field, fieldMessages]) => {
          if (!fieldMessages?.length || !isFormField(field)) return;
          form.setError(field, { type: 'server', message: fieldMessages.join(' ') });
        });

        // Put the caret on the first field the server complained about. Without
        // this the only trace of a server-side rejection is a toast that
        // disappears, which is how the extra email/phone checks used to fail:
        // silently and nowhere near the field.
        const firstBadField = FIELD_ORDER.find((field) => result.errors?.[field]?.length);
        if (firstBadField) {
          requestAnimationFrame(() => form.setFocus(firstBadField));
          return;
        }
      }

      requestAnimationFrame(() => alertRef.current?.focus());
    } catch {
      setLiveMessage('');
      setFormAlert(messages.appointmentError);
      toast({
        title: strings.unexpectedErrorToastTitle,
        description: messages.appointmentError,
        variant: 'destructive',
      });
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  }

  /* react-hook-form moves focus to the first invalid control itself
     (`shouldFocusError`), which now actually reaches every control: the
     <Select> gets `field.ref`, and the radio group hands `field.ref` to its
     first option. The summary is here so the failure is also *stated*, not
     only indicated by a red field somewhere below the fold. */
  function onInvalid(errors: FieldErrors<AppointmentFormValues>) {
    const count = Object.keys(errors).length;
    setFormAlert(t.errorSummary.replace('{{count}}', String(count)));
    setLiveMessage('');
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
      <form onSubmit={form.handleSubmit(onValid, onInvalid)} noValidate className="space-y-10">
        {/* Transient status (submitting). Failures are announced by the
            role="alert" panel below instead, so nothing is read twice. */}
        <p role="status" aria-live="polite" className="sr-only">
          {liveMessage}
        </p>

        {formAlert && (
          <div
            ref={alertRef}
            role="alert"
            tabIndex={-1}
            className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-small leading-relaxed">{formAlert}</p>
          </div>
        )}

        {/* ── 1. Who you are ─────────────────────────────────────────────── */}
        <FieldGroup step={1} legend={t.groupWho} hint={t.groupWhoHint}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  {strings.nameLabel}
                  <RequiredMark srLabel={t.requiredMark} />
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    {strings.phoneLabel}
                    <RequiredMark srLabel={t.requiredMark} />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder={strings.phonePlaceholder}
                      autoComplete="tel"
                      maxLength={25}
                      aria-required="true"
                      className={fieldClass}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-small text-ink-soft">
                    {t.phoneHelp}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    {strings.emailLabel}
                    <RequiredMark srLabel={t.requiredMark} />
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
                  <FormDescription className="text-small text-ink-soft">
                    {t.emailHelp}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FieldGroup>

        {/* ── 2. What you need ───────────────────────────────────────────── */}
        <FieldGroup step={2} legend={t.groupWhat} hint={t.groupWhatHint}>
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  {strings.serviceTypeLabel}
                  <RequiredMark srLabel={t.requiredMark} />
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                >
                  <FormControl>
                    {/* `ref` and `onBlur` were both missing here. Without the
                        ref, react-hook-form's focus-to-first-error skipped the
                        one control a keyboard user is least likely to find on
                        their own; without onBlur the field never became
                        "touched", so onTouched validation never ran for it. */}
                    <SelectTrigger
                      ref={field.ref}
                      aria-required="true"
                      className={cn(fieldClass, 'text-left')}
                    >
                      <SelectValue placeholder={strings.serviceTypePlaceholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    {serviceOptions.map((option) => (
                      <SelectItem key={option} value={option} className="py-3 text-base">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  {strings.reasonLabel}
                  <RequiredMark srLabel={t.requiredMark} />
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={strings.reasonPlaceholder}
                    maxLength={500}
                    aria-required="true"
                    className={textareaClass}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-small text-ink-soft">
                  <span>{t.reasonHelp}</span>
                  <span className="tabular">
                    {reasonValue?.length ?? 0} / 500 {c.charactersWord}
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>

        {/* ── 3. When it suits you ───────────────────────────────────────── */}
        <FieldGroup step={3} legend={t.groupWhen} hint={t.groupWhenHint}>
          <FormField
            control={form.control}
            name="preferredDate"
            render={({ field }) => {
              const picked = parseCalendarDate(field.value);
              // Native date inputs can be range-limited but not weekday-limited,
              // so a closed day is caught rather than prevented. Catching it is
              // only acceptable if the recovery is one tap — hence the button.
              const suggestion = picked && isClinicClosed(picked) ? nextOpenDay(picked) : null;

              return (
                <FormItem>
                  <FormLabel className={labelClass}>
                    {t.preferredDateLabel}
                    <RequiredMark srLabel={t.requiredMark} />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={dateBounds.min}
                      max={dateBounds.max}
                      aria-required="true"
                      className={cn(
                        fieldClass,
                        'w-full sm:max-w-[18rem]',
                        // The native picker glyph is a fixed dark bitmap, so on
                        // the dark theme it is a black icon on a near-black
                        // field — the only affordance telling anyone a picker
                        // exists, invisible.
                        '[&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert',
                      )}
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        // A date is picked, not typed: validating on the next
                        // blur would leave a closed day looking accepted.
                        void form.trigger('preferredDate');
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-small text-ink-soft">
                    {picked && !suggestion
                      ? `${t.preferredDatePicked} ${formatLongDate(picked, lang)}`
                      : t.preferredDateHelp}
                  </FormDescription>
                  <FormMessage />
                  {suggestion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() =>
                        form.setValue('preferredDate', toCalendarDate(suggestion), {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        })
                      }
                    >
                      {t.preferredDateFix.replace('{{date}}', formatShortDate(suggestion, lang))}
                    </Button>
                  )}
                </FormItem>
              );
            }}
          />

          {/* Real radios, not a styled listbox: arrow keys move between the
              options for free, the label makes the whole card a hit target
              (far past 44px), and `:checked` drives the selected styling
              without a `has-` variant.

              The required/invalid state belongs on the GROUP, not on each
              radio — per ARIA those are radiogroup properties, and putting
              them on the options announces "required" three times. */}
          <FormField
            control={form.control}
            name="timePreference"
            render={({ field, fieldState }) => {
              const labelId = `${uid}-time-label`;
              const descriptionId = `${uid}-time-help`;
              const errorId = `${uid}-time-error`;
              const describedBy = fieldState.error
                ? `${descriptionId} ${errorId}`
                : descriptionId;

              return (
                <div className="min-w-0">
                  <p id={labelId} className={labelClass}>
                    {t.timePreferenceLabel}
                    <RequiredMark srLabel={t.requiredMark} />
                  </p>
                  <p id={descriptionId} className="mt-1.5 text-small text-ink-soft">
                    {t.timePreferenceHelp}
                  </p>

                  <div
                    role="radiogroup"
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-required="true"
                    aria-invalid={fieldState.error ? true : undefined}
                    className="mt-3 grid gap-3 sm:grid-cols-3"
                  >
                    {t.timeOptions.map((option, index) => {
                      const optionId = `${uid}-time-${option.value}`;
                      const selected = field.value === option.value;
                      return (
                        <div key={option.value}>
                          <input
                            type="radio"
                            id={optionId}
                            name={field.name}
                            value={option.value}
                            checked={selected}
                            onChange={() => {
                              field.onChange(option.value);
                              field.onBlur();
                            }}
                            onBlur={field.onBlur}
                            // Focus-to-first-error lands on the first option.
                            ref={index === 0 ? field.ref : undefined}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={optionId}
                            className={cn(
                              'flex min-h-[3.75rem] cursor-pointer flex-col justify-center rounded-lg border px-4 py-3 transition-colors duration-fast',
                              'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-card',
                              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card',
                              selected
                                ? 'border-terracotta bg-terracotta-soft shadow-e1'
                                : 'border-input bg-background hover:border-line-strong',
                              // Nothing is selected when the group is invalid,
                              // so the marking has to land on all three.
                              fieldState.error && !selected && 'border-destructive',
                            )}
                          >
                            <span className="text-base font-medium text-ink">{option.label}</span>
                            <span className="text-small text-ink-soft tabular">{option.hint}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {fieldState.error && (
                    <p id={errorId} className="mt-2 text-small font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Urgency.
              Was `bg-red-500/10 … border-red-500/50` with a pulsing icon and a
              destructive submit button. Red-alert styling on a request the
              patient chose to make reads as "you did something wrong", and a
              pulse is exactly the wrong register for someone in pain. Warning
              tokens, no animation, and the primary action stays the primary
              action.

              A wrapping <label> around a visually-hidden native checkbox: the
              whole card is the hit target (far past 44px) and the toggle is a
              real checkbox, which the previous Radix Switch could not be —
              <label for> does not activate a <button>, so the old label text
              was decorative. */}
          <FormField
            control={form.control}
            name="isUrgent"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <label className="block cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                  <span
                    className={cn(
                      'flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors duration-base',
                      'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-card',
                              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card',
                      isUrgent
                        ? 'border-warning/60 bg-warning/10'
                        : 'border-input bg-background hover:border-line-strong',
                    )}
                  >
                    <span className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-base font-medium text-ink">
                        {isUrgent && (
                          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                        )}
                        {strings.urgencyLabel}
                      </span>
                      <span className="block text-small text-ink-soft">
                        {isUrgent ? c.urgencyHelpOn : c.urgencyHelpOff}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 inline-flex h-7 w-[3.25rem] shrink-0 items-center rounded-full p-0.5 transition-colors duration-base',
                        isUrgent ? 'bg-warning' : 'bg-line-strong',
                      )}
                    >
                      <span
                        className={cn(
                          'block h-6 w-6 rounded-full bg-surface shadow-e1 transition-transform duration-base',
                          isUrgent ? 'translate-x-[1.5rem]' : 'translate-x-0',
                        )}
                      />
                    </span>
                  </span>
                </label>
              </FormItem>
            )}
          />
        </FieldGroup>

        <div className="space-y-4">
          <Button
            type="submit"
            variant="cta"
            size="xl"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting || undefined}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            )}
            {isSubmitting ? strings.submittingButtonText : strings.submitButtonText}
          </Button>

          <ConsentNotice lang={lang} />

          <p className="text-center text-small text-ink-soft">
            <span aria-hidden="true" className="font-medium text-terracotta">
              *
            </span>{' '}
            {c.requiredFields}
          </p>
        </div>
      </form>
    </Form>
  );
}
