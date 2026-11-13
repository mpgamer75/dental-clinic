'use client';

import Image from 'next/image';
import { useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useForm, useFormContext, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
/* react-day-picker's OWN locales, not date-fns'. They extend the date-fns
   locale with DayPicker's ARIA labels; the date-fns objects translate only the
   month and weekday names, so on /es the navigation buttons were still
   announced as "Go to the Next Month". */
import { es as esLocale, enUS as enLocale } from 'react-day-picker/locale';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Phone,
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
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { submitAppointmentForm } from '@/app/actions';
import type {
  AppointmentFormData,
  AppointmentTimePreference,
  Language,
  ServiceKey,
  ZodMessages,
} from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import {
  actionMessages,
  appointmentBooking,
  appointmentFormExtras,
  formCommon,
  formTranslations,
} from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  CharacterCounter,
  ConsentNotice,
  FormSuccess,
  RequiredFieldsNote,
  RequiredMark,
  fieldClass as baseFieldClass,
  fieldLabelClass,
  textareaClass as baseTextareaClass,
} from '@/components/form-feedback';

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

/** "lunes 16" / "Monday 16" for the shortcut buttons under the date field.
 *  Built from two parts rather than one format call because the separator Intl
 *  puts between weekday and day differs by locale ("lun, 16" / "Mon 16") and a
 *  button label wants none. */
function formatChipDate(date: Date, lang: Language): string {
  const weekday = new Intl.DateTimeFormat(localeTag(lang), { weekday: 'long' }).format(date);
  return `${weekday} ${date.getDate()}`;
}

/**
 * The next few days the clinic is open, starting TOMORROW.
 *
 * Today is left out on purpose. A request sent at four in the afternoon for
 * "today" cannot be honoured by a callback the next morning, and the page
 * already tells anyone who needs to be seen today to phone instead.
 */
function upcomingOpenDays(from: Date, count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isClinicClosed(cursor)) days.push(new Date(cursor));
  }
  return days;
}

/* ============================================================================
   Client-only facts: the booking window and the pointer type
   ----------------------------------------------------------------------------
   Both are read through `useSyncExternalStore` with a server snapshot of
   "unknown", not set from an effect.

   "Today" on the server (Vercel runs UTC) and "today" in the visitor's browser
   are different dates for several hours a day, and the server has no pointer at
   all — so neither may be computed during the server render or the hydration
   pass, or the native input's min/max attributes differ between the HTML and
   the first client render. The effect this replaces avoided that by starting at
   `null` and setting state after mount, which renders the form twice on every
   load. With a server snapshot React hydrates against the "unknown" values and
   then reads the real ones in the same commit, with no second render pass of
   the whole form and no cascading update.
   ========================================================================== */

interface BookingWindow {
  min: string;
  max: string;
  minDate: Date;
  maxDate: Date;
}

/** `getSnapshot` must return the SAME object while nothing changed, or React
 *  re-renders forever; it changes only when the local date does. */
let windowCache: BookingWindow | null = null;

function readBookingWindow(): BookingWindow {
  const start = today();
  const min = toCalendarDate(start);
  if (windowCache?.min !== min) {
    const end = new Date(start);
    end.setDate(end.getDate() + MAX_LEAD_DAYS);
    windowCache = { min, max: toCalendarDate(end), minDate: start, maxDate: end };
  }
  return windowCache;
}

const unknownOnServer = () => null;
/** Nothing to subscribe to: the window is re-read on every render anyway. */
const neverChanges = () => () => {};

const FINE_POINTER = '(pointer: fine)';

