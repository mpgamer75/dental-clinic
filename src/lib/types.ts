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

import type { LucideIcon } from 'lucide-react';

export type Language = 'es' | 'en';

export interface InternationalizedString {
  es: string;
  en: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}
export interface NavItemData {
  es: NavItem[];
  en: NavItem[];
}

/**
 * Interface pour les éléments de navigation administrateur.
 * Hérite des propriétés de NavItem et peut être étendue avec des propriétés spécifiques à l'admin.
 */
export interface AdminNavItem extends NavItem {
  // Propriétés spécifiques à l'administration
  isAdminOnly?: boolean;
  requiresPermission?: string;
}

export interface AdminNavItemData {
    es: AdminNavItem[];
    en: AdminNavItem[];
}

export interface Service {
  iconName?: string; 
  title: string;
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
export interface TestimonialData {
  es: Testimonial[];
  en: Testimonial[];
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
  email: string;
  phone: string;
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
  hero: {
    es: HeroContent;
    en: HeroContent;
  };
  visitUs: {
    es: VisitUsContent;
    en: VisitUsContent;
  };
  servicesSection: {
    es: SectionContent;
    en: SectionContent;
  };
  testimonialsSection: {
    es: TestimonialsSectionContent;
    en: TestimonialsSectionContent;
  };
  faqSection: {
    es: SectionContent;
    en: SectionContent;
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

interface HeroContent {
  subtitle: string;
  welcome: string;
  description: string;
  ctaAppointment: string;
  ctaServices: string;
  qualificationsTitle: string;
}

interface VisitUsContent {
  title: string;
  description: string;
  ctaButton: string;
}

interface SectionContent {
  title: string;
  description: string;
}

interface TestimonialsSectionContent extends SectionContent {
  ctaButton: string;
  dialogTitle: string;
  dialogDescription: string;
}

interface ContactSectionContent extends SectionContent {
  formTitle: string;
  detailsTitle: string;
  addressLabel: string;
  phoneLabel: string;
  emailLabel: string;
  scheduleLabel: string;
  mapTitle: string;
  viewMapButton: string;
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
  doctorAttribution: string;
}

export interface BaseMetadata {
  es: {
    titleSuffix: string;
    description: string;
    keywords: string[];
  };
  en: {
    titleSuffix: string;
    description: string;
    keywords: string[];
  };
}

interface AppointmentTableHeaders {
  name: string;
  email: string;
  phone: string;
  service: string;
  reason: string;
  urgent: string;
  submitted: string;
  status: string;
  actions: string;
}

interface StatusLabels {
  pending: string;
  confirmed: string;
  cancelled: string;
  completed: string;
  unread: string;
  read: string;
  archived: string;
  pending_approval: string;
  approved: string;
  rejected: string;
}

interface ActionButtonLabels {
  confirm: string;
  cancel: string;
  complete: string;
  markRead: string;
  archive: string;
  approve: string;
  reject: string;
  view: string;
  delete: string;
}

interface BooleanTranslations {
  true: string;
  false: string;
}

export interface GeneralUIStrings {
  readMore: string;
  readLess: string;
  adminPanelTitle: string;
  appointmentsTitle: string;
  messagesTitle: string;
  testimonialsTitle: string;
  settingsTitle: string;
  logout: string;
  viewSite: string;
  noAppointments: string;
  // Navigation menu items
  home: string;
  services: string; 
  faq: string;
  testimonials: string;
  contact: string;
  appointments: string;
  // End of navigation items
  appointmentTableHeaders: AppointmentTableHeaders;
  statusLabels: StatusLabels;
  actionButtons: ActionButtonLabels;
  boolean: BooleanTranslations;
}

export interface GeneralUIData {
  es: GeneralUIStrings;
  en: GeneralUIStrings;
}

export interface CarouselImageItem {
  src: string;
  altEs: string;
  altEn: string;
  hint: string;
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
