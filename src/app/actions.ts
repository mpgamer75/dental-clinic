'use server';

/* ============================================================================
   PUBLIC FORM INTAKE — contact, appointment, testimonial
   ----------------------------------------------------------------------------
   These three functions are the clinic's entire intake channel, and a server
   action is a public HTTP endpoint: anything the browser can call, a script can
   call, with whatever payload it likes. Every guard below therefore assumes the
   caller is hostile and the form component does not exist.

   The order is fixed and each step earns its place:

     1. rate limit   — before parsing, so a flood costs one indexed upsert
                       rather than a Zod parse and a moderation pass per hit
     2. validate     — per-language Zod, deliberately duplicating the client
     3. verify       — the checks Zod cannot express (disposable-mail domains,
                       repeated-digit phone numbers)
     4. moderate     — on the text exactly as typed, before sanitising, because
                       the obfuscation is the signal
     5. sanitise     — then re-validate, so what is stored is provably what the
                       schema admitted
     6. insert       — parameterised, via Drizzle, with `status` set here and
                       never taken from the caller
     7. audit        — a non-identifying trace that the submission happened

   Three defects this file used to ship, named so they are not reintroduced:

   * `status` was part of the insert payload derived from a moderation score, so
     a direct POST could publish a self-approved testimonial onto the homepage.
     Testimonials now always insert as 'pending_approval'; the score is stored
     only to order the review queue. There is no auto-approve path.

   * The preferred day and time-of-day were formatted into a Spanish sentence
     and prepended to the free-text `reason`, because the table had no columns
     for them. It has both now, so `reason` holds only what the patient wrote
     and the clinic can sort its book by the date people actually asked for.

   * Every failure logged the raw error object, which carries the row three
     separate ways: node-postgres puts it in `error.cause.detail`, and Drizzle's
     wrapper exposes the bound values as an own `params` key and inlines them in
     its own message. A constraint violation therefore copied a patient's email,
     phone and reason for visiting into the platform log. All logging here goes
     through `formatDatabaseFailure` in @/lib/db-errors, which reads only the
     SQLSTATE, constraint, table and schema.
   ========================================================================== */

import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import {
  moderateContactMessage,
  moderateTestimonial,
  sanitizeText,
  validateEmail,
  validatePhone,
  type ModerationResult,
} from '@/lib/content-moderation';
import { actionMessages, appointmentBooking, contactDetails } from '@/lib/data';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { checkPublicFormLimit } from '@/lib/rate-limit';
import { getRequestContext } from '@/lib/request-context';
import {
  appointments,
  contactMessages,
  testimonials,
  TIME_PREFERENCES,
  type TimePreference,
} from '@/lib/schema';
import type {
  AppointmentFormData,
  AppointmentTimePreference,
  ContactFormData,
  Language,
  TestimonialFormSubmitData,
} from '@/lib/types';

/* The list the Zod enum is built from is the list the CHECK constraint is built
   from — `TIME_PREFERENCES` in schema.ts renders both — and the `satisfies`
   keeps the form's own union in step with it. Add a fourth time-of-day to the
   database without adding it to `AppointmentTimePreference` and the build stops
   on this line rather than on an insert in production. */
const TIME_PREFERENCE_VALUES = TIME_PREFERENCES satisfies readonly AppointmentTimePreference[];

/** What every one of these actions returns. The forms read `success` for the
 *  toast, `message` for its body, and map `errors` onto their own fields. */
interface FormActionResult {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
}

/* ============================================================================
   Copy that is not in data.ts
   ----------------------------------------------------------------------------
   The project's rule is that site copy lives in `src/lib/data.ts`. These
   strings break it, and they break it the same way the moderation rejections
   already did before this rewrite — they are here so that both sets can be
   lifted into `actionMessages` together rather than one of them being moved and
   the other quietly left behind. Nothing here is rendered anywhere else.
   ========================================================================== */

/**
 * Shown when the rate limiter turns a submission away.
 *
 * It names neither the allowance nor the window, on purpose: telling a caller
 * "five per hour" tells a script exactly how to pace itself, and tells a real
 * patient a number that only makes them feel accused. What it does give them is
 * the phone number, because the limiter cannot tell an abusive script from a
 * family booking three children from one address — and the person on the wrong
 * side of that guess may be in pain today.
 */
