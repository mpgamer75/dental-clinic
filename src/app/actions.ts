'use server';

import type {
  ContactFormData,
  AppointmentFormData,
  AppointmentTimePreference,
  TestimonialFormSubmitData,
  Language,
} from '@/lib/types';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { actionMessages, appointmentBooking } from '@/lib/data';
import { moderateTestimonial, moderateContactMessage, sanitizeText, validateEmail, validatePhone } from '@/lib/content-moderation';

const createContactFormSchema = (lang: Language) => {
  const zodMsgs = actionMessages[lang].zod;
  return z.object({
    name: z.string()
      .min(2, { message: zodMsgs.nameMin })
      .max(100, { message: zodMsgs.nameMax })
      .refine(value => !/[\x00-\x1F\x7F]/.test(value), {
        message: zodMsgs.invalidCharacters
      }),
    email: z.string()
      .email({ message: zodMsgs.emailInvalid })
      .max(255, { message: zodMsgs.emailMax })
      .toLowerCase()
      .trim(),
    phone: z.string().optional().refine(value => {
      if (!value || value.trim() === '') return true;
      // Doit contenir au moins 7 chiffres et pas plus de 15
      const digitsOnly = value.replace(/[^0-9]/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 15 && /^[0-9+\s()-]*$/.test(value);
    }, {
      message: zodMsgs.phoneInvalid
    }),
    message: z.string()
      .min(10, { message: zodMsgs.messageMin })
      .max(2000, { message: zodMsgs.messageMax })
      .refine(value => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value), {
        message: zodMsgs.invalidCharacters
      }),
  });
};

export async function submitContactForm(formData: Omit<ContactFormData, 'id' | 'submitted_at' | 'status'>, lang: Language) {
  const contactFormSchema = createContactFormSchema(lang);
  const validatedFields = contactFormSchema.safeParse(formData);
  const messages = actionMessages[lang];

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: messages.formCorrection
    };
  }

  // Modération du contenu
  const moderationResult = moderateContactMessage(validatedFields.data.message);
  if (!moderationResult.isAppropriate) {
    return {
      success: false,
      message: lang === 'es'
        ? 'Su mensaje contiene contenido inapropiado. Por favor, revise y vuelva a enviarlo.'
        : 'Your message contains inappropriate content. Please review and resubmit.',
    };
  }

  // Validation email stricte
  if (!validateEmail(validatedFields.data.email)) {
    return {
      success: false,
      message: lang === 'es'
        ? 'Por favor, use una dirección de email válida.'
        : 'Please use a valid email address.',
    };
  }

  // Validation téléphone si fourni
  if (validatedFields.data.phone && !validatePhone(validatedFields.data.phone)) {
    return {
      success: false,
      message: lang === 'es'
        ? 'Por favor, proporcione un número de teléfono válido.'
        : 'Please provide a valid phone number.',
    };
  }

  try {
    // Sanitize tous les champs
    const sanitizedData = {
      name: sanitizeText(validatedFields.data.name),
      email: validatedFields.data.email.toLowerCase().trim(),
      phone: validatedFields.data.phone,
      message: sanitizeText(validatedFields.data.message),
    };

    const { error } = await supabase
      .from('contact_messages')
      .insert(sanitizedData);

    if (error) throw error;

    return {
      success: true,
      message: messages.contactSuccess,
    };
  } catch (error) {
    console.error('Error submitting contact form to Supabase:', error);
    return {
      success: false,
      message: messages.contactError,
    };
  }
}

/* ============================================================================
   Appointment: preferred day + time-of-day
   ----------------------------------------------------------------------------
   `public.appointments` has NO date column (see dump.sql: id, name, email,
   phone, service_type, reason, is_urgent, submitted_at, status). Writing to a
   column that does not exist would fail every insert, so the preference is
   folded into the existing `reason` TEXT column as a clearly-labelled first
   line. The clinic sees it in the admin table today, with zero schema change.

   A proper `preferred_date date` + `preferred_time text` pair is drafted at
   supabase/migrations/manual/0002_optional_appointment_datetime.sql. It is
   OPTIONAL and NOT APPLIED. Once it is applied, move these two values into
   real columns and drop the prefix — the migration file says exactly where.

   Timezone discipline: the value on the wire is a `YYYY-MM-DD` calendar date,
   never an ISO instant. Every Date built from one here is constructed AND
   formatted in UTC, so the day the patient picked survives regardless of what
   timezone the server happens to run in (Vercel is UTC; a local dev box is
   not).
   ========================================================================== */

const DAY_MS = 86_400_000;
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/* The client caps the lead time at 180 days. The server allows a little more so
   a clock skew or a timezone boundary between the two cannot reject a date the
   patient was shown as selectable. */
const MAX_LEAD_DAYS = 190;

