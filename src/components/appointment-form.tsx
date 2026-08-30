'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  useForm,
  useFormContext,
  useWatch,
  type Control,
  type FieldErrors,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { es as esLocale, enUS as enLocale } from 'date-fns/locale';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  PhoneCall,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

/** Weekday indices the clinic is shut, in the shape react-day-picker's
 *  `disabled` matcher wants. Same rule as `isClinicClosed`, stated once. */
const CLOSED_WEEKDAYS = [0, 6];

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

const REASON_MAX = 500;
/** The counter stays hidden until the last fifth of the allowance. See the note
 *  at its render site. */
const REASON_COUNTER_FROM = 400;

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
    timePreference: z.enum([...TIME_PREFERENCES], {
      error: m.timePreferenceRequired,
    }),
    reason: z
      .string()
      .trim()
      .min(10, { message: m.reasonMin })
      .max(REASON_MAX, { message: m.reasonMax })
      .refine((value) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value), {
        message: m.invalidCharacters,
      }),
    isUrgent: z.boolean(),
  });
}

type AppointmentSchema = ReturnType<typeof createAppointmentSchema>;

/** Derived, never hand-written — a hand-written mirror of a Zod schema drifts
 *  the first time either side is edited alone. */
type AppointmentFormValues = z.infer<AppointmentSchema>;

type AppointmentField = keyof AppointmentFormValues;

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
] as const satisfies readonly AppointmentField[];

function isFormField(key: string): key is AppointmentField {
  return (FIELD_ORDER as readonly string[]).includes(key);
}

/**
 * The three fieldsets, and the REQUIRED fields each one owns.
 *
 * `isUrgent` is deliberately absent from group 3: it is optional, so leaving it
 * off must not stop the group reading as finished. Anything listed here is
 * checked against the live schema, which is what keeps the "done" tick honest —
 * see `GroupStatus`.
 *
 * Module-level so the arrays keep a stable identity across renders and the
 * per-group `useWatch` subscriptions never churn.
 */
const GROUPS = {
  who: ['name', 'phone', 'email'],
  what: ['serviceType', 'reason'],
  when: ['preferredDate', 'timePreference'],
} satisfies Record<string, readonly AppointmentField[]>;

const TOTAL_STEPS = Object.keys(GROUPS).length;

/** Closed set — the key drives the icon, so a new entry in data.ts cannot land
 *  without a matching icon here. */
const REASSURANCE_ICON: Record<'call' | 'reply' | 'cost', LucideIcon> = {
  call: PhoneCall,
  reply: Clock,
  cost: ShieldCheck,
};

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
   signal: the message below the field carries the same information.

   `ring-offset-card` overrides the `ring-offset-background` baked into the base
   Input/Textarea/SelectTrigger. The form sits on `bg-card`, not `bg-background`,
   so the 2px focus-ring offset was previously drawn in canvas beige on top of a
   near-white card — a faint mismatched halo around every focused control. */
const invalidClass =
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive';
const fieldClass = cn(
  'h-12 text-base transition-colors duration-fast ring-offset-card focus-visible:border-terracotta',
  invalidClass,
);
const textareaClass = cn(
  'min-h-[9rem] resize-y text-base leading-relaxed transition-colors duration-fast ring-offset-card focus-visible:border-terracotta',
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

/**
 * The step chip in a fieldset legend, and the form's only progress affordance.
 *
 * WHY a progress affordance at all, on a single-page form: the three groups are
 * already the form's information architecture, but nothing ever confirmed that
 * a group was finished. A patient filling this in has no way to tell "I have
 * answered this part" from "I skipped something and will be told about it at
 * the end". Marking a *completed* group is the smallest thing that answers
 * that, and it costs one 2rem chip per group. A wizard-style bar across the top
 * was rejected: this is not a wizard, every field is visible at once, and a bar
 * would be chrome describing something the page already shows.
 *
 * WHY it is honest: completion is not "the boxes are non-empty". Each field is
 * re-checked against the LIVE schema (`schema.shape[field]`), so a chip can only
 * turn over when the values would actually pass validation — the same rules the
 * resolver and (in mirrored form) actions.ts apply. A tick that appears next to
 * an email the server is about to reject would be worse than no tick at all.
 *
 * WHY it is its own component: `useWatch` here subscribes only THIS chip to
 * only ITS OWN fields. Reading the same values from the parent via `watch()`
 * would re-render the entire form on every keystroke.
 */
function GroupStatus({
  step,
  fields,
  schema,
  stepLabel,
  completeLabel,
}: {
  step: number;
  fields: readonly AppointmentField[];
  schema: AppointmentSchema;
  stepLabel: string;
  completeLabel: string;
}) {
  const { control } = useFormContext<AppointmentFormValues>();
  const values = useWatch({ control, name: [...fields] }) as unknown[];

  const complete = fields.every((field, index) => {
    const rule = schema.shape[field] as z.ZodTypeAny;
    return rule.safeParse(values[index]).success;
  });

  return (
    <>
      {/* The visible numeral is decorative — `stepLabel` below states the same
          thing to assistive tech in a form that survives the chip turning into
          a tick. */}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-base font-medium tabular transition-colors duration-base',
          complete
            ? 'border-success/45 bg-success/10 text-success'
            : 'border-brass/45 bg-brass-soft text-brass-ink',
        )}
      >
        {complete ? <Check className="h-4 w-4" /> : step}
      </span>
      <span className="sr-only">
        {stepLabel}
        {complete ? `. ${completeLabel}` : ''}
        {'. '}
      </span>
    </>
  );
}