function rateLimitedMessage(lang: Language): string {
  const phone = contactDetails.phone[lang];
  return lang === 'es'
    ? `Hemos recibido varios envíos desde esta conexión. Vuelva a intentarlo más tarde. ` +
        `Si necesita atención hoy, llámenos al ${phone} y le atendemos por teléfono.`
    : `We have received several submissions from this connection. Please try again later. ` +
        `If you need care today, call us on ${phone} and we will help you over the phone.`;
}

const moderationRejection = {
  contact: {
    es: 'Su mensaje contiene contenido que no podemos procesar. Revíselo y vuelva a enviarlo.',
    en: 'Your message contains content we cannot process. Please review it and resend.',
  },
  appointment: {
    es: 'Su solicitud contiene contenido que no podemos procesar. Revise el motivo de la consulta y vuelva a enviarla.',
    en: 'Your request contains content we cannot process. Please review the reason for your visit and resend.',
  },
  testimonial: {
    es: 'Su testimonio contiene contenido inapropiado o spam. Por favor, revíselo y vuelva a enviarlo.',
    en: 'Your testimonial contains inappropriate content or spam. Please review it and resubmit.',
  },
} satisfies Record<string, Record<Language, string>>;

/* ============================================================================
   Shared guards
   ========================================================================== */

/** Control characters in a single-line field. A name does not contain a tab. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\x00-\x1F\x7F]/;

/** The same set minus tab, newline and carriage return, which are the three a
 *  person legitimately produces in a textarea. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS_IN_PROSE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

const isSingleLine = (value: string) => !CONTROL_CHARACTERS.test(value);
const isProse = (value: string) => !CONTROL_CHARACTERS_IN_PROSE.test(value);

/** `app.appointments` and `app.contact_messages` both CHECK `length(phone) <= 40`. */
const PHONE_MAX_LENGTH = 40;
const PHONE_SHAPE = /^[0-9+\s()-]*$/;

/**
 * Shape check only — `validatePhone` in content-moderation.ts does the rest.
 *
 * The length cap is not cosmetic. Seven digits padded with thirty spaces passes
 * both the digit count and the character class, and lands on a column that
 * refuses anything over forty characters: the patient would have been shown a
 * generic "try again later" for a number that looked fine to them.
 */
function isPlausiblePhone(value: string): boolean {
  if (value.length > PHONE_MAX_LENGTH || !PHONE_SHAPE.test(value)) return false;
  const digits = value.replace(/[^0-9]/g, '').length;
  return digits >= 7 && digits <= 15;
}

/**
 * `app.contact_messages` CHECKs `length(message) BETWEEN 10 AND 1000`.
 *
 * The schema used to allow 2000 here, so anything longer was accepted by both
 * the browser and this action and then rejected by Postgres — the patient wrote
 * a long message, waited, and was told the site was broken. The validator now
 * agrees with the column, which is the only arrangement in which the error
 * message a patient sees describes the rule that actually applies.
 */
const CONTACT_MESSAGE_MAX_LENGTH = 1000;


/**
 * The field the moderator liked least.
 *
 * The rejection has to land on an input the patient can see and change. Pinning
 * it to the longest field regardless of what tripped the check is how the old
 * behaviour failed: a submission bounced for a display name showed its error
 * under the testimonial text, which is nowhere near the thing that has to be
 * edited.
 */
function worstModeratedField(result: ModerationResult, fallback: string): string {
  let worstField = fallback;
  let worstScore = Number.POSITIVE_INFINITY;

  for (const [field, score] of Object.entries(result.fieldScores)) {
    if (score < worstScore) {
      worstScore = score;
      worstField = field;
    }
  }

  return worstField;
}

/**
 * Trim before validating, rather than transforming inside the schema.
 *
 * `z.email()` runs before any `.trim()` further down the chain, so " a@b.co "
 * used to fail as a malformed address — a leading space pasted from a contacts
 * app looked to the patient exactly like a working email being refused.
 *
 * A non-string becomes `undefined` so the schema reports its own copy for the
 * field instead of Zod's built-in English "Invalid input" leaking onto a
 * Spanish page.
 */
