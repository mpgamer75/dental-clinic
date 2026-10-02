/* ============================================================================
   APPLICATION AND CONTENT TYPES
   ----------------------------------------------------------------------------
   What the components and `src/lib/data.ts` speak: languages, navigation,
   sections, form payloads and the message contracts the forms and the server
   actions share.

   NOT database row shapes. This file used to declare a `Database` interface as
   well, a third of the way out of date, alongside snake_case `*Supabase` row
   mirrors — while `src/lib/types_db.ts` and the generated Supabase types
   declared the same tables again, differently. Three descriptions of one
   schema, none of them checked against it, is how a `status` column ended up
   typed as a closed union that Postgres was not enforcing. Row shapes are now
   inferred from `src/lib/schema.ts`, which is generated from the same table
   definitions the migrations apply, and nothing here should restate one.
   ========================================================================== */

export type Language = 'es' | 'en';

export interface InternationalizedString {
  es: string;
  en: string;
}

/** Stable identity of a service. What an appointment request resolves to;
 *  see src/lib/service-catalog.ts. Never rendered. */
export type ServiceKey =
  | 'implants'
  | 'prosthetics'
  | 'orthodontics'
  | 'checkup'
  | 'cleaning'
  | 'fillings'
  | 'endodontics'
  | 'whitening';

export interface Service {
  key: ServiceKey;
  iconName?: string;
  /** One of the three the practice is built around (implants, prosthetics,
   *  orthodontics). The homepage weights these above general dentistry. */
  specialty?: boolean;
  title: string;
  /** One sentence for the homepage index. */
  summary: string;
  description: string;
}
export interface ServiceData {
  es: Service[];
  en: Service[];
}

export interface Testimonial {
  id?: string;
  quote: string;
  name: string;
  location?: string;
  submitted_at?: string | Date;
  status?: 'pending_approval' | 'approved' | 'rejected';
}


export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
export interface FAQData {
  es: FAQItem[];
  en: FAQItem[];
}

export interface ContactFormData {
  id?: string; 
  name: string;
  email: string;
  phone?: string;
  message: string;
  submitted_at?: string | Date; 
  status?: 'unread' | 'read' | 'archived';
}

/** Time-of-day the patient would prefer. `any` = no preference. */
export type AppointmentTimePreference = 'morning' | 'afternoon' | 'any';

/**
 * The exact payload the appointment form hands to `submitAppointmentForm`.
 *
 * This type is deliberately narrow, and that narrowness is the point.
 *
 * It previously declared BOTH spellings of two fields — `serviceType` AND
 * `service_type`, `isUrgent` AND `is_urgent` — with the snake_case pair
 * optional. Either spelling therefore typechecked at the component boundary,
 * so the compiler could not tell the difference between "the form sent the
 * urgency flag" and "the form sent nothing and Zod's `.default(false)` filled
 * it in". That is exactly the hole that let a real bug ship: every appointment
 * was stored with `is_urgent = false` while the patient saw the toggle turn on
 * and got a success message, and the clinic lost its entire triage signal
 * silently.
 *
 * Rule: this is the CAMEL-CASE form shape only. The snake_case mapping to the
 * database columns happens in one place — `submitAppointmentForm` — and nowhere
 * else. Row shapes live in `src/lib/schema.ts`.
 *
 * `phone` is required here because the clinic calls back to confirm; a request
 * with no callback number is not actionable. The server schema enforces it too,
 * so a directly-invoked server action cannot bypass it.
 */
export interface AppointmentFormData {
  name: string;
  /** Optional since migrations/0005: the empty string means "not given", and
   *  the server stores it as NULL. */
  email: string;
  phone: string;
  /** A `ServiceKey` from `serviceOptions` — never a display title. The server
   *  still accepts historical titles through `serviceKeyOf`. */
  serviceType: string;
  reason: string;
  isUrgent: boolean;
  /**
   * Local calendar date as `YYYY-MM-DD`.
   *
   * NOT an ISO timestamp: `new Date().toISOString()` would shift a date-only
   * value across midnight for every timezone west of UTC, so a patient in
   * Santiago (UTC-4) asking for Tuesday would be recorded as Monday.
   */
  preferredDate: string;
  timePreference: AppointmentTimePreference;
}

export interface TestimonialFormSubmitData {
  name: string;
  quote: string;
  location?: string;
}

interface FormUIStrings {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  messageLabel?: string; 
  messagePlaceholder?: string; 
  serviceTypeLabel?: string;
  serviceTypePlaceholder?: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  urgencyLabel?: string;
  quoteLabel?: string;
  quotePlaceholder?: string;
  locationLabel?: string;
  locationPlaceholder?: string;
  submitButtonText: string;
  submittingButtonText: string;
  successToastTitle: string;
  errorToastTitle: string;
  unexpectedErrorToastTitle: string;
}

export interface FormTranslations {
  contactForm: { es: FormUIStrings; en: FormUIStrings };
  appointmentForm: { es: FormUIStrings; en: FormUIStrings };
  testimonialForm: { es: FormUIStrings; en: FormUIStrings };
}

/**
 * Exported so the client-side schema in `appointment-form.tsx` can be built
 * from the same message contract the server action uses. Validation is
 * intentionally duplicated client + server; the *copy* is not.
 */
