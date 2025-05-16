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

// Supabase appointment structure (matches DB columns)
export interface AppointmentSupabase {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  service_type: string;
  reason: string;
  is_urgent: boolean;
  submitted_at: string; 
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}


export interface AppointmentFormData {
  id?: string; 
  name: string;
  email: string;
  phone?: string;
  serviceType: string; 
  service_type?: string; 
  reason: string;
  is_urgent?: boolean; 
  isUrgent: boolean; // From form state, changed from optional to required
  submitted_at?: string | Date; 
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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

interface ZodMessages {
  nameMin: string;
  emailInvalid: string;
  phoneInvalid: string;
  messageMin?: string; 
  serviceTypeRequired?: string; 
  reasonMin?: string;
  reasonMax?: string;
  quoteMin?: string;
  quoteMax?: string;
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

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: AppointmentSupabase; // Use the defined interface
        Insert: {
          id?: string; 
          name: string;
          email: string;
          phone?: string | null;
          service_type: string;
          reason: string;
          is_urgent?: boolean; 
          submitted_at?: string; 
          status?: string; 
        };
        Update: { 
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          service_type?: string;
          reason?: string;
          is_urgent?: boolean;
          submitted_at?: string;
          status?: string;
        };
      };
      contact_messages: {
        Row: {
          id: string; 
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          submitted_at: string; 
          status: string; 
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          submitted_at?: string;
          status?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          message?: string;
          submitted_at?: string;
          status?: string;
        };
      };
      testimonials: {
        Row: {
          id: string; 
          name: string;
          quote: string;
          location?: string | null;
          submitted_at: string; 
          status: string; 
        };
        Insert: {
          id?: string;
          name: string;
          quote: string;
          location?: string | null;
          submitted_at?: string;
          status?: string; 
        };
        Update: {
          id?: string;
          name?: string;
          quote?: string;
          location?: string | null;
          submitted_at?: string;
          status?: string;
        };
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
  };
}

    