function requiredText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

/** As above, but an empty string is absence: an untouched optional input posts
 *  `""`, and `""` is not a phone number the clinic can call. */
function optionalText(value: unknown): string | undefined {
  const trimmed = requiredText(value);
  return trimmed ? trimmed : undefined;
}

/* ============================================================================
   Contact
   ========================================================================== */

const createContactFormSchema = (lang: Language) => {
  const zodMsgs = actionMessages[lang].zod;
  return z.object({
    name: z
      .string({ error: zodMsgs.nameMin })
      .min(2, { error: zodMsgs.nameMin })
      .max(100, { error: zodMsgs.nameMax })
      .refine(isSingleLine, { error: zodMsgs.invalidCharacters }),
    /* The address is stored exactly as typed. The column is `citext`, so
       matching is case-insensitive without help, and the local part of an
       address is case-sensitive per RFC 5321 — lower-casing it was a habit
       carried over from a `text` column, not a correctness measure. */
    email: z
      .email({ error: zodMsgs.emailInvalid })
      .max(255, { error: zodMsgs.emailMax }),
    phone: z.string().refine(isPlausiblePhone, { error: zodMsgs.phoneInvalid }).optional(),
    message: z
      .string({ error: zodMsgs.messageMin })
      .min(10, { error: zodMsgs.messageMin })
      .max(CONTACT_MESSAGE_MAX_LENGTH, { error: zodMsgs.messageMax })
      .refine(isProse, { error: zodMsgs.invalidCharacters }),
  });
};

export async function submitContactForm(
  formData: Omit<ContactFormData, 'id' | 'submitted_at' | 'status'>,
  lang: Language,
): Promise<FormActionResult> {
  const messages = actionMessages[lang];

  /* Once per action. `headers()` marks the render dynamic, and three helpers
     each reading it costs three opt-outs where one would do. */
  const { ipHash } = await getRequestContext();

  const limit = await checkPublicFormLimit('contact', ipHash);
  if (!limit.allowed) {
    return { success: false, message: rateLimitedMessage(lang) };
  }

  const contactFormSchema = createContactFormSchema(lang);
  const validated = contactFormSchema.safeParse({
    name: requiredText(formData?.name),
    email: requiredText(formData?.email),
    phone: optionalText(formData?.phone),
    message: requiredText(formData?.message),
  });

  if (!validated.success) {
    return {
      success: false,
      errors: z.flattenError(validated.error).fieldErrors,
      message: messages.formCorrection,
    };
  }

  /* Field-scoped, not a bare toast. These two checks used to return a message
     with no `errors` key, so the rejection had nothing to attach to: it flashed
     past and the form still looked entirely valid. */
  if (!validateEmail(validated.data.email)) {
    return {
      success: false,
      errors: { email: [messages.zod.emailUnverifiable] },
      message: messages.formCorrection,
    };
  }

  if (validated.data.phone && !validatePhone(validated.data.phone)) {
    return {
      success: false,
      errors: { phone: [messages.zod.phoneUnverifiable] },
      message: messages.formCorrection,
    };
  }

  /* Moderated before sanitising. Sanitising strips the markup and the invisible
     characters that are themselves the evidence, so a moderator running after
     it would be shown a laundered copy and score it clean. */
  const moderation = moderateContactMessage(validated.data.message, validated.data.name);
  if (!moderation.isAppropriate) {
    /* Flags name the signal ("message: contains a medical spam pattern"), never
       the text, so this line is safe to keep in a log the clinic does not own. */
    console.warn('[contact] rejected by moderation:', moderation.flags.join('; '));
    return {
      success: false,
      errors: { [worstModeratedField(moderation, 'message')]: [moderationRejection.contact[lang]] },
      message: moderationRejection.contact[lang],
    };
  }

  /* Sanitise, then run the same schema over the result.
     `sanitizeText` only ever removes, so a name of "<b>" survives validation as
     three characters and reaches the database as zero — where a CHECK that
     wants at least two rejects it and the patient is told the site is broken.
     Re-parsing makes "what we store satisfies the schema" true by construction
     rather than by inspection, and any failure it does find is already
     field-scoped copy the form knows how to display. */
  const stored = contactFormSchema.safeParse({
    name: sanitizeText(validated.data.name),
    email: validated.data.email,
    phone: validated.data.phone,
    message: sanitizeText(validated.data.message),
  });

  if (!stored.success) {
    return {
      success: false,
      errors: z.flattenError(stored.error).fieldErrors,
      message: messages.formCorrection,
    };
  }

  /* The try covers the insert and nothing else. Everything after it runs on a
     message that is already committed, and a `catch` reaching over it would
     answer "we could not send your message" to a patient whose message is
     sitting in the clinic's inbox — telling them to write it again. */
  let messageId: string | null;
  try {
    const [row] = await db
      .insert(contactMessages)
      .values({
        name: stored.data.name,
        email: stored.data.email,
        phone: stored.data.phone ?? null,
        message: stored.data.message,
        /* `status` is absent on purpose and must stay absent. The column
           defaults to 'unread'; accepting one here is how a caller sets its own
           workflow state. */
      })
      .returning({ id: contactMessages.id });

    messageId = row?.id ?? null;
  } catch (error) {
    console.error('[contact] insert failed: %s', formatDatabaseFailure(error));
    return { success: false, message: messages.contactError };
  }

  /* Identifiers and workflow state only. The message itself already lives in
     `app.contact_messages`, and vd_app holds no DELETE on `audit.audit_log` by
     design — so anything copied here cannot be erased on request, which makes a
     second copy of a patient's words a liability rather than a record. */
  await recordAudit({
    action: 'contact_message.created',
    entity: 'contact_message',
    entityId: messageId,
    after: { status: 'unread', hasPhone: stored.data.phone !== undefined },
  });

  return { success: true, message: messages.contactSuccess };
}