export interface ZodMessages {
  nameMin: string;
  emailInvalid: string;
  phoneInvalid: string;
  messageMin: string;
  /** Server caps the contact message at 2000 chars; the client mirrors it. */
  messageMax: string;
  serviceTypeRequired: string;
  reasonMin: string;
  reasonMax: string;
  quoteMin: string;
  quoteMax: string;
  /* Previously hardcoded Spanish inside actions.ts, so English-speaking
     visitors were shown Spanish validation errors. */
  serviceTypeMax: string;
  invalidCharacters: string;
  nameMax: string;
  emailMax: string;
  locationMax: string;
  /* The two checks below run only on the server (validateEmail /
     validatePhone in content-moderation.ts). They used to return a bare
     `message` with no `errors` key, so the rejection had no field to attach
     to: it flashed past in a toast and nothing on the form was marked. They
     are field-scoped now, which is why they need their own copy. */
  emailUnverifiable: string;
  phoneUnverifiable: string;
  /* Preferred date + time-of-day. */
  preferredDateRequired: string;
  preferredDateInvalid: string;
  preferredDatePast: string;
  preferredDateClosed: string;
  preferredDateTooFar: string;
  timePreferenceRequired: string;
}

export interface ActionMessages {
  es: {
    formCorrection: string;
    contactSuccess: string;
    contactError: string;
    appointmentSuccess: string;
    appointmentError: string;
    testimonialSuccess: string;
    testimonialError: string;
    testimonialModerationFailed: string;
    testimonialModerationReasonPrefix: string;
    testimonialModerationApiError: string;
    /** Returned when the clinic has switched the channel off in the admin
     *  panel (`app.site_settings`). */
    appointmentsClosed: string;
    contactClosed: string;
    testimonialsClosed: string;
    zod: ZodMessages;
  };
  en: {
    formCorrection: string;
    contactSuccess: string;
    contactError: string;
    appointmentSuccess: string;
    appointmentError: string;
    testimonialSuccess: string;
    testimonialError: string;
    testimonialModerationFailed: string;
    testimonialModerationReasonPrefix: string;
    testimonialModerationApiError: string;
    appointmentsClosed: string;
    contactClosed: string;
    testimonialsClosed: string;
    zod: ZodMessages;
  };
}


export interface ContactDetails {
  clinicName: InternationalizedString;
  doctorName: InternationalizedString;
  address: InternationalizedString;
  phone: InternationalizedString;
  email: InternationalizedString;
  schedule: InternationalizedString;
  mapLink: InternationalizedString;
  embedMapLink: InternationalizedString;
  qualifications: {
    es: string[];
    en: string[];
  };
  servicesSection: {
    es: ServicesSectionContent;
    en: ServicesSectionContent;
  };
  testimonialsSection: {
    es: TestimonialsSectionContent;
    en: TestimonialsSectionContent;
  };
  faqSection: {
    es: FaqSectionContent;
    en: FaqSectionContent;
  };
  diplomasSection: {
    es: SectionContent;
    en: SectionContent;
  };
  contactSection: {
    es: ContactSectionContent;
    en: ContactSectionContent;
  };
  appointmentPage: {
    es: AppointmentPageContent;
    en: AppointmentPageContent;
  };
  footer: {
    es: FooterContent;
    en: FooterContent;
  };
}

interface SectionContent {
  title: string;
  description: string;
}

interface ServicesSectionContent extends SectionContent {
  specialtiesTitle: string;
  generalTitle: string;
  /** Summary of each service's <details> disclosure. */
  moreLabel: string;
  implantGuide: string;
}

interface TestimonialsSectionContent extends SectionContent {
  ctaButton: string;
  dialogTitle: string;
  dialogDescription: string;
}

interface FaqSectionContent extends SectionContent {
  /** Link under an answer borrowed from the implant guide. */
  guideAnswerLink: string;
  moreLink: string;
}

/** "Cómo llegar": the visit band and the contact band, merged. */
interface ContactSectionContent extends SectionContent {
  detailsTitle: string;
  addressLabel: string;
  phoneLabel: string;
  emailLabel: string;
  scheduleLabel: string;
  photoCaption: string;
  mapTitle: string;
  /** Click-to-load map facade: the button, and the line explaining it. */
  mapLoad: string;
  mapNote: string;
  viewMapButton: string;
  /** The folded contact form. */
  formTitle: string;
  formLead: string;
  formToggle: string;
}

interface AppointmentPageContent {
  title: string;
  description: string;
  cardTitle: string;
  cardDescription: string;
  formIntro: string;
  openingHoursTitle: string;
  serviceOptions: {
    generalConsultation: string;
  }
}

interface FooterContent {
  tagline: string;
  quickContact: string;
  scheduleTitle: string;
  copyright: string;
  implantGuide: string;
  leaveTestimonial: string;
}

/* The admin panel's labels used to live here too, in both languages, for a
   panel that is Spanish-only and keeps its copy beside its components. None of
   them was read; they are gone. */
export interface GeneralUIStrings {
  readMore: string;
  readLess: string;
  home: string;
  services: string;
  faq: string;
  testimonials: string;
  contact: string;
  appointments: string;
  /** Compact form of `appointments` for the header CTA below 640px. */
  appointmentsShort: string;
}

export interface GeneralUIData {
  es: GeneralUIStrings;
  en: GeneralUIStrings;
}

export interface Diploma {
  id: string;
  title: string;
  institution: string;
  year: string;
  image: string;
  description: string;
}

export interface DiplomaData {
  es: Diploma[];
  en: Diploma[];
}