function subscribeToPointer(onChange: () => void) {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const readFinePointer = () => window.matchMedia(FINE_POINTER).matches;
const coarseOnServer = () => false;

/* ============================================================================
   Schema
   ========================================================================== */

const TIME_PREFERENCES = ['morning', 'afternoon', 'any'] as const satisfies readonly AppointmentTimePreference[];

/** The column's CHECK. The counter (form-feedback.tsx) appears in the last fifth. */
const REASON_MAX = 500;

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
    /* Optional since migrations/0005: empty is "not given" and the server
       stores NULL. A value that IS typed is still checked as an address.
       No `.toLowerCase()` — the server stores the address as typed (the column
       is citext, and the local part is case-sensitive), and lower-casing it
       here contradicted that. */
    email: z
      .string()
      .trim()
      .max(255, { message: m.emailMax })
      .refine((value) => value === '' || z.email().safeParse(value).success, {
        message: m.emailInvalid,
      }),
    // Required, and required on the server too. A request the clinic cannot
    // call back is not a request.
    phone: z
      .string()
      .trim()
      .min(1, { message: m.phoneInvalid })
      .refine((value) => {
        // 40 is the column's own CHECK. Seven digits padded with thirty spaces
        // satisfies both the digit count and the character class, so without
        // this the value reaches Postgres and comes back as a generic failure
        // on a number that looked perfectly fine on screen.
        if (value.length > 40) return false;
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
 * see `GroupStatus`. `email` stays in group 1 although it is optional: an empty
 * value passes its rule, so the tick still turns over without one, but a
 * half-typed address does not.
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

/**
 * The services that have a render in `public/images/icons/<key>.webp` — the
 * same three the homepage weights above general dentistry. Listed here rather
 * than read off `services` because that export carries every description and
 * must not be pulled into this client bundle; a key missing from this list
 * simply falls into the general group, without a picture.
 */
const SPECIALTY_KEYS: readonly ServiceKey[] = ['implants', 'prosthetics', 'orthodontics'];

/* ============================================================================
   Presentation helpers
   ========================================================================== */

/* The shared field chrome (see form-feedback.tsx) plus this form's ground.
   `ring-offset-card` overrides the `ring-offset-background` baked into the base
   Input/Textarea: this form sits on `bg-card`, not
   `bg-background`, so the 2px focus-ring offset was drawn in canvas tone on top
   of a near-white card — a faint mismatched halo around every focused control. */
const fieldClass = cn(baseFieldClass, 'ring-offset-card');
const textareaClass = cn(baseTextareaClass, 'ring-offset-card');
const labelClass = fieldLabelClass;

/* Focus ring for a choice card whose real control is the visually hidden radio
   beside it (`peer`). Both `peer-focus` and `peer-focus-visible`: a hidden
   radio that is clicked through its label reports :focus but, in Safari, not
   :focus-visible, and with only the latter the card a patient just tapped
   showed no sign of holding focus. */
const choiceFocusClass = cn(
  'peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-card',
  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card',
);

/** What the confirmation panel repeats back, captured before the form is
 *  reset — after `form.reset()` the values it would read are gone. */
interface SubmittedRequest {
  message: string;
  service: string;
  day: string;
  time: string;
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

type GroupKey = keyof typeof GROUPS;
const GROUP_KEYS = Object.keys(GROUPS) as GroupKey[];
const REQUIRED_FIELDS = GROUP_KEYS.flatMap((key) => GROUPS[key] as readonly AppointmentField[]);

/**
 * Which of the three groups currently pass the live schema.
 *
 * Same honesty rule as `GroupStatus`: a group is done when its values would
 * validate, not when its boxes are non-empty. One `useWatch` over every
 * required field, so only the small leaf that calls this re-renders while the
 * patient types — the form body never does.
 */
function useGroupCompletion(schema: AppointmentSchema): Record<GroupKey, boolean> {
  const { control } = useFormContext<AppointmentFormValues>();
  const values = useWatch({ control, name: [...REQUIRED_FIELDS] }) as unknown[];
  const passes = (field: AppointmentField) =>
    (schema.shape[field] as z.ZodTypeAny).safeParse(values[REQUIRED_FIELDS.indexOf(field)]).success;

  return {
    who: GROUPS.who.every(passes),
    what: GROUPS.what.every(passes),
    when: GROUPS.when.every(passes),
  };
}

/**
 * The form at a glance: three named parts, each filling in as it is finished.
 *
 * This is NOT the wizard bar the note on `GroupStatus` rejects — nothing is
 * hidden behind it and it does not move. It answers the question a long form
 * raises before the first field is touched ("how much is this?") with "three
 * short parts", which the step chips cannot do because the second and third
 * are below the fold on a phone.
 *
 * `aria-hidden`: every fact here is already announced by the fieldset legends
 * ("Paso 2 de 3. Completado."), so exposing the strip as well would read the
 * whole structure of the form twice before reaching the first field.
 *
 * Only colour changes on completion — no width or transform animation, so
 * there is nothing for `prefers-reduced-motion` to switch off.
 */
function FormProgress({ schema, labels }: { schema: AppointmentSchema; labels: Record<GroupKey, string> }) {
  const completion = useGroupCompletion(schema);

  return (
    <ol aria-hidden="true" className="grid grid-cols-3 gap-2 sm:gap-3">
      {GROUP_KEYS.map((key, index) => {
        const complete = completion[key];
        return (
          <li key={key} className="min-w-0">
            <span
              className={cn(
                'block h-1.5 rounded-full transition-colors duration-base',
                complete ? 'bg-success' : 'bg-line-strong',
              )}
            />
            <span className="mt-2 flex items-start gap-1.5 text-small leading-snug">
              <span
                className={cn(
                  'shrink-0 font-heading font-medium tabular',
                  complete ? 'text-success' : 'text-brass-ink',
                )}
              >
                {complete ? <Check className="mt-0.5 h-4 w-4" /> : index + 1}
              </span>
              <span className={cn('min-w-0', complete ? 'font-medium text-ink' : 'text-ink-soft')}>
                {labels[key]}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One line above the submit button: what is still missing, or that nothing is.
 *
 * Without it the only way to learn that a required answer was skipped is to
 * press the button and be sent back up the page. It names the PART rather than
 * the field — the part's chip is what the patient scrolls back to find.
 *
 * Not a live region. It changes as fields are filled in, and announcing each
 * change would interrupt the field being typed into; the error summary is the
 * thing that speaks when a submission actually fails.
 */
function SubmitReadiness({
  schema,
  labels,
  lang,
  missingLabel,
  readyLabel,
}: {
  schema: AppointmentSchema;
  labels: Record<GroupKey, string>;
  lang: Language;
  /** Carries `{{parts}}`. */
  missingLabel: string;
  readyLabel: string;
}) {
  const completion = useGroupCompletion(schema);
  const missing = GROUP_KEYS.filter((key) => !completion[key]).map((key) =>
    // The legends are sentence case with no proper nouns, so they can be
    // lowered to sit inside a sentence: "Falta por completar: qué necesita…".
    labels[key].toLocaleLowerCase(localeTag(lang)),
  );

  if (missing.length === 0) {
    return (
      <p className="flex items-start gap-2 text-small font-medium text-success">
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {readyLabel}
      </p>
    );
  }

  const parts = new Intl.ListFormat(localeTag(lang), { style: 'long', type: 'conjunction' }).format(missing);
  return <p className="text-small text-ink-soft">{missingLabel.replace('{{parts}}', parts)}</p>;
}

/** The radio dot drawn inside a choice card. Decorative: the real radio is the
 *  visually hidden <input> beside it, and this shows its state to the eye —
 *  a tinted border alone is easy to miss for someone with low contrast
 *  sensitivity, which is common in this practice's age group. */
function ChoiceDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-fast',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-line-strong bg-background',
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
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

/* ============================================================================
   Form
   ========================================================================== */

export interface AppointmentServiceOption {
  /** What is submitted. The server resolves it with `serviceKeyOf`. */
  value: ServiceKey;
  /** What the patient reads, in their language. */
  label: string;
}

/**
 * The booking form.
 *
 * `serviceOptions` arrives from the server page, built by `serviceOptions(lang)`
 * in src/lib/service-catalog.ts, rather than being built here from `services`:
 * that list carries every service's full description, and importing it into a
 * client component would ship eight paragraphs to the browser to render eight
 * labels.
 */
export function AppointmentForm({ serviceOptions }: { serviceOptions: AppointmentServiceOption[] }) {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const strings = formTranslations.appointmentForm[lang];
  const messages = actionMessages[lang];
  const c = formCommon[lang];
  const t = appointmentBooking[lang];
  const x = appointmentFormExtras[lang];

  const uid = useId();
  const [submitted, setSubmitted] = useState<SubmittedRequest | null>(null);
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

  /* The booking window, client-side only — see "Client-only facts" above. The
     bounds are a convenience; the Zod rules above and in actions.ts are the
     real constraint. */
  const bounds = useSyncExternalStore(neverChanges, readBookingWindow, unknownOnServer);

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

     `false` on the server and during hydration, so the server render and the
     first client render always agree on the native input — which works
     everywhere. */
  const pointerFine = useSyncExternalStore(subscribeToPointer, readFinePointer, coarseOnServer);

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
        const day = parseCalendarDate(values.preferredDate);
        setSubmitted({
          message: result.message,
          // Labels, not the submitted key: this is read by the patient.
          service:
            serviceOptions.find((option) => option.value === values.serviceType)?.label ??
            values.serviceType,
          day: day ? formatLongDate(day, lang) : values.preferredDate,
          time:
            t.timeOptions.find((option) => option.value === values.timePreference)?.label ?? '',
        });
        form.reset();
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
     service picker and the time-of-day group each hand `field.ref` to their
     first radio, the calendar trigger gets it on the pointer path and the
     native input gets it on the touch path. The summary is here so the
     failure is also *stated*, not only indicated by a red field somewhere below
     the fold. */
  function onInvalid(errors: FieldErrors<AppointmentFormValues>) {
    const count = Object.keys(errors).length;
    // Two strings rather than "campo(s)": the parenthesised plural is a
    // template showing through, on the screen a patient sees when they are
    // already being told something went wrong.
    setFormAlert(
      count === 1 ? t.errorSummary.one : t.errorSummary.other.replace('{{count}}', String(count)),
    );
    setLiveMessage('');
  }

  if (submitted) {
    const links = contactLinkLabels(lang);
    const summary = [
      { label: x.successService, value: submitted.service },
      { label: x.successDay, value: submitted.day },
      { label: x.successTime, value: submitted.time },
    ];

    /* The panel used to be a tick, one sentence and a reset button. That left
       the two questions a patient has at this moment unanswered — "did they get
       what I meant?" and "what do I do now?" — so it now repeats the request
       back, says what happens next in order, and keeps the two direct channels
       in reach for a change of plan. No name, phone or reason is echoed: the
       panel stays on screen, and this is often a shared or borrowed phone. */
    return (
      <FormSuccess
        title={c.successTitle}
        message={submitted.message}
        responseTime={c.responseTime}
        resetLabel={c.successAnother}
        onReset={() => setSubmitted(null)}
      >
        <div className="mt-2 space-y-7">
          <div>
            <h4 className="text-small font-medium text-ink">{x.successSummaryTitle}</h4>
            <dl className="mt-2 divide-y divide-line rounded-lg border border-line bg-surface">
              {summary.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-3"
                >
                  <dt className="text-small text-ink-soft">{row.label}</dt>
                  <dd className="text-base font-medium text-ink first-letter:uppercase">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h4 className="text-small font-medium text-ink">{x.successNextTitle}</h4>
            <ol className="mt-3 space-y-3">
              {x.successNext.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-small leading-relaxed text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brass/45 bg-brass-soft font-heading font-medium text-brass-ink tabular"
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 className="text-small font-medium text-ink">{x.successContactTitle}</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="focus-visible:ring-offset-card">
                <a href={TEL_HREF} aria-label={links.callAria}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {links.call}
                  <span className="tabular">{links.phone}</span>
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="focus-visible:ring-offset-card">
                <a
                  href={whatsappHref(lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={links.whatsappAria}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {links.whatsapp}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </FormSuccess>
    );
  }

  const groupLabels = { who: t.groupWho, what: t.groupWhat, when: t.groupWhen };

  const stepLabel = (step: number) =>
    t.stepOf.replace('{{step}}', String(step)).replace('{{total}}', String(TOTAL_STEPS));

  /* `handleSubmit` is called inside the event, not during render. Calling it in
     render to build the handler hands react-hook-form a callback that reads
     `alertRef`, and the React compiler cannot tell that it is not invoked
     synchronously — so it flagged a ref read during render. */
  const submit = (event: React.FormEvent<HTMLFormElement>) =>
    form.handleSubmit(onValid, onInvalid)(event);

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate>
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
          <div className="space-y-4">
            <FormProgress schema={schema} labels={groupLabels} />
            <RequiredFieldsNote lang={lang} />
          </div>

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
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={strings.namePlaceholder}
                      autoComplete="name"
                      // A phone keyboard that capitalises each word and offers
                      // "next" instead of "go": "go" on the first field submits
                      // a form with six answers still missing.
                      autoCapitalize="words"
                      enterKeyHint="next"
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
                      <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder={strings.phonePlaceholder}
                        autoComplete="tel"
                        enterKeyHint="next"
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
                    {/* No asterisk and no aria-required: optional since
                        migration 0005, and the label says so in words. */}
                    <FormLabel className={labelClass}>{strings.emailLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder={strings.emailPlaceholder}
                        autoComplete="email"
                        // An address is not prose: iOS otherwise capitalises
                        // the first letter and "corrects" the part before @.
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="next"
                        maxLength={255}
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
            {/* Service: eight cards to tap, not a dropdown.

                It was a Radix <Select>. On a phone that is a 48px trigger that
                opens a floating list the patient then has to scroll inside, and
                the options are invisible until it is opened — so "what do you
                treat?" was answered only for someone who thought to tap it.
                Every option is now on the page, each a full-width target, with
                the three specialties first and pictured (the same renders the
                homepage uses), because those are what the practice is for.

                The contract is unchanged: each radio's value is the service
                KEY, which is what `submitAppointmentForm` resolves.

                Real radios sharing one `name`, as in the time-of-day group
                below: arrow keys walk all eight across both sub-headings, and
                required/invalid sit on the group, not on each option. */}
            <FormField
              control={control}
              name="serviceType"
              render={({ field, fieldState }) => {
                const labelId = `${uid}-service-label`;
                const helpId = `${uid}-service-help`;
                const errorId = `${uid}-service-error`;
                const describedBy = fieldState.error ? `${helpId} ${errorId}` : helpId;

                const specialties = serviceOptions.filter((option) =>
                  SPECIALTY_KEYS.includes(option.value),
                );
                const general = serviceOptions.filter(
                  (option) => !SPECIALTY_KEYS.includes(option.value),
                );
                // Focus-to-first-error lands on the first option in reading
                // order, whichever group that is.
                const firstValue = (specialties[0] ?? general[0])?.value;

                const radio = (option: AppointmentServiceOption) => (
                  <input
                    type="radio"
                    id={`${uid}-service-${option.value}`}
                    name={field.name}
                    value={option.value}
                    checked={field.value === option.value}
                    onChange={() => {
                      field.onChange(option.value);
                      field.onBlur();
                    }}
                    onBlur={field.onBlur}
                    ref={option.value === firstValue ? field.ref : undefined}
                    className="peer sr-only"
                  />
                );

                const cardTone = (selected: boolean) =>
                  cn(
                    selected
                      ? 'border-primary bg-primary-soft shadow-e1'
                      : 'border-input bg-background hover:border-line-strong',
                    fieldState.error && !selected && 'border-destructive',
                  );

                return (
                  <div className="min-w-0">
                    <p id={labelId} className={labelClass}>
                      {strings.serviceTypeLabel}
                      <RequiredMark />
                    </p>
                    <p id={helpId} className="mt-2 text-small text-ink-soft">
                      {x.serviceHelp}
                    </p>

                    <div
                      role="radiogroup"
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-required="true"
                      aria-invalid={fieldState.error ? true : undefined}
                      className="mt-4 space-y-5"
                    >
                      {specialties.length > 0 && (
                        <div>
                          <p className="text-small font-medium text-ink-soft">{x.serviceSpecialties}</p>
                          {/* A row with the picture on the left on a phone, a
                              tile from 34rem. Three tiles across need ~10rem
                              each for "Prótesis dentales" at this size; below
                              that they are rows, which also keeps the label on
                              one line at 360px. */}
                          <div className="mt-2 grid gap-2.5 min-[34rem]:grid-cols-3">
                            {specialties.map((option) => {
                              const selected = field.value === option.value;
                              return (
                                <div key={option.value} className="relative flex min-w-0">
                                  {radio(option)}
                                  <label
                                    htmlFor={`${uid}-service-${option.value}`}
                                    className={cn(
                                      'relative flex min-h-[4.5rem] w-full cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors duration-fast',
                                      'min-[34rem]:flex-col min-[34rem]:items-start min-[34rem]:gap-2 min-[34rem]:p-4',
                                      choiceFocusClass,
                                      cardTone(selected),
                                    )}
                                  >
                                    {/* Decorative: the label beside it names
                                        the service. Lazy, because this group
                                        is below the first screen. */}
                                    <Image
                                      src={`/images/icons/${option.value}.webp`}
                                      alt=""
                                      width={64}
                                      height={64}
                                      loading="lazy"
                                      className="h-14 w-14 shrink-0 object-contain"
                                    />
                                    <span className="min-w-0 flex-1 text-base font-medium leading-snug text-ink">
                                      {option.label}
                                    </span>
                                    <span className="min-[34rem]:absolute min-[34rem]:right-3 min-[34rem]:top-3">
                                      <ChoiceDot selected={selected} />
                                    </span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-small font-medium text-ink-soft">{x.serviceGeneral}</p>
                        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                          {general.map((option) => {
                            const selected = field.value === option.value;
                            return (
                              <div key={option.value} className="relative flex min-w-0">
                                {radio(option)}
                                <label
                                  htmlFor={`${uid}-service-${option.value}`}
                                  className={cn(
                                    'flex min-h-[3.25rem] w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors duration-fast',
                                    choiceFocusClass,
                                    cardTone(selected),
                                  )}
                                >
                                  <ChoiceDot selected={selected} />
                                  <span className="min-w-0 text-base leading-snug text-ink">{option.label}</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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

            <FormField
              control={control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    {strings.reasonLabel}
                    <RequiredMark />
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
                    <CharacterCounter
                      control={control}
                      name="reason"
                      max={REASON_MAX}
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
                      <RequiredMark />
                    </FormLabel>

                    {usesCalendar ? (
                      <Popover
                        open={calendarOpen}
                        onOpenChange={(open) => {
                          setCalendarOpen(open);
                          // Closed without choosing (Escape, a click outside):
                          // THAT is the moment the field was visited and left,
                          // so it is when "Elija el día" may first appear.
                          if (!open && !field.value) field.onBlur();
                        }}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            {/* `role="combobox"`, not the implicit button role.
                                Two things depend on it, and both are what a
                                Radix <SelectTrigger> does for the same reason:

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
                              onBlur={(event) => {
                                /* Opening the calendar moves focus INTO it,
                                   which is a blur of this button. Passed
                                   straight to react-hook-form that marked the
                                   field touched, and "Elija el día que
                                   prefiere" appeared under a picker the patient
                                   was in the middle of using. A blur into the
                                   calendar is not leaving the field. */
                                const next = event.relatedTarget as Node | null;
                                const dialog = document.getElementById(dateDialogId);
                                if (calendarOpen || (next && dialog?.contains(next))) return;
                                field.onBlur();
                              }}
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
                        {/* A FIXED width, the calendar's own (seven 2.5rem
                            cells + its 1rem padding each side), not `w-auto`.
                            Radix's popper wrapper is `min-width: max-content`,
                            so with an auto width the weekend note below was
                            laid out on ONE line and stretched the popover to
                            509px — on a 390px window the next-month button sat
                            off-screen. `max-w` and `collisionPadding` keep the
                            panel inside the viewport on narrow windows. */}
                        <PopoverContent
                          id={dateDialogId}
                          align="start"
                          collisionPadding={12}
                          className="w-[19.5rem] max-w-[calc(100vw-1.5rem)] p-0"
                        >
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

                    {/* Shortcut days. Most requests are for "as soon as you
                        can", and the native picker — the right control on a
                        phone — still costs four taps and a month grid to say
                        so. Client-only: they are computed from the visitor's
                        own "today", which the server does not know (see
                        "Client-only facts"). They set the same field through
                        the same `commit`, so nothing new is submitted. */}
                    {bounds && (
                      <div className="pt-1">
                        <p id={`${uid}-quick-days`} className="text-small text-ink-soft">
                          {x.quickDatesLabel}
                        </p>
                        <div
                          role="group"
                          aria-labelledby={`${uid}-quick-days`}
                          className="mt-2 flex flex-wrap gap-2"
                        >
                          {upcomingOpenDays(bounds.minDate, 3).map((day) => {
                            const value = toCalendarDate(day);
                            const active = field.value === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => commit(value)}
                                className={cn(
                                  // Intl gives Spanish weekdays in lower case,
                                  // which is right mid-sentence and wrong as
                                  // the first word of a button.
                                  'min-h-11 rounded-lg border px-3.5 text-small font-medium tabular transition-colors duration-fast first-letter:uppercase',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                                  active
                                    ? 'border-primary bg-primary-soft text-ink'
                                    : 'border-input bg-background text-ink hover:border-line-strong',
                                )}
                              >
                                {formatChipDate(day, lang)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
                      <RequiredMark />
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
                                'flex min-h-[3.75rem] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors duration-fast',
                                choiceFocusClass,
                                selected
                                  ? 'border-primary bg-primary-soft shadow-e1'
                                  : 'border-input bg-background hover:border-line-strong',
                                // Nothing is selected when the group is invalid,
                                // so the marking has to land on all three.
                                fieldState.error && !selected && 'border-destructive',
                              )}
                            >
                              <ChoiceDot selected={selected} />
                              <span className="flex min-w-0 flex-col">
                                <span className="text-base font-medium text-ink">{option.label}</span>
                                <span className="text-small text-ink-soft tabular">{option.hint}</span>
                              </span>
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
                be reassurance at all.

                A plain list, not a bordered box: it sits inside the form's own
                card, and a card in a card is a second frame competing with the
                first for the job of saying "this is one thing". The rule above
                already separates it from the fields. */}
            <ul className="space-y-2.5">
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

            <SubmitReadiness
              schema={schema}
              labels={groupLabels}
              lang={lang}
              missingLabel={x.submitMissing}
              readyLabel={x.submitReady}
            />

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
                isSubmitting && 'disabled:bg-primary-hover disabled:opacity-100',
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