/* ============================================================================
   Appointment: preferred day + time-of-day
   ----------------------------------------------------------------------------
   `app.appointments` now has `preferred_date date` and `time_preference text`,
   so both values go into their own columns and `reason` holds only what the
   patient wrote. Previously they were formatted into a sentence and prepended
   to `reason`, which is why the clinic could not sort its book by the day
   people had actually asked for.

   Timezone discipline: the value on the wire is a `YYYY-MM-DD` calendar date,
   never an ISO instant, and it stays one all the way into a `date` column.
   Every Date built from it here is constructed AND formatted in UTC, so the day
   the patient picked survives whatever timezone the server runs in — Vercel is
   UTC, a local dev box is not, and Santiago is UTC-4.
   ========================================================================== */

const DAY_MS = 86_400_000;
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/* The client caps the lead time at 180 days. The server allows a little more so
   a clock skew or a timezone boundary between the two cannot reject a date the
   patient was shown as selectable. */
const MAX_LEAD_DAYS = 190;

function parseCalendarDate(value: string): Date | null {
  const match = CALENDAR_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls 2026-02-30 over to March; check the parts back out rather
  // than trusting the constructor.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function utcToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Clinic hours are Monday–Friday (contactDetails.schedule), so both weekend
 *  days are closed — not only Sunday. */
function isClinicClosed(date: Date): boolean {
  const weekday = date.getUTCDay();
  return weekday === 0 || weekday === 6;
}

const createAppointmentFormSchema = (lang: Language) => {
  const zodMsgs = actionMessages[lang].zod;
  return z.object({
    name: z
      .string({ error: zodMsgs.nameMin })
      .min(2, { error: zodMsgs.nameMin })
      .max(100, { error: zodMsgs.nameMax })
      .refine(isSingleLine, { error: zodMsgs.invalidCharacters }),
    email: z.email({ error: zodMsgs.emailInvalid }).max(255, { error: zodMsgs.emailMax }),
    /* REQUIRED, matching the client.
       This used to be `.optional()` while the form required it, and a server
       action is a public endpoint: anything calling it directly could create an
       appointment with no callback number, and phoning the patient is the
       clinic's only way to confirm a request. */
    phone: z
      .string({ error: zodMsgs.phoneInvalid })
      .refine(isPlausiblePhone, { error: zodMsgs.phoneInvalid }),
    serviceType: z
      .string({ error: zodMsgs.serviceTypeRequired })
      .min(1, { error: zodMsgs.serviceTypeRequired })
      .max(100, { error: zodMsgs.serviceTypeMax }),
    preferredDate: z
      .string({ error: zodMsgs.preferredDateRequired })
      .min(1, { error: zodMsgs.preferredDateRequired })
      .refine((value) => parseCalendarDate(value) !== null, {
        error: zodMsgs.preferredDateInvalid,
      })
      .refine(
        (value) => {
          const date = parseCalendarDate(value);
          // One day of slack: the visitor's "today" can be the server's
          // "yesterday" for the whole evening at UTC-4.
          return date === null || date.getTime() >= utcToday().getTime() - DAY_MS;
        },
        { error: zodMsgs.preferredDatePast },
      )
      .refine(
        (value) => {
          const date = parseCalendarDate(value);
          return date === null || !isClinicClosed(date);
        },
        { error: zodMsgs.preferredDateClosed },
      )
      .refine(
        (value) => {
          const date = parseCalendarDate(value);
          return date === null || date.getTime() - utcToday().getTime() <= MAX_LEAD_DAYS * DAY_MS;
        },
        { error: zodMsgs.preferredDateTooFar },
      ),
    timePreference: z.enum(TIME_PREFERENCE_VALUES, { error: zodMsgs.timePreferenceRequired }),
    reason: z
      .string({ error: zodMsgs.reasonMin })
      .min(10, { error: zodMsgs.reasonMin })
      .max(500, { error: zodMsgs.reasonMax })
      .refine(isProse, { error: zodMsgs.invalidCharacters }),
    isUrgent: z.boolean().default(false),
  });
};

export async function submitAppointmentForm(
  formData: AppointmentFormData,
  lang: Language,
): Promise<FormActionResult> {
  const messages = actionMessages[lang];

  const { ipHash } = await getRequestContext();

  const limit = await checkPublicFormLimit('appointment', ipHash);
  if (!limit.allowed) {
    return { success: false, message: rateLimitedMessage(lang) };
  }

  /* Every field named explicitly — no spread.
     A `...formData` spread is what hid the last bug in this function:
     `is_urgent` was absent from the map, the client sent `isUrgent`, and Zod's
     `.default(false)` filled the missing key without complaint. Every
     appointment was stored non-urgent while the patient watched the toggle turn
     on and got a success message. For a dental practice that is the whole
     triage signal, lost silently.

     The schema keys are camelCase now, and that is not cosmetic: they used to
     be snake_case because the insert spoke column names, which forced a second
     map translating validation errors back to the form's field names — and a
     field missing from THAT map was an error react-hook-form attached to a
     control that does not exist. Drizzle's insert object is camelCase, so the
     two spellings collapse into one and the remap is gone.

     Optional chaining because a server action is a public endpoint: `formData`
     is not guaranteed to be an object at runtime, whatever the type says. */
  const appointmentFormSchema = createAppointmentFormSchema(lang);
  const validated = appointmentFormSchema.safeParse({
    name: requiredText(formData?.name),
    email: requiredText(formData?.email),
    phone: requiredText(formData?.phone),
    serviceType: requiredText(formData?.serviceType),
    preferredDate: requiredText(formData?.preferredDate),
    timePreference: formData?.timePreference,
    reason: requiredText(formData?.reason),
    isUrgent: formData?.isUrgent,
  });

  if (!validated.success) {
    return {
      success: false,
      errors: z.flattenError(validated.error).fieldErrors,
      message: messages.formCorrection,
    };
  }

  if (!validateEmail(validated.data.email)) {
    return {
      success: false,
      errors: { email: [messages.zod.emailUnverifiable] },
      message: messages.formCorrection,
    };
  }

  if (!validatePhone(validated.data.phone)) {
    return {
      success: false,
      errors: { phone: [messages.zod.phoneUnverifiable] },
      message: messages.formCorrection,
    };
  }

  /* An appointment reason is a private message to the practice, judged on
     exactly the terms `moderateContactMessage` documents: a lower bar than a
     published testimonial, and the writer's own phone number or a question
     about price is content rather than spam. Reusing that wrapper keeps one
     threshold; a second literal here would be a copy of a number free to drift
     away from the one it was copied from. */
  const moderation = moderateContactMessage(validated.data.reason, validated.data.name);
  if (!moderation.isAppropriate) {
    console.warn('[appointment] rejected by moderation:', moderation.flags.join('; '));
    /* `moderateContactMessage` names its prose field "message"; on this form
       that text is the "reason" input. */
    const worst = worstModeratedField(moderation, 'message');
    const field = worst === 'message' ? 'reason' : worst;
    return {
      success: false,
      errors: { [field]: [moderationRejection.appointment[lang]] },
      message: moderationRejection.appointment[lang],
    };
  }

  const stored = appointmentFormSchema.safeParse({
    name: sanitizeText(validated.data.name),
    email: validated.data.email,
    phone: validated.data.phone,
    serviceType: sanitizeText(validated.data.serviceType),
    preferredDate: validated.data.preferredDate,
    timePreference: validated.data.timePreference,
    reason: sanitizeText(validated.data.reason),
    isUrgent: validated.data.isUrgent,
  });

  if (!stored.success) {
    return {
      success: false,
      errors: z.flattenError(stored.error).fieldErrors,
      message: messages.formCorrection,
    };
  }

  /* The try covers the insert and nothing else. Once the row is committed the
     appointment exists, and a `catch` wide enough to include the audit write or
     the notification would tell a patient their request failed because an email
     did not go out — sending them to book a second time for a slot they already
     hold. */
  let appointmentId: string | null;
  try {
    const [row] = await db
      .insert(appointments)
      .values({
        name: stored.data.name,
        email: stored.data.email,
        phone: stored.data.phone,
        serviceType: stored.data.serviceType,
        /* Only what the patient wrote. The preference is two columns now. */
        reason: stored.data.reason,
        isUrgent: stored.data.isUrgent,
        preferredDate: stored.data.preferredDate,
        timePreference: stored.data.timePreference,
        /* `status` defaults to 'pending' in the column and is never accepted
           from the caller — a request cannot arrive pre-confirmed. */
      })
      .returning({ id: appointments.id });

    appointmentId = row?.id ?? null;
  } catch (error) {
    console.error('[appointment] insert failed: %s', formatDatabaseFailure(error));
    return { success: false, message: messages.appointmentError };
  }

  /* Independent of each other, and both swallow their own failures, so they run
     together rather than in series: the patient waits for the slower of the
     two, not for the sum. */
  await Promise.all([
    recordAudit({
      action: 'appointment.created',
      entity: 'appointment',
      entityId: appointmentId,
      /* Triage facts, no identity. The row itself is in `app.appointments`;
         `audit.audit_log` cannot be deleted by this role, so a copy of the
         patient's name, email or reason here would outlive any erasure request
         made against the appointment. */
      after: {
        status: 'pending',
        isUrgent: stored.data.isUrgent,
        serviceType: stored.data.serviceType,
        preferredDate: stored.data.preferredDate,
        timePreference: stored.data.timePreference,
      },
    }),
    notifyClinicOfAppointment({
      name: stored.data.name,
      phone: stored.data.phone,
      serviceType: stored.data.serviceType,
      preferredDate: stored.data.preferredDate,
      timePreference: stored.data.timePreference,
      isUrgent: stored.data.isUrgent,
    }),
  ]);

  return { success: true, message: messages.appointmentSuccess };
}

/* ============================================================================
   Clinic notification
   ----------------------------------------------------------------------------
   Before this there was no notification path at all: an urgent request reached
   the practice only when somebody happened to open /admin. On a Friday evening
   that is a weekend.

   Sent with `fetch` against Resend's REST API rather than their SDK. One POST
   with three fields does not justify a dependency, a version to keep current,
   or another package in the server bundle.
   ========================================================================== */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * A notification that has not left in three seconds is worth losing.
 *
 * The send is awaited — a serverless function is frozen the instant its
 * response is sent, so a detached promise here would be cancelled mid-flight
 * and the clinic would be told about roughly nothing. Awaiting it puts Resend's
 * latency in front of the patient's confirmation screen, which is why the
 * ceiling is low: three seconds is far above the API's normal response and far
 * below the point where somebody decides the form has hung and presses the
 * button again.
 */
const NOTIFICATION_TIMEOUT_MS = 3_000;

interface AppointmentNotification {
  name: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  timePreference: TimePreference;
  isUrgent: boolean;
}

/** Formatted in UTC and in Spanish regardless of the language the patient used:
 *  the reader is the clinic, and the admin panel is Spanish-only. */
function formatClinicDate(value: string): string {
  const date = parseCalendarDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

async function notifyClinicOfAppointment(details: AppointmentNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  /* The key IS the feature flag, and its absence is the normal state of a fresh
     checkout and of every preview deployment. So this path is silent: a warning
     on every submission in development is a warning nobody reads by the second
     week, including on the day it starts meaning something. */
  if (!apiKey) return;

  const recipient = process.env.CLINIC_NOTIFICATION_EMAIL;
  if (!recipient) {
    /* Key set, recipient not, is a half-finished configuration rather than a
       decision — and it fails invisibly, which is the worst way for a channel
       whose entire job is to tell somebody about an emergency. */
    console.warn(
      '[appointment] RESEND_API_KEY is set but CLINIC_NOTIFICATION_EMAIL is not, so no ' +
        'notification was sent. Set the clinic address or unset the key.',
    );
    return;
  }

  /* Resend's sandbox sender delivers ONLY to the address that owns the API key.
     It is the right default for proving the wiring works on the first try, and
     the wrong one for production — set CLINIC_NOTIFICATION_FROM to an address
     on a domain verified in Resend before this is relied on. */
  const sender = process.env.CLINIC_NOTIFICATION_FROM ?? 'onboarding@resend.dev';

  const times = appointmentBooking.es.reasonPrefix.times;
  const urgencyTag = details.isUrgent ? 'URGENTE' : 'Nueva';

  /* A relative "/admin" in an email is not a link, it is a dead string — so
     without a site URL the line names the panel instead of pretending to point
     at it. */
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const panelLine = siteUrl
    ? `El motivo de la consulta está en el panel: ${siteUrl.replace(/\/+$/, '')}/admin`
    : 'El motivo de la consulta está en el panel de administración.';

  /* The patient's reason for visiting is deliberately NOT here. It is the field
     most likely to describe a symptom, email is not a confidential channel, and
     the clinic reads it in the panel anyway. What this carries is what is
     needed to act before opening anything: who to call, on what number, how
     soon. */
  const body = [
    `${urgencyTag}: solicitud de cita.`,
    '',
    `Paciente:  ${details.name}`,
    `Teléfono:  ${details.phone}`,
    `Servicio:  ${details.serviceType}`,
    `Preferencia: ${formatClinicDate(details.preferredDate)}, ${times[details.timePreference]}`,
    '',
    panelLine,
  ].join('\n');

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject: `${urgencyTag} cita — ${details.name}`,
        text: body,
      }),
      signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
    });

    /* Status only. Resend echoes the recipient back in its response body, and
       an address in a log is the same problem as a patient's is. */
    if (!response.ok) {
      console.error('[appointment] Resend refused the notification: HTTP %d', response.status);
    }
  } catch (error) {
    /* Swallowed by design. The appointment is already committed; failing the
       patient's submission because an email did not go out would lose the
       booking as well as the notification. */
    const failure = error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error';
    console.error('[appointment] notification could not be sent:', failure);
  }
}