/** A labelled group. A real <fieldset>/<legend> rather than a styled div, so
 *  the grouping is announced instead of merely drawn.
 *
 *  Groups 2 and 3 pass `divided`, which draws the same hairline the booking
 *  page uses between its own bands. Before it, the only separation between
 *  groups was 2.5rem of air against 1.5rem between fields — a 1.7× ratio, which
 *  is not enough to read as a chapter break, so the three groups ran together
 *  into one wall of controls. */
function FieldGroup({
  step,
  fields,
  schema,
  legend,
  hint,
  stepLabel,
  completeLabel,
  divided,
  children,
}: {
  step: number;
  fields: readonly AppointmentField[];
  schema: AppointmentSchema;
  legend: string;
  hint: string;
  stepLabel: string;
  completeLabel: string;
  divided?: boolean;
  children: React.ReactNode;
}) {
  return (
    // No `border-0` reset: Tailwind's preflight already zeroes the browser's
    // default `2px groove` on <fieldset>, and pairing it with `border-t` would
    // leave the rule's visibility depending on stylesheet emission order.
    <fieldset className={cn('min-w-0 p-0', divided && 'border-t border-line pt-8')}>
      <legend className="w-full">
        <span className="flex items-center gap-3">
          <GroupStatus
            step={step}
            fields={fields}
            schema={schema}
            stepLabel={stepLabel}
            completeLabel={completeLabel}
          />
          <span className="font-heading text-h4 font-medium text-ink">{legend}</span>
        </span>
        <span className="mt-2 block text-small text-ink-soft">{hint}</span>
      </legend>
      <div className="mt-6 space-y-6">{children}</div>
    </fieldset>
  );
}

/**
 * The textarea's character counter.
 *
 * Hidden until 400/500. A counter sitting at "0 / 500" from the moment the page
 * loads is not feedback — it is a target, and on a field that asks a nervous
 * patient to describe a symptom it reads as "you are expected to write 500
 * characters". It only becomes information when the limit is close, so that is
 * when it appears, and it counts DOWN (what is left) rather than up (what has
 * been used), because remaining budget is the thing being decided.
 *
 * `aria-hidden`: a live counter that fires on every keystroke is one of the
 * noisiest things a screen reader can be handed. The same fact is given once,
 * calmly, by the sr-only limit note in the field description — which is read on
 * focus, before any typing — and the browser's own `maxLength` makes overrun
 * impossible rather than merely reported.
 *
 * Its own component so `useWatch` re-renders this <span> and nothing else. The
 * parent previously called `watch('reason')`, which re-rendered the whole form
 * — all eight Controllers, the three radio cards, the urgency toggle, plus a
 * fresh `Intl.DateTimeFormat` in the date field's render prop — once per
 * character typed.
 */