const TIME_PREFERENCES = ['morning', 'afternoon', 'any'] as const satisfies readonly AppointmentTimePreference[];

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

function formatPreferredDate(value: string, lang: Language): string {
  const date = parseCalendarDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-DO' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

const createAppointmentFormSchema = (lang: Language) => {
  const zodMsgs = actionMessages[lang].zod;
  return z.object({
    name: z.string()
      .min(2, { message: zodMsgs.nameMin })
      .max(100, { message: zodMsgs.nameMax })
      .refine(value => !/[\x00-\x1F\x7F]/.test(value), {
        message: zodMsgs.invalidCharacters
      }),
    email: z.string()
      .email({ message: zodMsgs.emailInvalid })
      .max(255, { message: zodMsgs.emailMax })
      .toLowerCase()
      .trim(),
    // REQUIRED, matching the client.
    //
    // This used to be `.optional()` while the form required it. The mismatch
    // was not cosmetic: a server action is a public HTTP endpoint, so anything
    // that called it directly could create an appointment with no callback
    // number — and the clinic's only way to confirm a request is to phone the
    // patient.
    phone: z.string()
      .min(1, { message: zodMsgs.phoneInvalid })
      .refine(value => {
        const digitsOnly = value.replace(/[^0-9]/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15 && /^[0-9+\s()-]*$/.test(value);
      }, {
        message: zodMsgs.phoneInvalid
      }),
    service_type: z.string()
      .min(1, { message: zodMsgs.serviceTypeRequired })
      .max(100, { message: zodMsgs.serviceTypeMax }),
    preferred_date: z.string()
      .min(1, { message: zodMsgs.preferredDateRequired })
      .refine(value => parseCalendarDate(value) !== null, {
        message: zodMsgs.preferredDateInvalid
      })
      .refine(value => {
        const date = parseCalendarDate(value);
        // One day of slack: the visitor's "today" can be the server's
        // "yesterday" for the whole evening at UTC-4.
        return date === null || date.getTime() >= utcToday().getTime() - DAY_MS;
      }, { message: zodMsgs.preferredDatePast })
      .refine(value => {
        const date = parseCalendarDate(value);
        return date === null || !isClinicClosed(date);
      }, { message: zodMsgs.preferredDateClosed })
      .refine(value => {
        const date = parseCalendarDate(value);
        return date === null || date.getTime() - utcToday().getTime() <= MAX_LEAD_DAYS * DAY_MS;
      }, { message: zodMsgs.preferredDateTooFar }),
    time_preference: z.enum(TIME_PREFERENCES, {
      required_error: zodMsgs.timePreferenceRequired,
      invalid_type_error: zodMsgs.timePreferenceRequired,
    }),
    reason: z.string()
      .min(10, { message: zodMsgs.reasonMin })
      .max(500, { message: zodMsgs.reasonMax })
      .refine(value => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value), {
        message: zodMsgs.invalidCharacters
      }),
    is_urgent: z.boolean().default(false),
  });
};

interface AppointmentSupabaseInsertData {
  name: string;
  email: string;
  phone: string;
  service_type: string;
  reason: string;
  is_urgent: boolean;
}

export async function submitAppointmentForm(
  formData: AppointmentFormData,
  lang: Language,
): Promise<{ success: boolean; message: string; errors?: Record<string, string[]> }> {
  const appointmentFormSchema = createAppointmentFormSchema(lang);
  const messages = actionMessages[lang];

  // The form is camelCase, the table is snake_case. Every renamed field is
  // mapped here EXPLICITLY — no spread.
  //
  // A `...formData` spread is what hid the last bug in this function:
  // `is_urgent` was absent from the map, the client sent `isUrgent`, and Zod's
  // `.default(false)` filled the missing key without complaint. Every
  // appointment was stored non-urgent while the patient watched the toggle
  // turn on and got a success message. For a dental practice that is the whole
  // triage signal, lost silently. Naming each field means a rename cannot
  // reintroduce it.
  //
  // Optional chaining because a server action is a public endpoint: `formData`
  // is not guaranteed to be an object at runtime, whatever the type says.
  const dataToValidate = {
    name: formData?.name,
    email: formData?.email,
    phone: formData?.phone,
    service_type: formData?.serviceType,
    preferred_date: formData?.preferredDate,
    time_preference: formData?.timePreference,
    reason: formData?.reason,
    is_urgent: formData?.isUrgent,
  };

  const validatedFields = appointmentFormSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    const errorFields = validatedFields.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string[]> = {};

    // Map snake_case validation keys back to the form's field names, or
    // react-hook-form's setError silently targets a field that doesn't exist.
    const TO_FORM_FIELD: Record<string, string> = {
      service_type: 'serviceType',
      is_urgent: 'isUrgent',
      preferred_date: 'preferredDate',
      time_preference: 'timePreference',
    };

    Object.entries(errorFields).forEach(([key, value]) => {
      if (!value) return;
      fieldErrors[TO_FORM_FIELD[key] ?? key] = value;
    });

    return {
      success: false,
      errors: fieldErrors,
      message: messages.formCorrection
    };
  }

  // Stricter checks than the Zod schema can express (disposable-mail domains,
  // repeated-digit phone numbers).
  //
  // These used to return a bare `message` with NO `errors` key. The client maps
  // `errors` onto fields, so the rejection had nothing to attach to: it flashed
  // past in a toast, no field was marked, and the patient was left staring at a
  // form that looked entirely valid. They are field-scoped now.
  if (!validateEmail(validatedFields.data.email)) {
    return {
      success: false,
      errors: { email: [messages.zod.emailUnverifiable] },
      message: messages.formCorrection,
    };
  }

  if (!validatePhone(validatedFields.data.phone)) {
    return {
      success: false,
      errors: { phone: [messages.zod.phoneUnverifiable] },
      message: messages.formCorrection,
    };
  }

  try {
    // Sanitize the patient's free text FIRST, then prepend the preference line.
    // Order matters: the prefix is server-generated from a validated calendar
    // date and a closed enum, so it is trusted — running it back through the
    // sanitizer would only risk mangling it.
    const booking = appointmentBooking[lang];
    const preferenceLine =
      `${booking.reasonPrefix.label}: ` +
      `${formatPreferredDate(validatedFields.data.preferred_date, lang)} — ` +
      `${booking.reasonPrefix.times[validatedFields.data.time_preference]}.`;

    const sanitizedData: AppointmentSupabaseInsertData = {
      name: sanitizeText(validatedFields.data.name),
      email: validatedFields.data.email.toLowerCase().trim(),
      phone: validatedFields.data.phone.trim(),
      service_type: sanitizeText(validatedFields.data.service_type),
      reason: `${preferenceLine}\n\n${sanitizeText(validatedFields.data.reason)}`,
      is_urgent: validatedFields.data.is_urgent,
    };

    const { error } = await supabase
      .from('appointments')
      .insert(sanitizedData);

    if (error) throw error;

    return {
      success: true,
      message: messages.appointmentSuccess,
    };
  } catch (error) {
    console.error('Error submitting appointment form to Supabase:', error);
    return {
      success: false,
      message: messages.appointmentError,
    };
  }
}