/* ============================================================================
   Testimonial
   ----------------------------------------------------------------------------
   There is no auto-approve path, and reintroducing one is not a tuning
   decision. `status` used to be part of the insert payload, computed from a
   moderation score produced by a literal blocklist that lost to a space — so a
   direct call to this action could put arbitrary text on a medical practice's
   homepage under a patient's name. Everything queues; a human publishes.

   The score is still written, to `moderation_score`, because the review queue
   is ordered worst-first by `testimonials_queue_idx`. It decides what the
   reviewer sees at the top of the pile, and nothing else.
   ========================================================================== */

const createTestimonialFormSchema = (lang: Language) => {
  const zodMsgs = actionMessages[lang].zod;
  return z.object({
    name: z
      .string({ error: zodMsgs.nameMin })
      .min(2, { error: zodMsgs.nameMin })
      .max(100, { error: zodMsgs.nameMax })
      .refine(isSingleLine, { error: zodMsgs.invalidCharacters }),
    quote: z
      .string({ error: zodMsgs.quoteMin })
      .min(15, { error: zodMsgs.quoteMin })
      .max(500, { error: zodMsgs.quoteMax })
      .refine(isProse, { error: zodMsgs.invalidCharacters }),
    location: z
      .string()
      .max(100, { error: zodMsgs.locationMax })
      .refine(isSingleLine, { error: zodMsgs.invalidCharacters })
      .optional(),
  });
};