function ReasonCounter({
  control,
  remainingLabel,
  limitLabel,
}: {
  control: Control<AppointmentFormValues>;
  remainingLabel: string;
  limitLabel: string;
}) {
  const value = useWatch({ control, name: 'reason' }) ?? '';
  if (value.length < REASON_COUNTER_FROM) return null;

  const remaining = REASON_MAX - value.length;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 tabular',
        // Weight and wording carry the "you are at the ceiling" state, not a
        // colour: `text-warning` is a mid-light amber that does not clear 4.5:1
        // against the card in the light theme.
        remaining <= 0 ? 'font-medium text-ink' : 'text-ink-soft',
      )}
    >
      {remaining <= 0 ? limitLabel : remainingLabel.replace('{{count}}', String(remaining))}
    </span>
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
  const [calendarOpen, setCalendarOpen] = useState(false);
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
    control,
    formState: { isSubmitting },
  } = form;

  /* Deliberately NO `watch()` in this component.
     Every live value is read either inside a <FormField> render prop (which
     react-hook-form's <Controller> already scopes to that one field) or by a
     leaf component using `useWatch`. The parent therefore re-renders only for
     submit state and the panel/alert state below — never for typing. */

  /* Everything date-shaped is computed after mount, not during render.
     "Today" on the server (Vercel runs UTC) and "today" in the visitor's
     browser are different dates for several hours a day, so computing this
     during render produces attributes that change between the server HTML and
     the first client render — a hydration mismatch, on the one control where a
     wrong value is a wrong appointment. The bounds are a convenience anyway;
     the Zod rules above and in actions.ts are the real constraint. */
  const [bounds, setBounds] = useState<{
    min: string;
    max: string;
    minDate: Date;
    maxDate: Date;
  } | null>(null);

  /* Date entry is a HYBRID, and the split is by pointer type rather than by
     viewport width.

     On touch, `<input type="date">` is the better control by a distance: iOS
     and Android both hand over a full-screen system picker that is faster,
     larger and more familiar than anything rendered in the page — and it is the
     control the patient already knows from every other app on the phone.

     On a mouse or trackpad it is the worse control. The desktop implementations
     are three different things (Chrome's segmented field with a small glyph,
     Firefox's, Safari's), none of them can disable a weekday, and the picker
     target is a few pixels wide. That last point is the deciding one: the
     clinic is shut Saturday and Sunday, and with a native input the only way to
     express that is to let the patient pick a closed day and then tell them off
     for it. `react-day-picker` can simply not offer them — prevention instead
     of catch-and-apologise, which is the whole difference between a form that
     feels considered and one that feels like a test.

     The suggestion button below stays regardless, because the touch path still
     needs the catch, and because a value can arrive on the calendar path too
     (browser autofill, a stale value after switching input device).

     `false` until the effect runs, so the server render and the first client
     render always agree on the native input — which works everywhere. */
  const [pointerFine, setPointerFine] = useState(false);

  useEffect(() => {
    const start = today();
    const end = new Date(start);
    end.setDate(end.getDate() + MAX_LEAD_DAYS);
    setBounds({
      min: toCalendarDate(start),
      max: toCalendarDate(end),
      minDate: start,
      maxDate: end,
    });

    const query = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // The calendar needs its own limits to be meaningful, so it waits for them.
  const usesCalendar = pointerFine && bounds !== null;
  const dayPickerLocale = lang === 'es' ? esLocale : enLocale;

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
     <Select> gets `field.ref`, the calendar trigger gets `field.ref` on the
     pointer path and the native input gets it on the touch path, and the radio
     group hands `field.ref` to its first option. The summary is here so the
     failure is also *stated*, not only indicated by a red field somewhere below
     the fold. */
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

  const stepLabel = (step: number) =>
    t.stepOf.replace('{{step}}', String(step)).replace('{{total}}', String(TOTAL_STEPS));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid, onInvalid)} noValidate>
        {/* Transient status (submitting). Failures are announced by the
            role="alert" panel below instead, so nothing is read twice.

            OUTSIDE the spacing wrapper: `sr-only` is absolutely positioned, so
            as the first child of a `space-y-*` stack it takes no height while
            still pushing a top margin onto the first thing that is actually
            visible — 2rem of dead air under the booking page's rule, present
            whether or not anything was announced. */}
        <p role="status" aria-live="polite" className="sr-only">
          {liveMessage}
        </p>

        <div className="space-y-8">
          {formAlert && (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
              <p className="text-small leading-relaxed">{formAlert}</p>
            </div>
          )}

          {/* The required-field convention, stated BEFORE the fields it governs.
              It used to sit under the submit button, where it explains a
              convention the patient has already had to work out for themselves
              across eight controls. */}
          <p className="text-small text-ink-soft">
            <span aria-hidden="true" className="font-medium text-terracotta">
              *
            </span>{' '}
            {c.requiredFields}
          </p>

          {/* ── 1. Who you are ─────────────────────────────────────────────── */}
          <FieldGroup
            step={1}
            fields={GROUPS.who}
            schema={schema}
            legend={t.groupWho}
            hint={t.groupWhoHint}
            stepLabel={stepLabel(1)}
            completeLabel={t.stepComplete}
          >
            <FormField
              control={control}
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
                control={control}
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
                control={control}
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
          <FieldGroup
            step={2}
            fields={GROUPS.what}
            schema={schema}
            legend={t.groupWhat}
            hint={t.groupWhatHint}
            stepLabel={stepLabel(2)}
            completeLabel={t.stepComplete}
            divided
          >
            <FormField
              control={control}
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
              control={control}
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
                      maxLength={REASON_MAX}
                      aria-required="true"
                      className={textareaClass}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-small text-ink-soft">
                    <span>
                      {t.reasonHelp}
                      {/* Read once, on focus, as part of the field description —
                          which is where a limit belongs for a screen reader. */}
                      <span className="sr-only"> {t.reasonLimitNote}</span>
                    </span>
                    <ReasonCounter
                      control={control}
                      remainingLabel={t.reasonRemaining}
                      limitLabel={t.reasonLimitReached}
                    />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FieldGroup>

          {/* ── 3. When it suits you ───────────────────────────────────────── */}
          <FieldGroup
            step={3}
            fields={GROUPS.when}
            schema={schema}
            legend={t.groupWhen}
            hint={t.groupWhenHint}
            stepLabel={stepLabel(3)}
            completeLabel={t.stepComplete}
            divided
          >
            <FormField
              control={control}
              name="preferredDate"
              render={({ field }) => {
                const picked = parseCalendarDate(field.value);
                // Only reachable on the touch path, or for a value that arrived
                // some other way — the calendar cannot offer a closed day at all.
                const suggestion = picked && isClinicClosed(picked) ? nextOpenDay(picked) : null;
                const dateLabelId = `${uid}-date-label`;
                // Owned here rather than left to Radix's generated id, because
                // the trigger's `aria-controls` is written out explicitly below
                // (role=combobox requires it) and the two have to name the same
                // element. Radix forwards an explicit `id` straight through to
                // the content, overriding its own.
                const dateDialogId = `${uid}-date-dialog`;

                const commit = (value: string) =>
                  form.setValue('preferredDate', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });

                return (
                  <FormItem>
                    <FormLabel id={dateLabelId} className={labelClass}>
                      {t.preferredDateLabel}
                      <RequiredMark srLabel={t.requiredMark} />
                    </FormLabel>

                    {usesCalendar ? (
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            {/* `role="combobox"`, not the implicit button role.
                                Two things depend on it, and both are the same
                                things Radix's own <SelectTrigger> does one field
                                higher up this form:

                                1. `aria-required` is not a supported property of
                                   role=button — assistive tech drops it — but it
                                   IS supported on combobox. Left as a button, the
                                   requiredness of this field would be conveyed to
                                   a screen reader by nothing at all, while the
                                   native-input path two branches down announces
                                   it. Same field, same promise, either device.
                                2. A combobox takes its name from the author, so
                                   `aria-labelledby` points at the field's real
                                   label instead of the button's own text. The
                                   chosen date is then carried by the description
                                   below ("Ha elegido: lunes 10 de agosto…"), so
                                   label AND value are both announced — where a
                                   plain button would have named itself after its
                                   value and never said which field it was. */}
                            <button
                              type="button"
                              role="combobox"
                              aria-expanded={calendarOpen}
                              aria-controls={dateDialogId}
                              aria-required="true"
                              aria-labelledby={dateLabelId}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              className={cn(
                                fieldClass,
                                'flex w-full items-center justify-between gap-3 rounded-md border border-input bg-background px-3.5 text-left',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                'sm:max-w-[18rem]',
                                // Same token the Input's placeholder resolves
                                // to, so an empty trigger and an empty text
                                // field read at identical weight.
                                !picked && 'text-ink-soft',
                              )}
                            >
                              <span className="truncate">
                                {picked
                                  ? formatShortDate(picked, lang)
                                  : t.preferredDatePlaceholder}
                              </span>
                              <CalendarDays
                                className="h-5 w-5 shrink-0 text-ink-faint"
                                aria-hidden="true"
                              />
                            </button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent id={dateDialogId} align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={picked ?? undefined}
                            defaultMonth={picked ?? bounds?.minDate}
                            onSelect={(date) => {
                              if (!date) return;
                              commit(toCalendarDate(date));
                              setCalendarOpen(false);
                            }}
                            // Closed days are DISABLED, not rejected afterwards.
                            disabled={[
                              { dayOfWeek: CLOSED_WEEKDAYS },
                              ...(bounds
                                ? [{ before: bounds.minDate }, { after: bounds.maxDate }]
                                : []),
                            ]}
                            startMonth={bounds?.minDate}
                            endMonth={bounds?.maxDate}
                            locale={dayPickerLocale}
                            // Monday-first in both languages: the clinic's five
                            // open days then sit together and the two closed ones
                            // fall at the end of the row, so the pattern is
                            // legible at a glance. en-US would otherwise start on
                            // Sunday and split the weekend across both edges.
                            weekStartsOn={1}
                            autoFocus
                          />
                          <p className="border-t border-line px-4 py-3 text-small leading-relaxed text-ink-soft">
                            {t.preferredDateWeekendNote}
                          </p>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <FormControl>
                        <Input
                          type="date"
                          min={bounds?.min}
                          max={bounds?.max}
                          aria-required="true"
                          className={cn(
                            fieldClass,
                            'w-full sm:max-w-[18rem]',
                            // The native picker glyph is a fixed dark bitmap, so
                            // on the dark theme it is a black icon on a
                            // near-black field — the only affordance telling
                            // anyone a picker exists, invisible.
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
                    )}

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
                        className="mt-1 focus-visible:ring-offset-card"
                        onClick={() => commit(toCalendarDate(suggestion))}
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
              control={control}
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
                    {/* mt-2, matching <FormItem>'s own `space-y-2`: this group
                        is hand-rolled rather than a FormItem, and at mt-1.5 its
                        label/description gap was the one place in the form that
                        did not sit on the 0.5rem step. */}
                    <p id={descriptionId} className="mt-2 text-small text-ink-soft">
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
              control={control}
              name="isUrgent"
              render={({ field }) => {
                // Read from `field.value`, not an outer `watch('isUrgent')`:
                // <Controller> already re-renders this branch on change, and the
                // outer read re-rendered the entire form to do the same job.
                const isUrgent = field.value;
                return (
                  <FormItem className="space-y-0">
                    <label className="block cursor-pointer">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isUrgent}
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
                );
              }}
            />
          </FieldGroup>

          <div className="space-y-5 border-t border-line pt-8">
            {/* The commitment moment. Everything a hesitant patient wants to know
                before pressing an irreversible-looking button — that it is not
                actually a booking, when someone will get back to them, that it
                costs nothing — was previously either far above (groupWhenHint),
                only shown AFTER success (responseTime), or in the page aside,
                which on a phone renders BELOW the form and so arrives too late to
                be reassurance at all. */}
            <ul className="space-y-2.5 rounded-lg border border-line bg-canvas-sunk/50 p-4">
              {t.submitReassurance.map((item) => {
                const Icon = REASSURANCE_ICON[item.key];
                return (
                  <li
                    key={item.key}
                    className="flex items-start gap-3 text-small leading-relaxed text-ink-soft"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brass-ink" aria-hidden="true" />
                    <span>{item.text}</span>
                  </li>
                );
              })}
            </ul>

            <Button
              type="submit"
              variant="cta"
              size="xl"
              className={cn(
                'w-full focus-visible:ring-offset-card',
                // Same escape the phone CTA on this page already needed, and for
                // the same reason: the Button base is `inline-flex
                // whitespace-nowrap` and `size="xl"` adds 4rem of horizontal
                // padding, so at 320px — a width this page supports — the icon
                // plus "Enviando Solicitud…" measured wider than the card and
                // spilled out of the button. Height is unchanged on one line.
                'h-auto min-h-14 flex-wrap whitespace-normal px-5 py-3 sm:px-8',
                // `disabled` here means "busy", not "unavailable", and the base
                // `disabled:opacity-45` renders the one piece of feedback the
                // patient has — the "Enviando…" label — at under half contrast in
                // both themes. Hold full opacity and shift to the hover shade so
                // the state still reads as a change.
                isSubmitting && 'disabled:bg-terracotta-hover disabled:opacity-100',
              )}
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
          </div>
        </div>
      </form>
    </Form>
  );
}