const createTestimonialFormSchema = (lang: Language) => {
  const zodMsgs = actionMessages[lang].zod;
  return z.object({
    name: z.string()
      .min(2, { message: zodMsgs.nameMin })
      .max(100, { message: zodMsgs.nameMax })
      .refine(value => !/[\x00-\x1F\x7F]/.test(value), {
        message: zodMsgs.invalidCharacters
      }),
    quote: z.string()
      .min(15, { message: zodMsgs.quoteMin })
      .max(500, { message: zodMsgs.quoteMax })
      .refine(value => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value), {
        message: zodMsgs.invalidCharacters
      }),
    location: z.string()
      .max(100, { message: zodMsgs.locationMax })
      .optional(),
  });
};

export async function submitTestimonialForm(formData: TestimonialFormSubmitData, lang: Language) {
  const testimonialFormSchema = createTestimonialFormSchema(lang);
  const validatedFields = testimonialFormSchema.safeParse(formData);
  const messages = actionMessages[lang];

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: messages.formCorrection
    };
  }

  // Modération automatique hardcodée
  const moderationResult = moderateTestimonial(
    validatedFields.data.quote,
    validatedFields.data.name
  );

  if (!moderationResult.isAppropriate) {
    console.warn('Testimonial rejected:', moderationResult.reason);
    return {
      success: false,
      message: lang === 'es'
        ? 'Su testimonio contiene contenido inapropiado o spam. Por favor, revise y vuelva a enviarlo.'
        : 'Your testimonial contains inappropriate content or spam. Please review and resubmit.',
    };
  }

  try {
    // Sanitize tous les champs
    const sanitizedData = {
      name: sanitizeText(validatedFields.data.name),
      quote: sanitizeText(validatedFields.data.quote),
      location: validatedFields.data.location ? sanitizeText(validatedFields.data.location) : undefined,
      // Auto-approve si score élevé, sinon pending
      status: (moderationResult.score >= 85 ? 'approved' : 'pending_approval') as 'approved' | 'pending_approval'
    };

    const { error } = await supabase
      .from('testimonials')
      .insert(sanitizedData);

    if (error) throw error;

    return {
      success: true,
      message: messages.testimonialSuccess,
    };
  } catch (error) {
    console.error('Error submitting testimonial form to Supabase:', error);
    return {
      success: false,
      message: messages.testimonialError,
    };
  }
}