export async function submitTestimonialForm(
  formData: TestimonialFormSubmitData,
  lang: Language,
): Promise<FormActionResult> {
  const messages = actionMessages[lang];

  const { ipHash } = await getRequestContext();

  const limit = await checkPublicFormLimit('testimonial', ipHash);
  if (!limit.allowed) {
    return { success: false, message: rateLimitedMessage(lang) };
  }

  const testimonialFormSchema = createTestimonialFormSchema(lang);
  const validated = testimonialFormSchema.safeParse({
    name: requiredText(formData?.name),
    quote: requiredText(formData?.quote),
    location: optionalText(formData?.location),
  });

  if (!validated.success) {
    return {
      success: false,
      errors: z.flattenError(validated.error).fieldErrors,
      message: messages.formCorrection,
    };
  }

  /* All three fields, `location` included. It was unmoderated until now because
     the old entry point took a quote and a name as two positional arguments and
     there was nowhere to put a third — so "Santiago — viagra.com" published
     under a patient's name, unread. */
  const moderation = moderateTestimonial(
    validated.data.quote,
    validated.data.name,
    validated.data.location,
  );

  if (!moderation.isAppropriate) {
    console.warn('[testimonial] rejected by moderation:', moderation.flags.join('; '));
    return {
      success: false,
      errors: {
        [worstModeratedField(moderation, 'quote')]: [moderationRejection.testimonial[lang]],
      },
      message: moderationRejection.testimonial[lang],
    };
  }

  /* `|| undefined` rather than the sanitised value: a location of "<b>" is
     three characters going in and nothing coming out, and storing that empty
     string would give the card a location it renders as a blank line. Absent
     and empty are the same thing for this field, so they are stored the same
     way. */
  const sanitizedLocation = validated.data.location
    ? sanitizeText(validated.data.location) || undefined
    : undefined;

  const stored = testimonialFormSchema.safeParse({
    name: sanitizeText(validated.data.name),
    quote: sanitizeText(validated.data.quote),
    location: sanitizedLocation,
  });

  if (!stored.success) {
    return {
      success: false,
      errors: z.flattenError(stored.error).fieldErrors,
      message: messages.formCorrection,
    };
  }

  /* The try covers the insert and nothing else — see the same note in
     `submitContactForm`. */
  let testimonialId: string | null;
  try {
    const [row] = await db
      .insert(testimonials)
      .values({
        name: stored.data.name,
        quote: stored.data.quote,
        location: stored.data.location ?? null,
        /* A queue-priority hint, written so `testimonials_queue_idx` has
           something to order by — it was fed nulls before. It is not consulted
           anywhere that decides visibility. */
        moderationScore: moderation.score,
        /* Set here, from a literal, and never from the caller or from the score
           above. This one line is the fix for a hole that let anyone POST a
           self-approved testimonial straight onto the homepage. */
        status: 'pending_approval',
      })
      .returning({ id: testimonials.id });

    testimonialId = row?.id ?? null;
  } catch (error) {
    console.error('[testimonial] insert failed: %s', formatDatabaseFailure(error));
    return { success: false, message: messages.testimonialError };
  }

  await recordAudit({
    action: 'testimonial.created',
    entity: 'testimonial',
    entityId: testimonialId,
    after: {
      status: 'pending_approval',
      moderationScore: moderation.score,
      hasLocation: stored.data.location !== undefined,
    },
  });

  return { success: true, message: messages.testimonialSuccess };
}
