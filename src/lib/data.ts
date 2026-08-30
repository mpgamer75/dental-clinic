import type { Language, ContactDetails, ServiceData, TestimonialData, FAQData, NavItemData, BaseMetadata, FormTranslations, ActionMessages, GeneralUIData, AdminNavItemData, CarouselImageItem, DiplomaData } from './types';
import { Home, ShieldCheck, MessageCircleQuestion, BadgeInfo, Phone, CalendarDays, LayoutDashboard, MessagesSquare, ShieldAlert, Settings } from 'lucide-react'; 

export const navItems: NavItemData = {
  es: [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Servicios', href: '/#servicios', icon: ShieldCheck },
    { label: 'Diplomas', href: '/#diplomas', icon: BadgeInfo },
    { label: 'Testimonios', href: '/#testimonios', icon: MessageCircleQuestion },
    { label: 'Preguntas Frecuentes', href: '/#preguntas-frecuentes', icon: BadgeInfo },
    { label: 'Contacto', href: '/#contacto', icon: Phone },
    { label: 'Agendar Cita', href: '/agendar-cita', icon: CalendarDays },
  ],
  en: [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Services', href: '/#servicios', icon: ShieldCheck },
    { label: 'Diplomas', href: '/#diplomas', icon: BadgeInfo },
    { label: 'Testimonials', href: '/#testimonios', icon: MessageCircleQuestion },
    { label: 'FAQ', href: '/#preguntas-frecuentes', icon: BadgeInfo },
    { label: 'Contact', href: '/#contacto', icon: Phone },
    { label: 'Schedule Appointment', href: '/agendar-cita', icon: CalendarDays },
  ]
};

export const adminNavItems: AdminNavItemData = {
  es: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Citas', href: '/admin/appointments', icon: CalendarDays },
    { label: 'Mensajes', href: '/admin/messages', icon: MessagesSquare },
    { label: 'Testimonios', href: '/admin/testimonials', icon: ShieldAlert },
    { label: 'Configuración', href: '/admin/settings', icon: Settings }, // Cog or Settings
  ],
  en: [ 
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Appointments', href: '/admin/appointments', icon: CalendarDays },
    { label: 'Messages', href: '/admin/messages', icon: MessagesSquare },
    { label: 'Testimonials', href: '/admin/testimonials', icon: ShieldAlert },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ]
};

/**
 * Header / mobile-menu copy.
 *
 * Deliberately shorter than `generalUiStrings` equivalents: the bar sets its
 * links in tracked uppercase, where "Preguntas Frecuentes" runs 21 characters
 * and breaks the rhythm of the row. `generalUiStrings` still carries the long
 * forms for the footer and the page bodies.
 */
export const navStrings: Record<Language, {
  /** Accessible name for both <nav> landmarks (header + overlay). */
  primaryLabel: string;
  /** Sits beside the wordmark behind a hairline, from 1700px up. */
  tagline: string;
  openMenu: string;
  closeMenu: string;
  menuTitle: string;
  alsoOnPage: string;
  links: { implants: string; services: string; doctor: string; faq: string; contact: string };
  secondary: { testimonials: string; diplomas: string; clinic: string };
  callAria: string;
  callLabel: string;
  addressLabel: string;
  hoursLabel: string;
  languageLabel: string;
  /** Accessible name for the language switch. */
  switchTo: string;
  /** Visible label on the language switch. */
  switchToShort: string;
  viewMap: string;
}> = {
  es: {
    primaryLabel: 'Principal',
    tagline: 'Odontología especializada',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    menuTitle: 'Menú principal',
    alsoOnPage: 'También en esta página',
    links: {
      implants: 'Implantes',
      services: 'Servicios',
      doctor: 'El doctor',
      faq: 'Preguntas',
      contact: 'Contacto',
    },
    secondary: {
      testimonials: 'Testimonios',
      diplomas: 'Diplomas',
      clinic: 'La consulta',
    },
    callAria: 'Llamar al {{phone}}',
    callLabel: 'Teléfono',
    addressLabel: 'Dirección',
    hoursLabel: 'Horario',
    languageLabel: 'Idioma y tema',
    switchTo: 'Switch to English',
    switchToShort: 'English',
    viewMap: 'Ver en el mapa',
  },
  en: {
    primaryLabel: 'Main',
    tagline: 'Specialist dentistry',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menuTitle: 'Main menu',
    alsoOnPage: 'Also on this page',
    links: {
      implants: 'Implants',
      services: 'Services',
      doctor: 'The doctor',
      faq: 'FAQ',
      contact: 'Contact',
    },
    secondary: {
      testimonials: 'Testimonials',
      diplomas: 'Diplomas',
      clinic: 'The clinic',
    },
    callAria: 'Call {{phone}}',
    callLabel: 'Phone',
    addressLabel: 'Address',
    hoursLabel: 'Hours',
    languageLabel: 'Language and theme',
    switchTo: 'Cambiar a Español',
    switchToShort: 'Español',
    viewMap: 'View on map',
  },
};

export const services: ServiceData = {
  es: [
    {
      iconName: 'Users', // Prótesis - personnes/multiple dents
      title: 'Prótesis Dentales',
      description: 'Restauramos la función y estética de tu sonrisa con prótesis fijas y removibles de alta calidad. Esto incluye coronas individuales para proteger dientes dañados, puentes para reemplazar uno o más dientes ausentes utilizando dientes adyacentes como soporte, y dentaduras completas o parciales para una restauración extensa. Cada solución es personalizada para asegurar comodidad, durabilidad y una apariencia natural.',
    },
    {
      iconName: 'Scan', // Implantes - scan/technologie précise
      title: 'Implantes Dentales',
      description: 'Los implantes dentales son la solución más avanzada y duradera para reemplazar dientes perdidos. Consisten en un tornillo de titanio biocompatible que se integra con el hueso maxilar, actuando como una raíz artificial. Sobre este implante se coloca una corona de porcelana o zirconio, indistinguible de un diente natural. Los implantes ofrecen una base estable, previenen la pérdida ósea, mejoran la capacidad de masticación y restauran la estética de manera excepcional.',
    },
    {
      iconName: 'Smile', // Represents a beautiful, aligned smile
      title: 'Ortodoncia',
      description: 'Corregimos dientes desalineados y problemas de mordida (maloclusiones) para mejorar tanto la estética de tu sonrisa como tu salud oral general. Ofrecemos opciones como brackets metálicos tradicionales, brackets cerámicos más discretos, y los modernos alineadores transparentes (ortodoncia invisible). Los tratamientos son adaptados para niños, adolescentes y adultos, buscando una sonrisa alineada, funcional y saludable.',
    },
    {
      iconName: 'Sparkles', // Limpieza - brillance/propreté
      title: 'Limpieza Dental Profesional',
      description: 'La profilaxis dental es fundamental para mantener una boca sana. Este procedimiento elimina la placa bacteriana y el sarro (cálculo dental) que el cepillado diario no puede remover, especialmente en zonas de difícil acceso. Ayuda a prevenir caries, gingivitis, periodontitis y mal aliento. Recomendamos una limpieza cada seis meses para una sonrisa radiante y encías saludables.',
    },
    {
      iconName: 'Activity', // Blanqueamiento - résultats actifs
      title: 'Blanqueamiento Dental',
      description: 'Devuelve el brillo y un tono más blanco a tu sonrisa con nuestros tratamientos de blanqueamiento dental seguros y efectivos. Utilizamos geles blanqueadores de última generación, aplicados profesionalmente en la clínica para resultados rápidos y notables, o mediante kits personalizados para usar en casa bajo supervisión odontológica. Elimina manchas y rejuvenece tu apariencia.',
    },
    {
      iconName: 'ShieldCheck', // Empastes - protection réparation
      title: 'Empastes (Restauraciones)',
      description: 'Reparamos dientes dañados por caries, devolviéndoles su forma, función e integridad. Tras eliminar el tejido carioso, rellenamos la cavidad con resinas compuestas del color del diente (estéticas) que se mimetizan perfectamente con tu sonrisa. Este tratamiento detiene el avance de la caries y alivia la sensibilidad dental.',
    },
    {
      iconName: 'HeartPulse', // Represents saving a tooth/health
      title: 'Endodoncia (Tratamiento de Canal)',
      description: 'Este procedimiento salva un diente cuya pulpa (nervio) está infectada o inflamada debido a caries profundas o traumatismos. Se elimina la pulpa dañada, se limpian y desinfectan los conductos radiculares, y luego se sellan herméticamente. La endodoncia alivia el dolor intenso y permite conservar el diente natural, evitando su extracción.',
    },
    {
      iconName: 'Stethoscope', // Consulta - examen médical
      title: 'Consulta General/Revisión',
      description: 'Las consultas generales y revisiones periódicas son la base de una buena salud bucodental. El Dr. Francis Valerio realizará un examen completo de tus dientes, encías y tejidos orales, utilizando radiografías digitales si es necesario, para detectar problemas en etapas tempranas. Se discutirá cualquier hallazgo y se elaborará un plan de tratamiento personalizado si es preciso.',
    }
  ],
  en: [
    {
      iconName: 'Users', // Prosthetics - multiple teeth/people
      title: 'Dental Prosthetics',
      description: 'We restore the function and aesthetics of your smile with high-quality fixed and removable prosthetics. This includes individual crowns to protect damaged teeth, bridges to replace one or more missing teeth using adjacent teeth as support, and full or partial dentures for extensive restoration. Each solution is customized to ensure comfort, durability, and a natural appearance.',
    },
    {
      iconName: 'Scan', // Implants - scan/precision technology
      title: 'Dental Implants',
      description: 'Dental implants are the most advanced and durable solution for replacing missing teeth. They consist of a biocompatible titanium screw that integrates with the jawbone, acting as an artificial root. A porcelain or zirconia crown, indistinguishable from a natural tooth, is placed on this implant. Implants offer a stable base, prevent bone loss, improve chewing ability, and exceptionally restore aesthetics.',
    },
    {
      iconName: 'Smile', 
      title: 'Orthodontics',
      description: 'We correct misaligned teeth and bite problems (malocclusions) to improve both the aesthetics of your smile and your overall oral health. We offer options such as traditional metal braces, more discreet ceramic braces, and modern clear aligners (invisible orthodontics). Treatments are tailored for children, adolescents, and adults, aiming for a straight, functional, and healthy smile.',
    },
    {
      iconName: 'Sparkles', // Cleaning - shine/brightness
      title: 'Professional Dental Cleaning',
      description: 'Dental prophylaxis is essential for maintaining a healthy mouth. This procedure removes bacterial plaque and tartar (dental calculus) that daily brushing cannot, especially in hard-to-reach areas. It helps prevent cavities, gingivitis, periodontitis, and bad breath. We recommend a cleaning every six months for a radiant smile and healthy gums.',
    },
    {
      iconName: 'Activity', // Whitening - active results
      title: 'Teeth Whitening',
      description: 'Restore brightness and a whiter shade to your smile with our safe and effective teeth whitening treatments. We use latest-generation whitening gels, professionally applied in the clinic for quick and noticeable results, or through custom take-home kits under dental supervision. It removes stains and rejuvenates your appearance.',
    },
    {
      iconName: 'ShieldCheck', 
      title: 'Fillings (Restorations)',
      description: 'We repair teeth damaged by decay, restoring their shape, function, and integrity. After removing carious tissue, we fill the cavity with tooth-colored composite resins (aesthetic) that blend perfectly with your smile. This treatment stops decay progression and relieves dental sensitivity.',
    },
    {
      iconName: 'HeartPulse', 
      title: 'Endodontics (Root Canal Treatment)',
      description: 'This procedure saves a tooth whose pulp (nerve) is infected or inflamed due to deep cavities or trauma. The damaged pulp is removed, root canals are cleaned and disinfected, and then hermetically sealed. Endodontics relieves severe pain and allows the natural tooth to be preserved, avoiding extraction.',
    },
    {
      iconName: 'Stethoscope', // Consultation - medical exam
      title: 'General Consultation/Check-up',
      description: 'General consultations and periodic check-ups are the foundation of good oral health. Dr. Francis Valerio will perform a comprehensive examination of your teeth, gums, and oral tissues, using digital X-rays if necessary, to detect problems in early stages. Any findings will be discussed, and a personalized treatment plan will be developed if needed.',
    }
  ]
};

export const testimonials: TestimonialData = {
  es: [
    {
      quote: 'El Dr. Valerio y su equipo en Orthoprotesis Dental Clinic son increíbles. Me sentí muy cómodo y los resultados de mi tratamiento fueron fantásticos. ¡Totalmente recomendado!',
      name: 'Ana Pérez',
      location: 'Santiago de los Caballeros',
    },
    {
      quote: 'Desde que llegué a Orthoprotesis Dental Clinic, supe que estaba en buenas manos. Muy profesionales y atentos. Mi sonrisa nunca se ha visto mejor.',
      name: 'Carlos Rodríguez',
      location: 'Santiago de los Caballeros',
    },
    {
      quote: 'Tenía mucho miedo de ir al dentista, pero en Orthoprotesis Dental Clinic, especialmente el Dr. Francis Valerio, me trataron con mucha paciencia y delicadeza. ¡Gracias por todo!',
      name: 'Sofía Gómez',
      location: 'La Romana',
    },
  ],
  en: [
    {
      quote: 'Dr. Valerio and his team at Orthoprotesis Dental Clinic are incredible. I felt very comfortable and the results of my treatment were fantastic. Highly recommended!',
      name: 'Ana Perez',
      location: 'Santiago de los Caballeros',
    },
    {
      quote: 'From the moment I arrived at Orthoprotesis Dental Clinic, I knew I was in good hands. Very professional and attentive. My smile has never looked better.',
      name: 'Carlos Rodriguez',
      location: 'Santiago de los Caballeros',
    },
    {
      quote: 'I was very afraid of going to the dentist, but at Orthoprotesis Dental Clinic, especially Dr. Francis Valerio, they treated me with a lot of patience and gentleness. Thank you for everything!',
      name: 'Sofia Gomez',
      location: 'La Romana',
    },
  ]
};

export const faqItems: FAQData = {
  es: [
    {
      id: 'faq1',
      question: '¿Con qué frecuencia debo visitar al dentista?',
      answer: 'Recomendamos una visita de control y limpieza dental profesional en Orthoprotesis Dental Clinic cada seis meses. Sin embargo, el Dr. Francis Valerio puede sugerir una frecuencia diferente según tus necesidades individuales.',
    },
    {
      id: 'faq2',
      question: '¿El blanqueamiento dental daña los dientes?',
      answer: 'Cuando es realizado por un profesional como el Dr. Francis Valerio, el blanqueamiento dental es un procedimiento seguro que no daña el esmalte de tus dientes. Utilizamos productos de calidad y técnicas probadas.',
    },
    {
      id: 'faq3',
      question: '¿Qué debo hacer si tengo una emergencia dental?',
      answer: 'Si tienes una emergencia dental, como dolor severo, un diente roto o una infección, contacta a Orthoprotesis Dental Clinic de inmediato al 809-581-7059. Haremos lo posible por atenderte lo antes posible.',
    },
    {
      id: 'faq4',
      question: '¿Aceptan seguro dental?',
      answer: 'En Orthoprotesis Dental Clinic trabajamos con varios planes de seguros dentales. Por favor, contáctanos con la información de tu seguro para verificar la cobertura.',
    },
    {
      id: 'faq5',
      question: '¿Qué tipo de prótesis dentales ofrecen?',
      answer: 'El Dr. Francis Valerio se especializa en una amplia gama de prótesis, incluyendo coronas individuales, puentes fijos para reemplazar varios dientes, y dentaduras parciales o completas, tanto convencionales como sobre implantes, adaptadas a tus necesidades.',
    },
    {
      id: 'faq6',
      question: '¿Soy candidato para implantes dentales?',
      answer: 'Una evaluación detallada por el Dr. Francis Valerio es necesaria. Generalmente, buenos candidatos tienen encías sanas y suficiente hueso maxilar para soportar el implante. Incluso si hay pérdida ósea, existen técnicas de regeneración. Ofrecemos consultas para determinar la mejor opción para ti.',
    }
  ],
  en: [
     {
      id: 'faq1',
      question: 'How often should I visit the dentist?',
      answer: 'We recommend a check-up and professional dental cleaning at Orthoprotesis Dental Clinic every six months. However, Dr. Francis Valerio may suggest a different frequency based on your individual needs.',
    },
    {
      id: 'faq2',
      question: 'Does teeth whitening damage teeth?',
      answer: 'When performed by a professional like Dr. Francis Valerio, teeth whitening is a safe procedure that does not damage your tooth enamel. We use quality products and proven techniques.',
    },
    {
      id: 'faq3',
      question: 'What should I do if I have a dental emergency?',
      answer: 'If you have a dental emergency, such as severe pain, a broken tooth, or an infection, contact Orthoprotesis Dental Clinic immediately at 809-581-7059. We will do our best to see you as soon as possible.',
    },
    {
      id: 'faq4',
      question: 'Do you accept dental insurance?',
      answer: 'At Orthoprotesis Dental Clinic, we work with various dental insurance plans. Please contact us with your insurance information to verify coverage.',
    },
    {
      id: 'faq5',
      question: 'What types of dental prosthetics do you offer?',
      answer: 'Dr. Francis Valerio specializes in a wide range of prosthetics, including individual crowns, fixed bridges to replace multiple teeth, and partial or complete dentures, both conventional and implant-supported, tailored to your needs.',
    },
    {
      id: 'faq6',
      question: 'Am I a candidate for dental implants?',
      answer: 'A detailed evaluation by Dr. Francis Valerio is necessary. Generally, good candidates have healthy gums and sufficient jawbone to support the implant. Even if there is bone loss, bone regeneration techniques exist. We offer consultations to determine the best option for you.',
    }
  ]
};

export const formTranslations: FormTranslations = {
  contactForm: {
    es: {
      nameLabel: "Nombre Completo",
      namePlaceholder: "Ej: Juan Pérez",
      emailLabel: "Correo Electrónico",
      emailPlaceholder: "Ej: juan.perez@correo.com",
      phoneLabel: "Teléfono (Opcional)",
      phonePlaceholder: "Ej: (809) 555-1234",
      messageLabel: "Mensaje",
      messagePlaceholder: "Escriba su consulta o mensaje aquí...",
      submitButtonText: "Enviar Mensaje",
      submittingButtonText: "Enviando...",
      successToastTitle: "Mensaje Enviado",
      errorToastTitle: "Error",
      unexpectedErrorToastTitle: "Error Inesperado",
    },
    en: {
      nameLabel: "Full Name",
      namePlaceholder: "E.g.: John Doe",
      emailLabel: "Email Address",
      emailPlaceholder: "E.g.: john.doe@email.com",
      phoneLabel: "Phone (Optional)",
      phonePlaceholder: "E.g.: (555) 123-4567",
      messageLabel: "Message",
      messagePlaceholder: "Write your inquiry or message here...",
      submitButtonText: "Send Message",
      submittingButtonText: "Sending...",
      successToastTitle: "Message Sent",
      errorToastTitle: "Error",
      unexpectedErrorToastTitle: "Unexpected Error",
    }
  },
  appointmentForm: {
    es: {
      nameLabel: "Nombre Completo",
      namePlaceholder: "Ej: María González",
      emailLabel: "Correo Electrónico",
      emailPlaceholder: "Ej: maria.gonzalez@correo.com",
      phoneLabel: "Teléfono",
      phonePlaceholder: "Ej: (829) 123-4567",
      serviceTypeLabel: "Tipo de Servicio Requerido",
      serviceTypePlaceholder: "Seleccione el servicio que necesita",
      reasonLabel: "Motivo de la Cita",
      reasonPlaceholder: "Describa brevemente el motivo de su visita o cualquier síntoma...",
      urgencyLabel: "¿Es una Urgencia?",
      submitButtonText: "Solicitar Cita",
      submittingButtonText: "Enviando Solicitud...",
      successToastTitle: "Solicitud Enviada",
      errorToastTitle: "Error en la Solicitud",
      unexpectedErrorToastTitle: "Error Inesperado",
    },
    en: {
      nameLabel: "Full Name",
      namePlaceholder: "E.g.: Mary Smith",
      emailLabel: "Email Address",
      emailPlaceholder: "E.g.: mary.smith@email.com",
      phoneLabel: "Phone",
      phonePlaceholder: "E.g.: (555) 987-6543",
      serviceTypeLabel: "Type of Service Required",
      serviceTypePlaceholder: "Select the service you need",
      reasonLabel: "Reason for Appointment",
      reasonPlaceholder: "Briefly describe the reason for your visit or any symptoms...",
      urgencyLabel: "Is it Urgent?",
      submitButtonText: "Request Appointment",
      submittingButtonText: "Sending Request...",
      successToastTitle: "Request Sent",
      errorToastTitle: "Error in Request",
      unexpectedErrorToastTitle: "Unexpected Error",
    }
  },
  testimonialForm: {
    es: {
      nameLabel: "Su Nombre",
      namePlaceholder: "Ej: Juan Pérez",
      emailLabel: "Correo Electrónico",
      emailPlaceholder: "Ej: juan.perez@correo.com",
      phoneLabel: "Teléfono (Opcional)",
      phonePlaceholder: "Ej: (809) 555-1234",
      quoteLabel: "Su Testimonio",
      quotePlaceholder: "Comparta su experiencia con nosotros...",
      locationLabel: "Su Ubicación (Opcional)",
      locationPlaceholder: "Ej: Santiago de los Caballeros",
      submitButtonText: "Enviar Testimonio",
      submittingButtonText: "Enviando Testimonio...",
      successToastTitle: "Testimonio Enviado",
      errorToastTitle: "Error al Enviar",
      unexpectedErrorToastTitle: "Error Inesperado",
    },
    en: {
      nameLabel: "Your Name",
      namePlaceholder: "E.g.: John Doe",
      emailLabel: "Email Address",
      emailPlaceholder: "E.g.: john.doe@email.com",
      phoneLabel: "Phone (Optional)",
      phonePlaceholder: "E.g.: (555) 123-4567",
      quoteLabel: "Your Testimonial",
      quotePlaceholder: "Share your experience with us...",
      locationLabel: "Your Location (Optional)",
      locationPlaceholder: "E.g.: Santiago de los Caballeros",
      submitButtonText: "Submit Testimonial",
      submittingButtonText: "Submitting Testimonial...",
      successToastTitle: "Testimonial Submitted",
      errorToastTitle: "Submission Error",
      unexpectedErrorToastTitle: "Unexpected Error",
    }
  }
};

// Shared form copy: privacy/consent microcopy, response-time reassurance and the
// persistent success-panel strings. Kept here (content-as-data) so it stays in
// sync across the appointment, contact and testimonial forms.
export const formCommon: Record<Language, {
  charactersWord: string;
  requiredFields: string;
  responseTime: string;
  consentBefore: string;
  privacyLinkLabel: string;
  consentAfter: string;
  testimonialConsent: string;
  successTitle: string;
  successAnother: string;
  urgencyHelpOn: string;
  urgencyHelpOff: string;
}> = {
  es: {
    charactersWord: "caracteres",
    requiredFields: "Campos obligatorios",
    responseTime: "Te responderemos en menos de 24 horas.",
    consentBefore: "Tus datos solo se usan para gestionar tu solicitud y nunca se comparten. Consulta nuestra ",
    privacyLinkLabel: "Política de Privacidad",
    consentAfter: ".",
    testimonialConsent: "Al enviar, autorizas a la clínica a publicar tu testimonio (nombre y ubicación) en este sitio. Puedes pedir que lo retiremos cuando quieras.",
    successTitle: "¡Solicitud recibida!",
    successAnother: "Enviar otra solicitud",
    urgencyHelpOn: "Atención prioritaria activada",
    urgencyHelpOff: "Marca esta casilla si necesitas atención inmediata",
  },
  en: {
    charactersWord: "characters",
    requiredFields: "Required fields",
    responseTime: "We'll reply within 24 hours.",
    consentBefore: "Your information is used only to manage your request and is never shared. See our ",
    privacyLinkLabel: "Privacy Policy",
    consentAfter: ".",
    testimonialConsent: "By submitting, you authorize the clinic to publish your testimonial (name and location) on this site. You can ask us to remove it at any time.",
    successTitle: "Request received!",
    successAnother: "Send another request",
    urgencyHelpOn: "Priority attention enabled",
    urgencyHelpOff: "Check this box if you need immediate attention",
  },
};

/**
 * Booking page + appointment form copy.
 *
 * `reasonPrefix` is the only entry here that is not shown on the page: the
 * server action folds the chosen day and time-of-day into the `reason` column
 * using these strings, because `appointments` has no date column yet. See
 * `submitAppointmentForm` in src/app/actions.ts and the OPTIONAL, NOT-APPLIED
 * columns preferred_date and time_preference in migrations/0001_init.sql.
 */
export const appointmentBooking: Record<Language, {
  standfirst: string;
  requiredMark: string;
  /** sr-only prefix on each fieldset legend: "Paso {{step}} de {{total}}". */
  stepOf: string;
  /** sr-only suffix on a fieldset legend once every field in it validates. */
  stepComplete: string;
  groupWho: string;
  groupWhoHint: string;
  groupWhat: string;
  groupWhatHint: string;
  groupWhen: string;
  groupWhenHint: string;
  phoneHelp: string;
  emailHelp: string;
  reasonHelp: string;
  /** sr-only. States the 500-character cap once, when the textarea is focused,
   *  instead of forcing a live counter to announce on every keystroke. */
  reasonLimitNote: string;
  /** Visual counter, shown only in the last fifth of the allowance. */
  reasonRemaining: string;
  reasonLimitReached: string;
  preferredDateLabel: string;
  preferredDateHelp: string;
  preferredDatePicked: string;
  preferredDateFix: string;
  /** Empty state of the calendar trigger (pointer devices only). */
  preferredDatePlaceholder: string;
  /** Explains the greyed-out cells inside the calendar popover. */
  preferredDateWeekendNote: string;
  timePreferenceLabel: string;
  timePreferenceHelp: string;
  timeOptions: { value: 'morning' | 'afternoon' | 'any'; label: string; hint: string }[];
  liveSubmitting: string;
  errorSummary: string;
  /** Shown directly above the submit button — the commitment moment. `key`
   *  selects the icon in appointment-form.tsx, so the set is closed. */
  submitReassurance: { key: 'call' | 'reply' | 'cost'; text: string }[];
  asideStepsTitle: string;
  asideHoursNote: string;
  asideCallTitle: string;
  asideCallBody: string;
  asidePhoneLabel: string;
  asideAddressLabel: string;
  urgentTitle: string;
  urgentBody: string;
  urgentCta: string;
  reasonPrefix: {
    label: string;
    times: { morning: string; afternoon: string; any: string };
  };
}> = {
  es: {
    standfirst:
      "Rellene el formulario y le llamamos para acordar el día y la hora definitivos. La primera visita es una evaluación: revisamos su caso, le explicamos las opciones y le damos el presupuesto antes de empezar nada.",
    requiredMark: "obligatorio",
    stepOf: "Paso {{step}} de {{total}}",
    stepComplete: "Completado",
    groupWho: "Quién es usted",
    groupWhoHint: "Lo justo para poder llamarle y confirmar la cita.",
    groupWhat: "Qué necesita",
    groupWhatHint: "Así el Dr. Valerio llega a la consulta sabiendo de qué se trata.",
    groupWhen: "Cuándo le conviene",
    groupWhenHint: "Es una preferencia, no una reserva en firme: la confirmamos por teléfono.",
    phoneHelp: "Es por donde le llamamos para confirmar.",
    emailHelp: "Le enviamos el resguardo de la solicitud.",
    reasonHelp: "Molestia, pieza afectada, desde cuándo…",
    reasonLimitNote: "Puede escribir hasta 500 caracteres.",
    reasonRemaining: "Quedan {{count}} caracteres",
    reasonLimitReached: "Ha llegado al límite de 500 caracteres.",
    preferredDateLabel: "Día que prefiere",
    preferredDateHelp: "Atendemos de lunes a viernes, de 9:00 a 18:00.",
    preferredDatePicked: "Ha elegido:",
    preferredDateFix: "Elegir el {{date}}",
    preferredDatePlaceholder: "Elija un día",
    preferredDateWeekendNote: "Los sábados y domingos salen desactivados: la clínica no atiende esos días.",
    timePreferenceLabel: "Franja horaria",
    timePreferenceHelp: "Elija el momento del día que mejor le venga.",
    timeOptions: [
      { value: 'morning', label: "Por la mañana", hint: "Antes del mediodía" },
      { value: 'afternoon', label: "Por la tarde", hint: "Después del mediodía" },
      { value: 'any', label: "Cualquier hora", hint: "Me adapto a la clínica" },
    ],
    liveSubmitting: "Enviando su solicitud…",
    errorSummary:
      "Faltan {{count}} campo(s) por corregir. Los hemos señalado más abajo y hemos llevado el cursor al primero.",
    submitReassurance: [
      { key: 'call', text: "Le confirmamos la cita por teléfono: al enviar no queda reservada todavía." },
      { key: 'reply', text: "Le respondemos en menos de 24 horas laborables." },
      { key: 'cost', text: "Enviar la solicitud no tiene ningún costo ni compromiso." },
    ],
    asideStepsTitle: "Qué pasa después",
    asideHoursNote: "Fuera de ese horario puede enviar el formulario igualmente: le contestamos al día siguiente laborable.",
    asideCallTitle: "¿Prefiere llamar?",
    asideCallBody: "También puede pedir la cita por teléfono en horario de consulta.",
    asidePhoneLabel: "Teléfono",
    asideAddressLabel: "Dirección",
    urgentTitle: "¿Necesita que le vean hoy?",
    urgentBody:
      "Si tiene dolor fuerte, un golpe o una infección, llame directamente a la clínica en horario de consulta en lugar de esperar a que le contestemos el formulario.",
    urgentCta: "Llamar a la clínica",
    reasonPrefix: {
      label: "Preferencia de cita",
      times: {
        morning: "por la mañana",
        afternoon: "por la tarde",
        any: "cualquier hora",
      },
    },
  },
  en: {
    standfirst:
      "Fill in the form and we will call you to agree the final day and time. The first visit is an assessment: we review your case, explain the options, and give you a quote before anything begins.",
    requiredMark: "required",
    stepOf: "Step {{step}} of {{total}}",
    stepComplete: "Completed",
    groupWho: "Who you are",
    groupWhoHint: "Just enough for us to call you back and confirm.",
    groupWhat: "What you need",
    groupWhatHint: "So Dr. Valerio walks into the room already knowing the situation.",
    groupWhen: "When it suits you",
    groupWhenHint: "A preference, not a firm booking — we confirm it by phone.",
    phoneHelp: "This is the number we call to confirm.",
    emailHelp: "We send you a copy of the request.",
    reasonHelp: "Discomfort, which tooth, how long it has been going on…",
    reasonLimitNote: "You can write up to 500 characters.",
    reasonRemaining: "{{count}} characters left",
    reasonLimitReached: "You have reached the 500-character limit.",
    preferredDateLabel: "Preferred day",
    preferredDateHelp: "We are open Monday to Friday, 9:00 to 18:00.",
    preferredDatePicked: "You chose:",
    preferredDateFix: "Use {{date}} instead",
    preferredDatePlaceholder: "Choose a day",
    preferredDateWeekendNote: "Saturdays and Sundays are greyed out — the clinic is closed on those days.",
    timePreferenceLabel: "Time of day",
    timePreferenceHelp: "Pick whichever part of the day suits you best.",
    timeOptions: [
      { value: 'morning', label: "Morning", hint: "Before midday" },
      { value: 'afternoon', label: "Afternoon", hint: "After midday" },
      { value: 'any', label: "Any time", hint: "I'll fit around the clinic" },
    ],
    liveSubmitting: "Sending your request…",
    errorSummary:
      "{{count}} field(s) still need fixing. They are marked below and we have moved the cursor to the first one.",
    submitReassurance: [
      { key: 'call', text: "We confirm the appointment by phone — sending this does not reserve a slot yet." },
      { key: 'reply', text: "We reply within 24 working hours." },
      { key: 'cost', text: "Sending the request costs nothing and commits you to nothing." },
    ],
    asideStepsTitle: "What happens next",
    asideHoursNote: "Outside those hours you can still send the form — we reply on the next working day.",
    asideCallTitle: "Prefer to call?",
    asideCallBody: "You can also book by phone during opening hours.",
    asidePhoneLabel: "Phone",
    asideAddressLabel: "Address",
    urgentTitle: "Need to be seen today?",
    urgentBody:
      "If you have severe pain, an injury or an infection, call the clinic directly during opening hours rather than waiting for a reply to the form.",
    urgentCta: "Call the clinic",
    reasonPrefix: {
      label: "Appointment preference",
      times: {
        morning: "morning",
        afternoon: "afternoon",
        any: "any time",
      },
    },
  },
};

// Bilingual privacy notice. Describes the site's actual data handling (forms used
// only to contact patients about their request; no sharing/selling). NOT a
// substitute for legal review under DR Ley 172-13 — see FINAL_REPORT.md.
export const privacyPolicy: Record<Language, {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  contactHeading: string;
  contactBody: string;
}> = {
  es: {
    title: "Política de Privacidad",
    intro: "En Orthoprotesis Dental Clinic respetamos tu privacidad. Esta política explica qué datos recogemos a través de este sitio y cómo los usamos.",
    sections: [
      { heading: "Qué datos recogemos", body: "Cuando completas el formulario de cita, de contacto o de testimonio, recogemos los datos que nos facilitas: nombre, correo electrónico, teléfono y el motivo o mensaje de tu consulta." },
      { heading: "Para qué los usamos", body: "Usamos tus datos únicamente para responder a tu solicitud y coordinar tu atención. No los vendemos ni los compartimos con terceros con fines comerciales." },
      { heading: "Conservación", body: "Conservamos tus datos solo durante el tiempo necesario para atender tu solicitud y cumplir con nuestras obligaciones legales." },
      { heading: "Tus derechos", body: "Puedes solicitar el acceso, la corrección o la eliminación de tus datos en cualquier momento contactándonos. Tratamos tus datos conforme a la Ley 172-13 sobre protección de datos personales de la República Dominicana." },
      { heading: "Seguridad", body: "Aplicamos medidas técnicas razonables para proteger tu información. Las comunicaciones con este sitio se realizan mediante conexión cifrada (HTTPS)." },
    ],
    contactHeading: "Cómo contactarnos",
    contactBody: "Para ejercer tus derechos o resolver dudas sobre tu privacidad, escríbenos a info@orthoprotesisdental.com o llámanos al 809-581-7059.",
  },
  en: {
    title: "Privacy Policy",
    intro: "At Orthoprotesis Dental Clinic we respect your privacy. This policy explains what data we collect through this website and how we use it.",
    sections: [
      { heading: "What we collect", body: "When you complete the appointment, contact or testimonial form, we collect the details you provide: name, email, phone, and the reason or message of your inquiry." },
      { heading: "How we use it", body: "We use your data only to respond to your request and coordinate your care. We do not sell it or share it with third parties for commercial purposes." },
      { heading: "Retention", body: "We keep your data only for as long as necessary to handle your request and meet our legal obligations." },
      { heading: "Your rights", body: "You can request access to, correction of, or deletion of your data at any time by contacting us. We handle your data in accordance with Dominican Republic Law 172-13 on personal data protection." },
      { heading: "Security", body: "We apply reasonable technical measures to protect your information. Communication with this site uses an encrypted connection (HTTPS)." },
    ],
    contactHeading: "How to reach us",
    contactBody: "To exercise your rights or ask about your privacy, email us at info@orthoprotesisdental.com or call 809-581-7059.",
  },
};

// General, factual patient education for the implants section (no clinic-specific
// claims, statistics or guarantees). Rendered with a calm, accessible SVG
// cross-section in src/components/sections/implant-education.tsx.
export const implantEducation: Record<Language, {
  eyebrow: string;
  title: string;
  description: string;
  svgAlt: string;
  parts: { label: string; desc: string }[];
  stepsTitle: string;
  steps: { title: string; desc: string }[];
  ctaLabel: string;
}> = {
  es: {
    eyebrow: "Educación para el paciente",
    title: "¿Cómo funciona un implante dental?",
    description: "Un implante reemplaza la raíz de un diente perdido y sostiene una corona que luce y funciona como un diente natural.",
    svgAlt: "Diagrama en corte de un implante dental: corona, pilar, poste de titanio integrado en el hueso.",
    parts: [
      { label: "Corona", desc: "La parte visible, hecha a medida para imitar su diente natural." },
      { label: "Pilar", desc: "Conecta la corona con el implante de forma segura." },
      { label: "Implante de titanio", desc: "Un poste de titanio biocompatible que reemplaza la raíz." },
      { label: "Hueso", desc: "El implante se integra con el hueso para dar firmeza (osteointegración)." },
    ],
    stepsTitle: "El proceso, paso a paso",
    steps: [
      { title: "Evaluación", desc: "Revisamos su salud bucal y planificamos su tratamiento con usted." },
      { title: "Colocación", desc: "Se coloca el implante de titanio en el hueso con cuidado." },
      { title: "Corona definitiva", desc: "Tras la cicatrización, se coloca su corona personalizada." },
    ],
    ctaLabel: "Consultar sobre implantes",
  },
  en: {
    eyebrow: "Patient education",
    title: "How does a dental implant work?",
    description: "An implant replaces the root of a missing tooth and supports a crown that looks and works like a natural tooth.",
    svgAlt: "Cross-section diagram of a dental implant: crown, abutment and a titanium post fused into the bone.",
    parts: [
      { label: "Crown", desc: "The visible part, custom-made to match your natural tooth." },
      { label: "Abutment", desc: "Securely connects the crown to the implant." },
      { label: "Titanium implant", desc: "A biocompatible titanium post that replaces the root." },
      { label: "Bone", desc: "The implant fuses with the bone for stability (osseointegration)." },
    ],
    stepsTitle: "The process, step by step",
    steps: [
      { title: "Assessment", desc: "We review your oral health and plan your treatment with you." },
      { title: "Placement", desc: "The titanium implant is carefully placed in the bone." },
      { title: "Final crown", desc: "After healing, your custom crown is fitted." },
    ],
    ctaLabel: "Ask about implants",
  },
};

export const actionMessages: ActionMessages = {
  es: {
    formCorrection: "Por favor, corrija los errores en el formulario.",
    contactSuccess: "¡Gracias por su mensaje! Nos pondremos en contacto con usted pronto.",
    contactError: "Hubo un error al enviar su mensaje. Por favor, intente de nuevo más tarde.",
    appointmentSuccess: "¡Gracias por solicitar una cita! Nos pondremos en contacto con usted pronto para confirmar los detalles.",
    appointmentError: "Hubo un error al enviar su solicitud de cita. Por favor, intente de nuevo más tarde.",
    testimonialSuccess: "¡Gracias por compartir su testimonio! Será revisado pronto.",
    testimonialError: "Hubo un error al enviar su testimonio. Por favor, intente de nuevo más tarde.",
    testimonialModerationFailed: "El contenido del testimonio no es apropiado y no puede ser enviado.",
    testimonialModerationReasonPrefix: "Motivo: ",
    testimonialModerationApiError: "Error durante la moderación del contenido. Por favor, revise su texto e intente de nuevo.",
    // Every message names the PROBLEM and the RECOVERY. "Número inválido" tells
    // a patient nothing they can act on; "escríbalo con 7 a 15 dígitos" does.
    zod: {
      nameMin: "Escriba su nombre completo (al menos 2 caracteres).",
      emailInvalid: "Ese correo no parece completo. Debe incluir @ y un dominio, por ejemplo maria@correo.com.",
      phoneInvalid: "Ese teléfono no parece válido. Escríbalo con 7 a 15 dígitos, por ejemplo (829) 123-4567.",
      messageMin: "El mensaje debe tener al menos 10 caracteres.",
      messageMax: "El mensaje no debe exceder los 1000 caracteres.",
      serviceTypeRequired: "Seleccione un servicio de la lista. Si no está seguro, elija «Consulta General/Revisión».",
      reasonMin: "Cuéntenos algo más: al menos 10 caracteres para que podamos preparar su consulta.",
      reasonMax: "El motivo no debe exceder los 500 caracteres. Resuma lo esencial; lo demás lo vemos en consulta.",
      quoteMin: "El testimonio debe tener al menos 15 caracteres.",
      quoteMax: "El testimonio no debe exceder los 500 caracteres.",
      serviceTypeMax: "El tipo de servicio es demasiado largo.",
      invalidCharacters: "El texto contiene caracteres no válidos. Borre símbolos raros o texto pegado de otra aplicación.",
      nameMax: "El nombre es demasiado largo.",
      emailMax: "El correo electrónico es demasiado largo.",
      locationMax: "La ubicación es demasiado larga.",
      emailUnverifiable: "No podemos usar esa dirección de correo. Escriba un correo personal o de trabajo (no uno temporal o desechable).",
      phoneUnverifiable: "No podemos usar ese número. Revise que sean 7 a 15 dígitos reales, por ejemplo (829) 123-4567.",
      preferredDateRequired: "Elija el día que prefiere. Es solo una preferencia: le llamamos para confirmarla.",
      preferredDateInvalid: "Esa fecha no es válida. Use el selector del campo o escríbala como día/mes/año.",
      preferredDatePast: "Esa fecha ya pasó. Elija hoy o un día posterior.",
      preferredDateClosed: "La clínica atiende de lunes a viernes. Elija un día entre semana.",
      preferredDateTooFar: "Solo tomamos solicitudes con hasta 6 meses de antelación. Elija una fecha más cercana.",
      timePreferenceRequired: "Indique si prefiere mañana o tarde. Si le da igual, elija «Cualquier hora».",
    }
  },
  en: {
    formCorrection: "Please correct the errors in the form.",
    contactSuccess: "Thank you for your message! We will contact you soon.",
    contactError: "There was an error sending your message. Please try again later.",
    appointmentSuccess: "Thank you for requesting an appointment! We will contact you soon to confirm the details.",
    appointmentError: "There was an error sending your appointment request. Please try again later.",
    testimonialSuccess: "Thank you for sharing your testimonial! It will be reviewed soon.",
    testimonialError: "There was an error submitting your testimonial. Please try again later.",
    testimonialModerationFailed: "The content of the testimonial is not appropriate and cannot be submitted.",
    testimonialModerationReasonPrefix: "Reason: ",
    testimonialModerationApiError: "Error during content moderation. Please review your text and try again.",
    // Every message names the PROBLEM and the RECOVERY. "Invalid phone number"
    // tells a patient nothing they can act on; "use 7 to 15 digits" does.
    zod: {
      nameMin: "Enter your full name (at least 2 characters).",
      emailInvalid: "That email looks incomplete. It needs an @ and a domain, e.g. mary@email.com.",
      phoneInvalid: "That phone number doesn't look right. Use 7 to 15 digits, e.g. (555) 987-6543.",
      messageMin: "Message must be at least 10 characters long.",
      messageMax: "Message must not exceed 1000 characters.",
      serviceTypeRequired: "Pick a service from the list. If you're not sure, choose “General Consultation/Check-up”.",
      reasonMin: "Tell us a little more — at least 10 characters, so we can prepare for your visit.",
      reasonMax: "The reason must not exceed 500 characters. Summarise the essentials; we'll cover the rest in the chair.",
      quoteMin: "Testimonial must be at least 15 characters long.",
      quoteMax: "Testimonial must not exceed 500 characters.",
      serviceTypeMax: "The service type is too long.",
      invalidCharacters: "The text contains invalid characters. Remove any odd symbols or text pasted from another app.",
      nameMax: "The name is too long.",
      emailMax: "The email address is too long.",
      locationMax: "The location is too long.",
      emailUnverifiable: "We can't use that email address. Please use a personal or work address (not a temporary or disposable one).",
      phoneUnverifiable: "We can't use that number. Check it is 7 to 15 real digits, e.g. (555) 987-6543.",
      preferredDateRequired: "Pick the day you'd prefer. It's only a preference — we call you to confirm it.",
      preferredDateInvalid: "That date isn't valid. Use the field's date picker, or type it as day/month/year.",
      preferredDatePast: "That date has already passed. Choose today or a later day.",
      preferredDateClosed: "The clinic is open Monday to Friday. Please choose a weekday.",
      preferredDateTooFar: "We only take requests up to 6 months ahead. Please choose a nearer date.",
      timePreferenceRequired: "Tell us whether you prefer morning or afternoon. If it makes no difference, choose “Any time”.",
    }
  }
};


export const contactDetails: ContactDetails = {
  clinicName: {
    es: "Orthoprotesis Dental Clinic",
    en: "Orthoprotesis Dental Clinic"
  },
  doctorName: {
    es: "Dr. Francis Valerio",
    en: "Dr. Francis Valerio"
  },
  address: {
    es: 'Plaza Las Ramblas, Módulo 101, Santiago de los Caballeros, República Dominicana',
    en: 'Plaza Las Ramblas, Module 101, Santiago de los Caballeros, Dominican Republic'
  },
  phone: {
    es: '809-581-7059', 
    en: '809-581-7059'  
  },
  email: {
    es: 'info@orthoprotesisdental.com', 
    en: 'info@orthoprotesisdental.com'  
  },
  schedule: {
    es: 'Lunes a Viernes: 9:00 AM - 6:00 PM',
    en: 'Monday to Friday: 9:00 AM - 6:00 PM'
  },
  mapLink: {
    es: 'https://maps.google.com/?q=Plaza+Las+Ramblas+Santiago+de+los+Caballeros', 
    en: 'https://maps.google.com/?q=Plaza+Las+Ramblas+Santiago+de+los+Caballeros'
  },
  embedMapLink: {
    es: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4060.840856210959!2d-70.69729749999999!3d19.4541221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eb1cf5f2201f147%3A0xf5965af18d5482e2!2sPlaza%20las%20Ramblas!5e1!3m2!1ses!2sdo!4v1749698637474!5m2!1ses!2sdo`,
    en: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4060.840856210959!2d-70.69729749999999!3d19.4541221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eb1cf5f2201f147%3A0xf5965af18d5482e2!2sPlaza%20las%20Ramblas!5e1!3m2!1sen!2sdo!4v1749698637474!5m2!1sen!2sdo`
  },
  qualifications: {
    es: [
      "Especialista en Prótesis, Implantes y Ortodoncia",
      "Odontología General y Estética Avanzada",
      "Miembro de la Asociación Odontológica Dominicana",
      "Más de 30 años de experiencia",
      "Compromiso con la última tecnología dental"
    ],
    en: [
      "Specialist in Prosthetics, Implants, and Orthodontics",
      "General and Advanced Aesthetic Dentistry",
      "Member of the Dominican Dental Association",
      "Over 30 years of experience",
      "Commitment to the latest dental technology"
    ]
  },
  hero: {
    es: {
      subtitle: "En {{clinicName}}",
      welcome: "¡Bienvenido! Su sonrisa es nuestra prioridad. Le ofrecemos atención dental personalizada y de la más alta calidad en un ambiente cálido y profesional, con especialización en prótesis, implantes y ortodoncia.",
      description: "Con una trayectoria dedicada a la excelencia y al bienestar de nuestros pacientes, el {{doctorName}} combina experiencia, tecnología de vanguardia y un trato humano para asegurar los mejores resultados para su salud oral en nuestra clínica ubicada en Plaza Las Ramblas, Santiago de los Caballeros.",
      ctaAppointment: "Agendar Cita",
      ctaServices: "Nuestros Servicios",
      qualificationsTitle: "Calificaciones y Compromiso del {{doctorName}}"
    },
    en: {
      subtitle: "At {{clinicName}}",
      welcome: "Welcome! Your smile is our priority. We offer personalized, high-quality dental care in a warm and professional environment, specializing in prosthetics, implants, and orthodontics.",
      description: "With a track record dedicated to excellence and patient well-being, {{doctorName}} combines experience, cutting-edge technology, and a human touch to ensure the best results for your oral health at our clinic located in Plaza Las Ramblas, Santiago de los Caballeros.",
      ctaAppointment: "Schedule Appointment",
      ctaServices: "Our Services",
      qualificationsTitle: "Qualifications and Commitment of {{doctorName}}"
    }
  },
  visitUs: {
    es: {
      title: "Visítenos en Plaza Las Ramblas",
      description: "Nuestra moderna clínica está convenientemente ubicada en Plaza Las Ramblas, Santiago de los Caballeros, un lugar accesible y agradable.",
      ctaButton: "Ver Ubicación y Contacto"
    },
    en: {
      title: "Visit Us at Plaza Las Ramblas",
      description: "Our modern clinic is conveniently located at Plaza Las Ramblas, Santiago de los Caballeros, an accessible and pleasant place.",
      ctaButton: "View Location and Contact"
    }
  },
  servicesSection: {
    es: {
      title: "Nuestros Servicios Dentales",
      description: "En {{clinicName}}, el {{doctorName}} ofrece una amplia gama de servicios dentales para cubrir todas sus necesidades de salud oral, con especialización en prótesis, implantes y ortodoncia. Utilizamos la última tecnología y técnicas avanzadas."
    },
    en: {
      title: "Our Dental Services",
      description: "At {{clinicName}}, {{doctorName}} offers a wide range of dental services to cover all your oral health needs, specializing in prosthetics, implants, and orthodontics. We use the latest technology and advanced techniques."
    }
  },
  testimonialsSection: {
    es: {
      title: "Lo Que Dicen Nuestros Pacientes",
      description: "Estamos orgullosos de las sonrisas que el {{doctorName}} ha ayudado a transformar en {{clinicName}}. Vea lo que algunos de nuestros pacientes satisfechos tienen que decir.",
      ctaButton: "Dejar un Testimonio",
      dialogTitle: "Comparta su Experiencia",
      dialogDescription: "Su opinión es muy valiosa para nosotros y para futuros pacientes."
    },
    en: {
      title: "What Our Patients Say",
      description: "We are proud of the smiles that {{doctorName}} has helped transform at {{clinicName}}. See what some of our satisfied patients have to say.",
      ctaButton: "Leave a Testimonial",
      dialogTitle: "Share Your Experience",
      dialogDescription: "Your opinion is very valuable to us and to future patients."
    }
  },
  faqSection: {
    es: {
      title: "Preguntas Frecuentes",
      description: "Encuentre respuestas a las preguntas más comunes sobre nuestros servicios y el cuidado dental que ofrecemos en {{clinicName}} con el {{doctorName}}."
    },
    en: {
      title: "Frequently Asked Questions",
      description: "Find answers to the most common questions about our services and the dental care we offer at {{clinicName}} with {{doctorName}}."
    }
  },
  diplomasSection: {
    es: {
      title: "Certificaciones y Diplomas",
      description: "Conozca las credenciales académicas y profesionales del {{doctorName}}, que respaldan su experiencia y compromiso con la excelencia en el cuidado dental en {{clinicName}}."
    },
    en: {
      title: "Certifications and Diplomas",
      description: "Learn about the academic and professional credentials of {{doctorName}}, which support his experience and commitment to excellence in dental care at {{clinicName}}."
    }
  },
  contactSection: {
    es: {
      title: "Contáctanos",
      description: "¿Listo para mejorar tu sonrisa con el {{doctorName}}? Contáctanos hoy en {{clinicName}} para agendar tu cita o para cualquier consulta.",
      formTitle: "Envíanos un Mensaje",
      detailsTitle: "Información de Contacto",
      addressLabel: "Dirección",
      phoneLabel: "Teléfono",
      emailLabel: "Correo Electrónico",
      scheduleLabel: "Horario de Atención",
      mapTitle: "Nuestra Ubicación en Plaza Las Ramblas",
      viewMapButton: "Ver en Google Maps"
    },
    en: {
      title: "Contact Us",
      description: "Ready to improve your smile with {{doctorName}}? Contact us today at {{clinicName}} to schedule your appointment or for any inquiries.",
      formTitle: "Send Us a Message",
      detailsTitle: "Contact Information",
      addressLabel: "Address",
      phoneLabel: "Phone",
      emailLabel: "Email",
      scheduleLabel: "Office Hours",
      mapTitle: "Our Location at Plaza Las Ramblas",
      viewMapButton: "View on Google Maps"
    }
  },
  appointmentPage: {
    es: {
      title: "Agendar Cita",
      description: "Agende su cita con el {{doctorName}} en {{clinicName}}. Complete el formulario para solicitar su cita.",
      cardTitle: "Agendar Cita",
      cardDescription: "Con el {{doctorName}} en {{clinicName}}",
      formIntro: "Complete el siguiente formulario para solicitar una cita. Nos pondremos en contacto con usted a la brevedad para confirmar los detalles y disponibilidad.",
      openingHoursTitle: "Horario de Atención Regular:",
      serviceOptions: {
        generalConsultation: "Consulta General/Revisión"
      }
    },
    en: {
      title: "Schedule Appointment",
      description: "Schedule your appointment with {{doctorName}} at {{clinicName}}. Complete the form to request your appointment.",
      cardTitle: "Schedule Appointment",
      cardDescription: "With {{doctorName}} at {{clinicName}}",
      formIntro: "Complete the following form to request an appointment. We will contact you shortly to confirm the details and availability.",
      openingHoursTitle: "Regular Opening Hours:",
      serviceOptions: {
        generalConsultation: "General Consultation/Check-up"
      }
    }
  },
  footer: {
    es: {
      tagline: "Dirigida por el {{doctorName}}. Cuidando tu sonrisa con pasión y profesionalismo en Santiago de los Caballeros, República Dominicana.",
      quickContact: "Contacto Rápido",
      scheduleTitle: "Horario",
      copyright: "© {{year}} {{clinicName}}. Todos los derechos reservados.",
      doctorAttribution: "Una clínica del {{doctorName}}."
    },
    en: {
      tagline: "Led by {{doctorName}}. Caring for your smile with passion and professionalism in Santiago de los Caballeros, Dominican Republic.",
      quickContact: "Quick Contact",
      scheduleTitle: "Hours",
      copyright: "© {{year}} {{clinicName}}. All rights reserved.",
      doctorAttribution: "A clinic of {{doctorName}}."
    }
  }
};

export const baseMetadata: BaseMetadata = {
  es: {
    titleSuffix: "Cuidado Dental Especializado en Santiago de los Caballeros",
    description: "{{clinicName}}, dirigida por el {{doctorName}} en Santiago de los Caballeros, República Dominicana. Especialistas en prótesis, implantes y ortodoncia. Ofrecemos servicios dentales de alta calidad. Contáctanos para agendar tu cita.",
    keywords: ['dentista', 'clínica dental', 'Santiago de los Caballeros', 'República Dominicana', 'Francis Valerio', 'Orthoprotesis Dental Clinic', 'salud dental', 'odontología', 'prótesis dental', 'implantes dentales', 'ortodoncia', 'agendar cita dental'],
  },
  en: {
    titleSuffix: "Specialized Dental Care in Santiago de los Caballeros",
    description: "{{clinicName}}, led by {{doctorName}} in Santiago de los Caballeros, Dominican Republic. Specialists in prosthetics, implants, and orthodontics. We offer high-quality dental services. Contact us to schedule your appointment.",
    keywords: ['dentist', 'dental clinic', 'Santiago de los Caballeros', 'Dominican Republic', 'Francis Valerio', 'Orthoprotesis Dental Clinic', 'dental health', 'odontology', 'dental prosthetics', 'dental implants', 'orthodontics', 'schedule dental appointment'],
  }
};

export const generalUiStrings: GeneralUIData = {
  es: {
    readMore: "Leer Más",
    readLess: "Leer Menos",
    adminPanelTitle: "Panel de Administración",
    appointmentsTitle: "Gestión de Citas",
    messagesTitle: "Gestión de Mensajes",
    testimonialsTitle: "Gestión de Testimonios",
    settingsTitle: "Configuración",
    logout: "Cerrar Sesión",
    viewSite: "Ver Sitio Público",
    noAppointments: "No hay citas pendientes.",
    home: "Inicio",
    services: "Servicios",
    faq: "Preguntas Frecuentes",
    testimonials: "Testimonios",
    contact: "Contacto",
    appointments: "Agendar Cita",
    /* The header CTA below 640px, where the full label pushed the clinic
       name into an ellipsis ("Ortho…"). Same destination, same meaning,
       one word. */
    appointmentsShort: "Cita",
    appointmentTableHeaders: {
      name: "Nombre",
      email: "Correo",
      phone: "Teléfono",
      service: "Servicio",
      reason: "Motivo",
      urgent: "Urgente",
      submitted: "Enviado",
      status: "Estado",
      actions: "Acciones",
    },
    statusLabels: {
      pending: "Pendiente",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      completed: "Completada",
      unread: "No leído",
      read: "Leído",
      archived: "Archivado",
      pending_approval: "Pendiente",
      approved: "Aprobado",
      rejected: "Rechazado",
    },
     actionButtons: {
      confirm: "Confirmar",
      cancel: "Cancelar Cita",
      complete: "Marcar Completada",
      markRead: "Marcar como Leído",
      archive: "Archivar",
      approve: "Aprobar",
      reject: "Rechazar",
      view: "Ver Detalles",
      delete: "Eliminar",
    },
    boolean: {
      true: "Sí",
      false: "No",
    }
  },
  en: { // Provided for completeness, admin UI is primarily Spanish
    readMore: "Read More",
    readLess: "Read Less",
    adminPanelTitle: "Admin Panel",
    appointmentsTitle: "Appointment Management",
    messagesTitle: "Message Management",
    testimonialsTitle: "Testimonial Management",
    settingsTitle: "Settings",
    logout: "Logout",
    viewSite: "View Public Site",
    noAppointments: "No pending appointments.",
    home: "Home",
    services: "Services",
    faq: "FAQ",
    testimonials: "Testimonials",
    contact: "Contact",
    appointments: "Schedule Appointment",
    appointmentsShort: "Book",
    appointmentTableHeaders: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      service: "Service",
      reason: "Reason",
      urgent: "Urgent",
      submitted: "Submitted",
      status: "Status",
      actions: "Actions",
    },
     statusLabels: {
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      completed: "Completed",
      unread: "Unread",
      read: "Read",
      archived: "Archived",
      pending_approval: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
    actionButtons: {
      confirm: "Confirm",
      cancel: "Cancel Appointment",
      complete: "Mark Completed",
      markRead: "Mark as Read",
      archive: "Archive",
      approve: "Approve",
      reject: "Reject",
      view: "View Details",
      delete: "Delete",
    },
    boolean: {
      true: "Yes",
      false: "No",
    }
  },
};

/**
 * Homepage narrative copy.
 *
 * The homepage is structured as an argument rather than a feature list:
 * claim → proof → problem → mechanism → options → evidence → who → book.
 * These strings back the sections that didn't exist in the old layout.
 *
 * Clinical statements here are limited to well-established, non-promissory
 * facts about tooth loss and osseointegration. Nothing claims an outcome,
 * a success rate, or a timeline for an individual patient.
 */
export const homeContent: Record<
  Language,
  {
    hero: {
      title: string;
      standfirst: string;
      ctaPrimary: string;
      ctaSecondary: string;
      imageAlt: string;
      locationNote: string;
    };
    trust: { value: string; label: string }[];
    problem: {
      title: string;
      description: string;
      points: { title: string; desc: string }[];
    };
    doctor: {
      title: string;
      lead: string;
      body: string[];
      credentialsTitle: string;
      viewDiplomas: string;
    };
    booking: {
      title: string;
      description: string;
      steps: { title: string; desc: string }[];
      ctaPrimary: string;
      ctaCall: string;
      reassurance: string;
    };
    proof: { title: string; description: string };
    servicesLead: string;
  }
> = {
  es: {
    hero: {
      // Noun phrase, so no terminal period — the house rule elsewhere in this
      // layer (`Cuando falta una pieza, cambia todo lo demás.` takes one;
      // `Agende su consulta` does not). The claim is not new: it is
      // `doctor.body[2]` — "el mismo profesional le evalúa, le planifica el
      // tratamiento y se lo realiza, de principio a fin" — promoted to the
      // position where it does the most work. Nothing here is promissory: it
      // describes who staffs the appointment, not what happens to your bone.
      title: 'El mismo dentista, de principio a fin',
      // Sentence one restores the subject matter the headline gives up, and
      // matches the trust strip. Sentence two unpacks the headline in plain
      // terms instead of repeating it. `reconstruyendo dentaduras` was dropped
      // deliberately: in Dominican usage *dentadura* reads first as the
      // appliance, so the old line could be parsed as "rebuilding dentures",
      // which is not what the practice does — and the English said something
      // different again ("rebuilding teeth"). The place is not repeated here;
      // `locationNote` already prints it directly above.
      standfirst:
        'Prótesis, implantes y ortodoncia con el Dr. Francis Valerio. Quien le atiende en la primera visita es quien le hace el tratamiento.',
      ctaPrimary: 'Agendar una cita',
      ctaSecondary: 'Cómo funciona un implante',
      imageAlt:
        'Recepción de la clínica Orthoprotesis en Plaza Las Ramblas, Santiago de los Caballeros',
      locationNote: 'Plaza Las Ramblas, Módulo 101 · Santiago de los Caballeros',
    },
    trust: [
      { value: '30+', label: 'años ejerciendo' },
      { value: '3', label: 'especialidades: prótesis, implantes, ortodoncia' },
      { value: 'AOD', label: 'miembro de la Asociación Odontológica Dominicana' },
    ],
    problem: {
      title: 'Cuando falta una pieza, cambia todo lo demás.',
      description:
        'Masticar siempre del mismo lado. Dejar de pedir ciertos platos. Taparse la boca al reír. Un espacio vacío o una prótesis que ya no ajusta no es solo un asunto estético: el hueso y los dientes vecinos también responden.',
      points: [
        {
          title: 'El hueso pierde volumen',
          desc: 'La raíz de un diente estimula el hueso maxilar cada vez que usted muerde. Sin ella, ese hueso se reabsorbe progresivamente.',
        },
        {
          title: 'Los dientes vecinos se inclinan',
          desc: 'Las piezas contiguas tienden a desplazarse hacia el espacio libre, y la mordida deja de encajar como antes.',
        },
        {
          title: 'La prótesis deja de ajustar',
          desc: 'Como el hueso cambia de forma, una dentadura que encajaba bien hace años empieza a moverse al hablar o comer.',
        },
      ],
    },
    doctor: {
      title: 'Treinta años en la misma consulta.',
      lead: 'Quién le va a atender',
      body: [
        'El Dr. Francis Valerio ejerce en Santiago de los Caballeros desde hace más de tres décadas, con la consulta dedicada a prótesis, implantes y ortodoncia.',
        'Es miembro de la Asociación Odontológica Dominicana y ha seguido formándose de forma continuada a lo largo de toda su carrera: cada diploma de abajo corresponde a un curso o certificación concreta.',
        'En la práctica esto significa que el mismo profesional le evalúa, le planifica el tratamiento y se lo realiza, de principio a fin.',
      ],
      credentialsTitle: 'Formación acreditada',
      viewDiplomas: 'Ver diplomas y certificaciones',
    },
    booking: {
      title: 'Agende su consulta',
      description:
        'La primera visita es una evaluación: revisamos su situación, le explicamos las opciones que existen en su caso y le damos un presupuesto antes de empezar nada.',
      steps: [
        {
          title: 'Usted envía la solicitud',
          desc: 'Rellene el formulario con su nombre, un teléfono y el motivo. No hace falta nada más.',
        },
        {
          title: 'Le llamamos para confirmar',
          desc: 'Nos ponemos en contacto para acordar día y hora según su disponibilidad y la de la consulta.',
        },
        {
          title: 'Evaluación en consulta',
          desc: 'El Dr. Valerio le examina, le explica las alternativas y le entrega el presupuesto por escrito.',
        },
      ],
      ctaPrimary: 'Rellenar el formulario',
      ctaCall: 'Llamar ahora',
      reassurance: 'Solicitar una cita no compromete a nada.',
    },
    proof: {
      title: 'Lo que dicen los pacientes',
      description:
        'Testimonios enviados por pacientes de la consulta. Se publican tras revisarse.',
    },
    servicesLead: 'Además de implantes y prótesis',
  },
  en: {
    hero: {
      // Written, not translated. The old line was ungrammatical: "again"
      // attached to *thinking about it* rather than to *chew*, so it parsed as
      // "stop thinking about it a second time".
      title: 'The same dentist, start to finish',
      standfirst:
        'Prosthetics, implants and orthodontics with Dr. Francis Valerio. The person who sees you at the first visit is the one who does the work.',
      ctaPrimary: 'Book an appointment',
      ctaSecondary: 'How an implant works',
      imageAlt:
        'Reception of the Orthoprotesis clinic at Plaza Las Ramblas, Santiago de los Caballeros',
      locationNote: 'Plaza Las Ramblas, Module 101 · Santiago de los Caballeros',
    },
    trust: [
      { value: '30+', label: 'years in practice' },
      { value: '3', label: 'specialities: prosthetics, implants, orthodontics' },
      { value: 'ADA', label: 'member of the Dominican Dental Association' },
    ],
    problem: {
      title: 'When one tooth goes, everything else shifts.',
      description:
        'Always chewing on the same side. Quietly avoiding certain dishes. Covering your mouth when you laugh. A gap — or a denture that no longer fits — is not only a cosmetic matter: the bone and the neighbouring teeth respond too.',
      points: [
        {
          title: 'The bone loses volume',
          desc: 'A tooth root stimulates the jawbone every time you bite. Without it, that bone gradually resorbs.',
        },
        {
          title: 'Neighbouring teeth tilt',
          desc: 'Adjacent teeth tend to drift into the empty space, and the bite stops meeting the way it used to.',
        },
        {
          title: 'The denture stops fitting',
          desc: 'Because the bone changes shape, a denture that fitted well years ago starts to move when you talk or eat.',
        },
      ],
    },
    doctor: {
      title: 'Thirty years in the same practice.',
      lead: 'Who will see you',
      body: [
        'Dr. Francis Valerio has practised in Santiago de los Caballeros for more than three decades, with the practice dedicated to prosthetics, implants and orthodontics.',
        'He is a member of the Dominican Dental Association and has kept training throughout his career: each diploma below corresponds to a specific course or certification.',
        'In practice this means the same clinician assesses you, plans your treatment and carries it out, from start to finish.',
      ],
      credentialsTitle: 'Accredited training',
      viewDiplomas: 'View diplomas and certifications',
    },
    booking: {
      title: 'Book your consultation',
      description:
        'The first visit is an assessment: we review your situation, explain the options that exist in your case, and give you a quote before anything begins.',
      steps: [
        {
          title: 'You send the request',
          desc: 'Fill in the form with your name, a phone number and the reason. Nothing else is needed.',
        },
        {
          title: 'We call to confirm',
          desc: 'We get in touch to agree a day and time that works for you and for the practice.',
        },
        {
          title: 'Assessment at the practice',
          desc: 'Dr. Valerio examines you, explains the alternatives and hands you a written quote.',
        },
      ],
      ctaPrimary: 'Fill in the form',
      ctaCall: 'Call now',
      reassurance: 'Requesting an appointment commits you to nothing.',
    },
    proof: {
      title: 'What patients say',
      description: 'Testimonials submitted by patients of the practice. Published after review.',
    },
    servicesLead: 'Beyond implants and prosthetics',
  },
};

export const visitUsCarouselImages: CarouselImageItem[] = [
  { src: "/images/vitrine_clinique1.jpg", altEs: "Vitrine de la clínica dental Orthoprotesis en Plaza Las Ramblas, Santiago de los Caballeros", altEn: "Dental clinic Orthoprotesis storefront in Plaza Las Ramblas, Santiago de los Caballeros", hint: "clinic storefront" },
  { src: "/images/vitrine_clinique2.jpg", altEs: "Interior de la clínica dental Orthoprotesis, Santiago de los Caballeros", altEn: "Interior of Orthoprotesis dental clinic, Santiago de los Caballeros", hint: "clinic interior" },
  { src: "/images/vitrine_clinique3.jpg", altEs: "Vista exterior de la clínica dental Orthoprotesis en Plaza Las Ramblas", altEn: "Exterior view of Orthoprotesis dental clinic in Plaza Las Ramblas", hint: "clinic exterior view" },
];

/**
 * Diplomas section — interface copy.
 *
 * Every label the certificate gallery and its lightbox need. The previous
 * version of that section built its two strings inline with a
 * `lang === 'es' ? … : …` ternary inside the component, which is the same
 * problem this file exists to solve, just in a smaller box: the copy could not
 * be read or corrected from here.
 *
 * `{{title}}`, `{{institution}}`, `{{year}}`, `{{index}}` and `{{total}}` are
 * substituted at render time — the same convention as `{{clinicName}}`.
 */
export const diplomasUi: Record<
  Language,
  {
    /** Vertical label in the outer gutter. `{{range}}` = earliest–latest year. */
    rail: string;
    /** Sets expectations: these are phone photographs, not flat scans. */
    photoNote: string;
    empty: string;
    /** Visible hover/tap hint on a certificate. */
    openHint: string;
    /** Accessible name of the trigger button. Must name the specific document. */
    openLabel: string;
    counter: string;
    prev: string;
    next: string;
    close: string;
    fullSize: string;
    keyboardHint: string;
  }
> = {
  es: {
    rail: 'Formación continua · {{range}}',
    photoNote:
      'Fotografías de los documentos originales. Abra cualquiera para leerlo a tamaño completo.',
    empty: 'No hay diplomas registrados.',
    openHint: 'Ampliar',
    openLabel: 'Ampliar el certificado {{title}}, {{institution}}, {{year}}',
    counter: '{{index}} de {{total}}',
    prev: 'Certificado anterior',
    next: 'Certificado siguiente',
    close: 'Cerrar',
    fullSize: 'Abrir la imagen original',
    keyboardHint: 'Use las flechas ← y → para pasar de un certificado a otro.',
  },
  en: {
    rail: 'Continuing education · {{range}}',
    photoNote:
      'Photographs of the original documents. Open any of them to read it at full size.',
    empty: 'No diplomas on record.',
    openHint: 'Enlarge',
    openLabel: 'Enlarge the certificate {{title}}, {{institution}}, {{year}}',
    counter: '{{index}} of {{total}}',
    prev: 'Previous certificate',
    next: 'Next certificate',
    close: 'Close',
    fullSize: 'Open the original image',
    keyboardHint: 'Use the ← and → arrow keys to move between certificates.',
  },
};

export const diplomas: DiplomaData = {
  es: [
    {
      id: 'diploma1',
      title: 'Curso de Implantología Oral',
      institution: 'PUCMM',
      year: '1998',
      image: '/images/diploma1.jpg',
      description: 'Curso de formación en implantología oral.'
    },
    {
      id: 'diploma2',
      title: 'Magíster en Prótesis',
      institution: 'PUCMM',
      year: '2000',
      image: '/images/diploma2.jpg',
      description: 'Maestría en prótesis dentales.'
    },
    {
      id: 'diploma3',
      title: 'Manejo de Implantes y Protocolos de Restauración para Prótesis Unitaria',
      institution: 'Universidad de Antioquia',
      year: '2015',
      image: '/images/diploma3.jpg',
      description: 'Formación sobre la gestión de implantes y los protocolos de restauración para prótesis unitarias.'
    },
    {
      id: 'diploma4',
      title: '2° Encuentro Científico Cultural Dominico-Mexicano: Rehabilitación Oral y Ortodoncia Clínica',
      institution: 'Facultad de Odontología UNAM',
      year: '2000',
      image: '/images/diploma4.jpg',
      description: 'Participación en el 2do encuentro científico y cultural dominico-mexicano sobre la rehabilitación oral y la ortodoncia clínica.'
    },
    {
      id: 'diploma5',
      title: 'Implantología Bucal',
      institution: 'Asociación Odontológica Mexicana para la Enseñanza y la Investigación',
      year: '2014',
      image: '/images/diploma5.jpg',
      description: 'Formación en implantología bucal.'
    },
    {
      id: 'diploma6',
      title: 'Especialista en Implantología Oral',
      institution: 'Universidad Central de Este, San Pedro de Macorís (RD)',
      year: '2021',
      image: '/images/diploma6.jpg',
      description: 'Especialización en implantología oral.'
    },
    {
      id: 'diploma7',
      title: '17° Congresso Brasileiro de Ortodontia',
      institution: 'Sao Paulo',
      year: '2010',
      image: '/images/diploma7.jpg',
      description: 'Certificado de participación en el 17º Congreso Brasileño de Ortodoncia.'
    },
    {
      id: 'diploma8',
      title: '3ª Conferencia Internacional de Implantología Dental',
      institution: 'Cartagena, Colombia',
      year: '2017',
      image: '/images/diploma8.jpg',
      description: 'Certificado de participación en la 3ª Conferencia Internacional de Implantología Dental.'
    },
    {
      id: 'diploma9',
      title: 'Certificado: Instituto Mexicano de Carga Inmediata',
      institution: 'Instituto Mexicano de Carga Inmediata',
      year: '2017',
      image: '/images/diploma9.jpg',
      description: 'Certificado de formación del Instituto Mexicano de Carga Inmediata.'
    }
  ],
  en: [
    {
      id: 'diploma1',
      title: 'Oral Implantology Course',
      institution: 'PUCMM',
      year: '1998',
      image: '/images/diploma1.jpg',
      description: 'Training course in oral implantology.'
    },
    {
      id: 'diploma2',
      title: 'Master in Prosthetics',
      institution: 'PUCMM',
      year: '2000',
      image: '/images/diploma2.jpg',
      description: 'Master\'s degree in dental prosthetics.'
    },
    {
      id: 'diploma3',
      title: 'Implant Management and Restoration Protocols for Unitary Prosthetics',
      institution: 'University of Antioquia',
      year: '2015',
      image: '/images/diploma3.jpg',
      description: 'Training on implant management and restoration protocols for single prosthetics.'
    },
    {
      id: 'diploma4',
      title: '2nd Dominican-Mexican Scientific and Cultural Meeting: Oral Rehabilitation and Clinical Orthodontics',
      institution: 'UNAM Faculty of Dentistry',
      year: '2000',
      image: '/images/diploma4.jpg',
      description: 'Participation in the 2nd Dominican-Mexican scientific and cultural meeting on oral rehabilitation and clinical orthodontics.'
    },
    {
      id: 'diploma5',
      title: 'Oral Implantology',
      institution: 'Mexican Dental Association for Teaching and Research',
      year: '2014',
      image: '/images/diploma5.jpg',
      description: 'Training in oral implantology.'
    },
    {
      id: 'diploma6',
      title: 'Specialist in Oral Implantology',
      institution: 'Universidad Central de Este, San Pedro de Macorís (DR)',
      year: '2021',
      image: '/images/diploma6.jpg',
      description: 'Specialization in oral implantology.'
    },
    {
      id: 'diploma7',
      title: '17th Brazilian Orthodontics Congress',
      institution: 'Sao Paulo',
      year: '2010',
      image: '/images/diploma7.jpg',
      description: 'Certificate of participation in the 17th Brazilian Orthodontics Congress.'
    },
    {
      id: 'diploma8',
      title: '3rd International Dental Implantology Conference',
      institution: 'Cartagena, Colombia',
      year: '2017',
      image: '/images/diploma8.jpg',
      description: 'Certificate of participation in the 3rd International Dental Implantology Conference.'
    },
    {
      id: 'diploma9',
      title: 'Certificate: Mexican Institute of Immediate Loading',
      institution: 'Mexican Institute of Immediate Loading',
      year: '2017',
      image: '/images/diploma9.jpg',
      description: 'Certificate of training from the Mexican Institute of Immediate Loading.'
    }
  ]
};

/* ============================================================================
   IMPLANT CLUSTER — the pillar page and its five spokes.
   ----------------------------------------------------------------------------
   Implants in Santiago de los Caballeros are the practice's whole commercial
   priority, and until this existed the entire offering was ~300 Spanish words
   behind a `#implantes` fragment on the homepage — one indexable document
   competing for a query that wants a reference page. The metadata already
   targeted All-on-4, carga inmediata, injerto óseo and turismo dental; there
   was no copy behind any of the four.

   THE RULES THIS COPY IS WRITTEN UNDER, because they are not negotiable on a
   health site and the next person editing it needs to know them:

     - No guarantee, no success rate, no invented statistic, no price. Where a
       real number is unknown, the copy names the RANGE that the literature and
       ordinary practice use, or names the factors that decide it, and says
       plainly that the answer comes from an individual assessment.
     - Risks are stated, not softened. A surgical page with no complication
       list reads as a sales page to a patient and as a quality signal failure
       to a reviewer.
     - No credential the clinic does not hold. Everything asserted about Dr.
       Valerio is backed by `diplomas` and `contactDetails.qualifications`.
     - Formal register throughout the Spanish ("usted"), matching the rest of
       the site.

   Route shape: /{lang}/implantes-dentales for the pillar, with each spoke
   nested beneath it, so the URL itself carries the topical relationship.
   ========================================================================== */

/** URL segment the whole cluster lives under, in both languages. */
export const IMPLANT_CLUSTER_SEGMENT = 'implantes-dentales';

/**
 * Spoke slugs. Spanish in both locales, deliberately: the Spanish query volume
 * is the reason this cluster exists, and a per-language URL would split the
 * hreflang cluster across two paths for no gain — the `/en` prefix already
 * distinguishes them.
 */
export const IMPLANT_SPOKE_SLUGS = [
  'all-on-4',
  'carga-inmediata',
  'injerto-oseo',
  'precio',
  'turismo-dental-santiago',
] as const;

export type ImplantSpokeSlug = (typeof IMPLANT_SPOKE_SLUGS)[number];

/** One band of a cluster page. Every field beyond `body` is optional so a
 *  section can be prose, a ruled definition list, an ordered sequence, or any
 *  combination — the page shape follows the argument, not a template. */
export interface ImplantSection {
  /** Anchor id. Also the target of the page's contents list. */
  id: string;
  heading: string;
  body: string[];
  /** Ruled term/detail rows. Facts that stand side by side. */
  points?: { term: string; detail: string }[];
  /** Ordered sequence. Rendered numbered, because the order is the content. */
  steps?: { title: string; desc: string }[];
  /** A set-apart caveat, after the section. Where the honest answer is
   *  "it depends", or where the reader needs a warning sign named. */
  note?: string;
}

export interface ImplantPageContent {
  /** <title>. Kept under 60 characters — the site name is NOT appended by the
   *  page, because "… | Orthoprotesis Dental Clinic" alone spends 32 of them. */
  metaTitle: string;
  /** <meta name="description">. Under 155 characters. */
  metaDescription: string;
  /** Breadcrumb crumb and cross-link label. Two or three words. */
  shortLabel: string;
  /** One line, for the card that links here from a sibling page. */
  cardSummary: string;
  h1: string;
  standfirst: string;
  /** Names the schema.org MedicalProcedure this page is `about`. */
  procedureName: string;
  sections: ImplantSection[];
  faq: { question: string; answer: string }[];
  keywords: string[];
}

export interface ImplantSpokeContent extends ImplantPageContent {
  slug: ImplantSpokeSlug;
}

export interface ImplantClusterContent {
  ui: {
    /** Accessible name of the breadcrumb nav. */
    breadcrumbLabel: string;
    home: string;
    /** Heading above the in-page contents list. */
    contentsTitle: string;
    faqTitle: string;
    relatedTitle: string;
    relatedLead: string;
    backToPillar: string;
    ctaTitle: string;
    ctaBody: string;
    ctaPrimary: string;
    ctaCall: string;
    /** Sits under the CTA. Must stay non-promissory. */
    ctaReassurance: string;
    /** Prefix for the set-apart caveat blocks. */
    noteLabel: string;
    /** Standing disclaimer at the foot of every clinical page. */
    medicalDisclaimer: string;
    revisedLabel: string;
  };
  pillar: ImplantPageContent;
  spokes: ImplantSpokeContent[];
}

/**
 * Date the clinical copy below was last edited, ISO-8601.
 *
 * Emitted as schema.org `dateModified` — a statement about the DOCUMENT, which
 * is verifiable. Deliberately NOT `lastReviewed` / `reviewedBy`: those assert
 * that a named clinician checked the page for accuracy, and until Dr. Valerio
 * actually signs the copy off that would be a fabricated credential on a
 * medical page. When he does, add both here and in `seo-config.ts`.
 *
 * Bump this whenever the clinical copy changes.
 */
export const IMPLANT_CONTENT_REVISED = '2026-08-30';

/** Site-relative path to the pillar, or to one of its spokes. */
export function implantClusterPath(lang: Language, spoke?: ImplantSpokeSlug): string {
  const base = `/${lang}/${IMPLANT_CLUSTER_SEGMENT}`;
  return spoke ? `${base}/${spoke}` : base;
}

export const implantCluster: Record<Language, ImplantClusterContent> = {
  es: {
    ui: {
      breadcrumbLabel: 'Ruta de navegación',
      home: 'Inicio',
      contentsTitle: 'En esta página',
      faqTitle: 'Preguntas frecuentes',
      relatedTitle: 'Seguir leyendo',
      relatedLead: 'Cada uno de estos temas tiene su propia página, con el detalle que aquí solo se resume.',
      backToPillar: 'Volver a la guía de implantes dentales',
      ctaTitle: 'Lo siguiente es una evaluación, no un tratamiento',
      ctaBody:
        'Nada de lo que ha leído aquí sustituye a una exploración y una radiografía. En la primera visita el Dr. Valerio revisa su caso, le explica las opciones que existen realmente en su situación y le entrega un presupuesto por escrito antes de empezar nada.',
      ctaPrimary: 'Solicitar una cita',
      ctaCall: 'Llamar a la consulta',
      ctaReassurance: 'Solicitar una cita no compromete a nada.',
      noteLabel: 'Conviene saberlo',
      medicalDisclaimer:
        'Esta página es información general para pacientes, escrita para que llegue usted a la consulta sabiendo qué preguntar. No es un diagnóstico ni una indicación de tratamiento: eso solo puede darse tras una exploración clínica y las pruebas de imagen correspondientes.',
      revisedLabel: 'Última actualización',
    },
    pillar: {
      metaTitle: 'Implantes Dentales en Santiago de los Caballeros',
      metaDescription:
        'Guía de implantes dentales en Santiago, RD: candidatura, cirugía, osteointegración, materiales, qué determina el precio, recuperación y riesgos reales.',
      shortLabel: 'Implantes dentales',
      cardSummary:
        'La guía completa: qué es un implante, quién es candidato, cuánto tarda y qué puede salir mal.',
      h1: 'Implantes dentales en Santiago de los Caballeros',
      standfirst:
        'Un implante sustituye la raíz de un diente que ya no está. Esta página explica, sin adornos, quién es candidato, qué ocurre en cada cita, cuánto tarda el hueso en integrarlo, de qué depende el presupuesto y qué puede salir mal.',
      procedureName: 'Implante dental',
      keywords: [
        'implantes dentales Santiago',
        'implantes dentales Santiago de los Caballeros',
        'implantes dentales República Dominicana',
        'osteointegración implante dental',
        'cirugía de implante dental',
        'candidato a implante dental',
        'riesgos de los implantes dentales',
        'periimplantitis',
      ],
      sections: [
        {
          id: 'que-es',
          heading: 'Qué es un implante dental, y qué no es',
          body: [
            'Un implante dental es un tornillo de titanio que se coloca dentro del hueso maxilar y ocupa el lugar que dejó la raíz del diente perdido. Sobre él se asienta un pilar, y sobre el pilar una corona. Son tres piezas distintas, fabricadas y colocadas en momentos distintos: cuando alguien dice «me pusieron un implante en una hora», casi siempre se refiere solo a la primera.',
            'Lo que un implante no es: no es un diente. No tiene ligamento periodontal, la fina membrana que amortigua un diente natural y que informa al cerebro de cuánta fuerza está aplicando. Un implante está anclado directamente en el hueso, es rígido y no avisa cuando se le sobrecarga. Esa diferencia explica buena parte de las precauciones que aparecen más abajo.',
            'Tampoco es un tratamiento eterno por defecto. Un implante bien colocado y bien mantenido puede acompañarle durante décadas; uno colocado sobre una encía inflamada, en un fumador activo o sin revisiones posteriores, puede perderse en pocos años. La diferencia no está en la marca del tornillo.',
          ],
          points: [
            {
              term: 'El implante',
              detail:
                'El cuerpo de titanio que va dentro del hueso. Es la única parte que llega a integrarse con él.',
            },
            {
              term: 'El pilar',
              detail:
                'La pieza intermedia, unida al implante, que atraviesa la encía y sostiene la corona.',
            },
            {
              term: 'La corona',
              detail:
                'La parte visible, en cerámica, hecha a medida sobre un molde o un escaneado de su boca.',
            },
          ],
        },
        {
          id: 'candidatura',
          heading: '¿Es usted candidato a un implante?',
          body: [
            'La respuesta honesta es que no se sabe hasta que se ve. La candidatura se decide con una exploración clínica y una radiografía —panorámica o, cuando el caso lo pide, una tomografía computarizada de haz cónico, que mide el hueso en tres dimensiones—. Sin esa imagen nadie puede decirle si hay hueso suficiente ni por dónde discurre el nervio dentario.',
            'Dicho esto, hay factores que se conocen de antemano y que conviene poner sobre la mesa en la primera visita, porque cambian el plan o cambian el pronóstico:',
          ],
          points: [
            {
              term: 'Encías sanas',
              detail:
                'La enfermedad periodontal activa es la causa evitable más frecuente de fracaso. Se trata antes de colocar nada, no después.',
            },
            {
              term: 'Volumen y densidad de hueso',
              detail:
                'Si la altura o el grosor no alcanzan, existen técnicas de regeneración: injerto óseo, elevación de seno. Alargan el calendario; rara vez cierran la puerta.',
            },
            {
              term: 'Tabaco',
              detail:
                'Fumar reduce la irrigación de la encía y se asocia a más fracasos y más periimplantitis. No es una contraindicación absoluta, pero cambia el pronóstico y usted merece saberlo antes de decidir.',
            },
            {
              term: 'Enfermedades sistémicas',
              detail:
                'Una diabetes bien controlada no impide un implante; una descompensada retrasa la cicatrización. Lo mismo vale para el tratamiento con bifosfonatos u otros antirresortivos, la radioterapia de cabeza y cuello o la inmunosupresión: hay que hablarlo con detalle y a veces coordinarlo con su médico.',
            },
            {
              term: 'Bruxismo',
              detail:
                'Apretar o rechinar los dientes carga el implante con fuerzas para las que no tiene amortiguación. No lo descarta, pero suele obligar a una férula de descarga y a revisar la mordida.',
            },
            {
              term: 'Crecimiento no terminado',
              detail:
                'En adolescentes se espera a que el crecimiento facial haya concluido. Un implante queda fijo mientras los dientes vecinos siguen desplazándose, y el desnivel se hace visible con los años.',
            },
          ],
          note: 'Ningún cuestionario en línea, y ninguna página web, sustituye esa evaluación. Si alguien le confirma que es candidato sin haberle mirado la boca y sin una radiografía, desconfíe.',
        },
        {
          id: 'secuencia',
          heading: 'La secuencia del tratamiento, paso a paso',
          body: [
            'Un implante unitario sin complicaciones suele repartirse en cinco o seis citas a lo largo de varios meses. La mayor parte de ese tiempo no es tratamiento: es espera biológica, y no se puede comprimir por conveniencia.',
          ],
          steps: [
            {
              title: 'Evaluación y planificación',
              desc: 'Exploración, radiografía y, si el caso lo requiere, tomografía. Se decide la posición, el diámetro y la longitud del implante, y se le entrega un presupuesto por escrito antes de empezar.',
            },
            {
              title: 'Preparación previa',
              desc: 'Si hay caries, infección o enfermedad de las encías, se resuelven primero. Si falta hueso, es aquí donde se hace el injerto, y el calendario se alarga en consecuencia.',
            },
            {
              title: 'Cirugía de colocación',
              desc: 'Con anestesia local. Se accede al hueso, se prepara el lecho con fresas a baja velocidad e irrigación abundante para no calentarlo, y se coloca el implante. Una pieza suele llevar entre treinta y sesenta minutos, y usted vuelve a casa el mismo día.',
            },
            {
              title: 'Osteointegración',
              desc: 'El periodo en que el hueso se une a la superficie del implante. Aquí no se hace nada: se espera y se controla.',
            },
            {
              title: 'Segunda fase y toma de medidas',
              desc: 'Se descubre el implante si quedó sumergido y se coloca un pilar de cicatrización que da forma a la encía. Unas semanas después se toma la impresión o el escaneado que va al laboratorio.',
            },
            {
              title: 'Colocación de la corona',
              desc: 'Se prueba, se ajusta la mordida milímetro a milímetro y se fija la corona definitiva. A partir de ahí el tratamiento pasa a ser mantenimiento.',
            },
          ],
        },
        {
          id: 'osteointegracion',
          heading: 'La osteointegración y los plazos reales',
          body: [
            'La osteointegración es el fenómeno por el que el hueso crece en contacto directo con la superficie de titanio, sin tejido fibroso entre medias. Es lo que convierte un tornillo en un anclaje. No es un pegado ni un endurecimiento: es hueso vivo remodelándose contra el metal.',
            'Ese proceso tiene un ritmo biológico propio. Los plazos que se manejan habitualmente son de unos tres meses en la mandíbula, donde el hueso es más denso, y de cuatro a seis meses en el maxilar superior, que es más esponjoso. Si hubo injerto, hay que sumar el tiempo de consolidación del injerto antes incluso de colocar el implante.',
            'Su caso puede quedar dentro o fuera de esos márgenes. La densidad de su hueso, la estabilidad que se consiga en el momento mismo de la cirugía y su propia cicatrización mandan sobre cualquier calendario impreso. Por eso el plazo definitivo se le confirma después de la cirugía, no antes.',
            'Existe la carga inmediata, en la que se coloca una prótesis provisional el mismo día. No acorta la osteointegración: permite que ocurra bajo una prótesis diseñada para no recibir fuerza de masticación. Tiene requisitos propios y se explica en su propia página.',
          ],
        },
        {
          id: 'materiales',
          heading: 'Materiales: titanio, cerámica y la corona',
          body: [
            'El cuerpo del implante es de titanio de grado médico, o de una aleación de titanio y circonio. El titanio se emplea desde hace más de medio siglo en cirugía ortopédica y dental porque el organismo lo tolera bien y el hueso se adhiere a su superficie. También existen implantes cerámicos de zirconio, sin metal, indicados sobre todo por motivos estéticos en encías finas o en personas con sensibilidad documentada a metales.',
            'La corona es una pieza distinta, y ahí hay más de una opción razonable. El zirconio monolítico es muy resistente y encaja bien en los sectores posteriores, donde la fuerza de masticación es mayor. El disilicato de litio es más translúcido y suele preferirse en el sector anterior, donde lo que se juzga es el aspecto. La metal-cerámica sigue siendo una solución válida y muy probada.',
            'Ningún material rinde bien fuera de su indicación. Una cerámica muy estética en una zona de mucha carga se fractura; una muy opaca en un incisivo visible se nota. Esa decisión se toma pieza por pieza, mirando dónde va, cuánta fuerza recibe y de qué color son los dientes de al lado.',
          ],
        },
        {
          id: 'precio',
          heading: 'Qué determina el precio de un implante',
          body: [
            'En esta página no encontrará una cifra, y hay una razón. Un presupuesto de implantes no es un precio de catálogo: dos personas que dicen «necesito un implante» pueden recibir presupuestos que se diferencian en un factor de tres, porque lo que se factura no es el tornillo.',
          ],
          points: [
            {
              term: 'Cuántas piezas, y de qué tipo',
              detail:
                'Un implante unitario, tres implantes separados y una arcada completa sobre cuatro o seis implantes son tratamientos distintos, no múltiplos del mismo.',
            },
            {
              term: 'Si hay que preparar el terreno',
              detail:
                'Extracciones, tratamiento periodontal, injerto óseo o elevación de seno son procedimientos con coste propio y con calendario propio.',
            },
            {
              term: 'El tipo de prótesis',
              detail:
                'Material de la corona, si va atornillada o cementada, si hace falta una pieza provisional y durante cuánto tiempo.',
            },
            {
              term: 'Las pruebas de imagen',
              detail:
                'Una tomografía tridimensional no es necesaria en todos los casos. Cuando lo es, forma parte del presupuesto y conviene que aparezca desglosada.',
            },
            {
              term: 'El número de citas',
              detail:
                'Cada control, ajuste y revisión ocupa tiempo de consulta. A veces va incluido y a veces no; preguntarlo es legítimo.',
            },
          ],
          note: 'El presupuesto se entrega por escrito después de la evaluación, con los conceptos desglosados. Si algo cambia durante el tratamiento —y a veces cambia—, se le comunica antes de hacerlo, no en la factura.',
        },
        {
          id: 'recuperacion',
          heading: 'La recuperación, día a día',
          body: [
            'La cirugía de un implante unitario resulta menos molesta de lo que la mayoría espera; suele compararse favorablemente con una extracción difícil. Dicho eso, hay una recuperación real y conviene planificarla, sobre todo si tiene compromisos en los días siguientes.',
          ],
          steps: [
            {
              title: 'Las primeras veinticuatro horas',
              desc: 'Inflamación y un sangrado leve son esperables. Frío intermitente sobre la mejilla, la medicación pautada, nada de enjuagues enérgicos y nada de escupir. Dieta blanda, fría o templada.',
            },
            {
              title: 'Del segundo al quinto día',
              desc: 'La inflamación alcanza su punto máximo entre las cuarenta y ocho y las setenta y dos horas, y después cede. Puede aparecer un hematoma en la piel. Higiene suave alrededor de la herida, sin pasar el cepillo por la sutura.',
            },
            {
              title: 'Primera y segunda semana',
              desc: 'Retirada de puntos, cuando los hay, entre los siete y los catorce días. La mayoría de las personas retoma su actividad habitual en dos o tres días, y el deporte de intensidad en torno a la semana.',
            },
            {
              title: 'Hasta la corona definitiva',
              desc: 'Con el implante integrándose se mastica del otro lado y se acude a los controles. Si lleva una pieza provisional, no la use para morder alimentos duros.',
            },
          ],
          note: 'Llame a la consulta si el dolor aumenta a partir del tercer día en lugar de disminuir, si aparece fiebre, si la inflamación crece de forma marcada o si nota móvil la pieza provisional. Esos son los signos que sí requieren una revisión inmediata.',
        },
        {
          id: 'riesgos',
          heading: 'Riesgos y complicaciones',
          body: [
            'Los implantes dentales son un tratamiento previsible y ampliamente documentado, pero no son un tratamiento sin riesgo. Cualquier consulta que le presente un procedimiento quirúrgico sin una lista de complicaciones le está ocultando información que usted necesita para decidir.',
          ],
          points: [
            {
              term: 'Fracaso de la integración',
              detail:
                'El implante no llega a unirse al hueso y queda móvil. Suele manifestarse en los primeros meses. Se retira, se deja cicatrizar la zona y en muchos casos puede volver a intentarse más adelante.',
            },
            {
              term: 'Periimplantitis',
              detail:
                'Inflamación crónica del tejido alrededor de un implante ya integrado, con pérdida progresiva del hueso que lo sujeta. Es la complicación tardía más frecuente y la más ligada a la higiene, al tabaco y a saltarse las revisiones.',
            },
            {
              term: 'Lesión nerviosa',
              detail:
                'En la mandíbula, el nervio dentario inferior discurre cerca. Una lesión puede dar adormecimiento del labio o del mentón, habitualmente transitorio y rara vez permanente. Es la razón por la que se planifica con imagen y se respetan márgenes de seguridad.',
            },
            {
              term: 'Comunicación con el seno maxilar',
              detail:
                'En el maxilar superior posterior el seno queda justo por encima. Cuando el hueso es escaso se eleva la membrana de forma controlada; una perforación no advertida puede derivar en sinusitis.',
            },
            {
              term: 'Complicaciones mecánicas',
              detail:
                'Aflojamiento o fractura del tornillo, descementado de la corona, fractura de la cerámica. Suelen ser reparables, y son más frecuentes en quienes aprietan los dientes.',
            },
            {
              term: 'Resultado estético insuficiente',
              detail:
                'Recesión de la encía, un margen grisáceo visible o una papila que no rellena el espacio entre dientes. Más probable en el sector anterior y en encías finas, y por eso allí se planifica con más cautela.',
            },
          ],
          note: 'Casi todas estas complicaciones tienen buena solución cuando se detectan pronto, y esa detección depende de que usted acuda a las revisiones. La complicación con peor pronóstico es siempre la que llega tarde.',
        },
        {
          id: 'mantenimiento',
          heading: 'Cómo se cuida un implante a largo plazo',
          body: [
            'Un implante no se caria. El hueso que lo sujeta sí se puede perder, y en eso consiste todo el mantenimiento. Son tres cosas, y ninguna es opcional.',
          ],
          points: [
            {
              term: 'Higiene diaria específica',
              detail:
                'Cepillado dos veces al día, más limpieza entre las piezas con cepillo interproximal del tamaño correcto o con irrigador. La seda dental convencional no siempre es la herramienta adecuada alrededor de un implante.',
            },
            {
              term: 'Revisiones periódicas',
              detail:
                'Control clínico y radiográfico. La pérdida ósea inicial no duele y no se ve: solo se mide, y se corrige mucho mejor al principio.',
            },
            {
              term: 'Controlar lo que lo carga',
              detail:
                'Férula de descarga si aprieta por la noche, ajuste de la mordida cuando hace falta, y dejar el tabaco si está en su mano.',
            },
          ],
        },
        {
          id: 'alternativas',
          heading: 'Cuándo un implante no es la mejor opción',
          body: [
            'Recomendar un implante a todo el mundo sería cómodo y sería falso. Hay situaciones en las que otra solución sirve mejor: un puente fijo cuando los dientes vecinos ya están tallados o van a necesitar corona de todos modos; una prótesis removible bien hecha cuando el estado del hueso, la salud general o el presupuesto no acompañan; o sencillamente mantener y vigilar, cuando la pieza ausente es un cordal y no compromete ni la función ni el aspecto.',
            'Y hay casos en los que el implante es claramente la mejor opción, lo que merece decirse con la misma franqueza: cuando los dientes vecinos están sanos y tallarlos para un puente supondría destruir tejido sano, o cuando una prótesis inferior completa no se sostiene y dos implantes la estabilizan por completo.',
            'Lo que debería salir de la primera visita no es un «sí» a un tratamiento, sino una comparación de las opciones reales en su caso, con lo que cada una cuesta, cuánto dura y qué le va a exigir a usted.',
          ],
        },
      ],
      faq: [
        {
          question: '¿Duele colocar un implante?',
          answer:
            'La cirugía se realiza con anestesia local y no debería doler mientras se hace. Las molestias posteriores son las de una intervención menor: inflamación y dolor controlable con la medicación pautada, con el punto máximo entre las cuarenta y ocho y las setenta y dos horas. La mayoría de los pacientes lo describe como más llevadero que una extracción complicada.',
        },
        {
          question: '¿Cuánto tiempo dura todo el tratamiento?',
          answer:
            'Desde la primera visita hasta la corona definitiva, lo habitual es de tres a seis meses cuando no hace falta injerto, y de seis a doce meses cuando sí. El plazo concreto depende de la densidad de su hueso y de su cicatrización, y por eso se confirma después de la cirugía y no antes.',
        },
        {
          question: '¿Se me va a notar?',
          answer:
            'Una corona bien hecha sobre un implante resulta difícil de distinguir de un diente natural en el uso diario. Lo delicado no suele ser la corona, sino la encía que la rodea, sobre todo en el sector anterior y en encías finas. Ese punto se valora antes de operar, porque condiciona la posición del implante.',
        },
        {
          question: '¿Cuánto dura un implante?',
          answer:
            'No existe una fecha de caducidad ni una cifra que sirva para todo el mundo. Hay implantes en función después de veinte o treinta años, y otros que se pierden en el primer año. Lo que más pesa no es el material, sino la salud de la encía, la higiene diaria, el tabaco y acudir a las revisiones.',
        },
        {
          question: '¿Me quedo sin diente durante la espera?',
          answer:
            'En la mayoría de los casos no. Según la zona y la estabilidad conseguida se coloca una corona provisional, un puente provisional o una prótesis removible provisional. En algún caso concreto puede convenir no cargar nada durante unas semanas; cuando ocurre, se le explica por qué.',
        },
        {
          question: '¿Puedo ponerme implantes si llevo años con dentadura completa?',
          answer:
            'A menudo sí, pero es exactamente el caso en el que hay que medir el hueso antes de prometer nada: años sin raíces implican reabsorción. Puede que quede volumen suficiente, puede que haga falta injerto, y puede que la mejor solución sea una sobredentadura sujeta por dos o cuatro implantes en lugar de una prótesis fija.',
        },
      ],
    },
    spokes: [
      {
        slug: 'all-on-4',
        metaTitle: 'All-on-4 en Santiago: arcada completa fija',
        metaDescription:
          'Qué es el All-on-4, para quién está indicado, qué exige del hueso, cómo son la prótesis provisional y la definitiva, y cuáles son sus límites reales.',
        shortLabel: 'All-on-4',
        cardSummary:
          'Una arcada entera sobre cuatro implantes: indicaciones, requisitos y límites.',
        h1: 'All-on-4: una arcada completa sobre cuatro implantes',
        standfirst:
          'Rehabilitar toda una arcada apoyándola en cuatro implantes es una técnica establecida y bien documentada. También tiene requisitos concretos y desventajas que casi nunca se cuentan. Aquí están las dos partes.',
        procedureName: 'Rehabilitación de arcada completa sobre cuatro implantes (All-on-4)',
        keywords: [
          'All-on-4 Santiago',
          'all on 4 implantes República Dominicana',
          'arcada completa sobre implantes',
          'prótesis fija sobre implantes',
          'All-on-6',
        ],
        sections: [
          {
            id: 'en-que-consiste',
            heading: 'En qué consiste',
            body: [
              'El concepto All-on-4 rehabilita una arcada entera —toda la superior o toda la inferior— apoyándola sobre cuatro implantes en lugar de sobre seis, ocho o diez. Dos se colocan rectos en la zona anterior y dos se inclinan hacia atrás, aprovechando el hueso que suele conservarse por delante del seno maxilar arriba y por delante del nervio dentario abajo.',
              'Esa inclinación es la idea central. Al angular los implantes posteriores se consigue apoyar la prótesis más atrás sin invadir esas estructuras y, en bastantes casos, sin necesidad de injertar hueso donde ya no queda. Ese es el motivo por el que la técnica existe: no ahorrar implantes, sino evitar un injerto extenso.',
              'El resultado es una prótesis fija completa, atornillada sobre los implantes, que usted no se quita. No es una dentadura que se pega ni un aparato que se retira por la noche para limpiarlo.',
            ],
          },
          {
            id: 'para-quien',
            heading: 'Para quién está indicado',
            body: [
              'Es una solución pensada para arcadas completas, no para huecos sueltos. Los perfiles habituales son estos:',
            ],
            points: [
              {
                term: 'Ausencia total de dientes en una arcada',
                detail:
                  'Especialmente en la mandíbula, donde una dentadura completa convencional se mueve al hablar y al comer por falta de retención.',
              },
              {
                term: 'Dientes irrecuperables',
                detail:
                  'Cuando lo que queda tiene movilidad avanzada o pérdida ósea generalizada y mantenerlo solo aplaza el problema.',
              },
              {
                term: 'Reabsorción posterior',
                detail:
                  'Cuando el hueso de la zona de los molares ya no da altura, pero el de la zona anterior sí. Es exactamente el escenario para el que se diseñó la técnica.',
              },
              {
                term: 'Quien prefiere no pasar por un injerto extenso',
                detail:
                  'Evitarlo acorta el calendario y reduce el número de cirugías, y para muchos pacientes eso pesa tanto como el resultado final.',
              },
            ],
            note: 'No es una técnica universal. Si conserva dientes sanos en esa arcada, extraerlos para colocar una prótesis completa es una decisión seria y hay que justificarla con algo más que comodidad de planificación.',
          },
          {
            id: 'requisitos',
            heading: 'Qué exige del hueso y de la mordida',
            body: [
              'Con cuatro implantes sosteniendo doce o catorce dientes, cada implante trabaja más que en una rehabilitación con seis o más. Eso significa que la planificación tiene menos margen de error, no más.',
              'Hace falta suficiente hueso en la zona anterior para alojar los cuatro implantes con buena estabilidad inicial, y hace falta que esa estabilidad se mida en el momento de la cirugía, no que se dé por supuesta. También hace falta estudiar la mordida: si la arcada opuesta son dientes naturales sanos, las fuerzas son mayores que si es otra prótesis.',
              'La tomografía tridimensional aquí no es opcional. Angular un implante hacia atrás exige saber con precisión dónde está el seno o el nervio, y eso no se ve en una radiografía plana.',
            ],
          },
          {
            id: 'provisional-y-definitiva',
            heading: 'La prótesis provisional y la definitiva',
            body: [
              'La imagen que circula del All-on-4 —salir de la consulta con los dientes puestos— corresponde a la prótesis provisional, no a la definitiva. Cuando las condiciones lo permiten se coloca en las horas siguientes a la cirugía una prótesis fija provisional, más ligera y con la oclusión ajustada para no cargar los implantes mientras se integran.',
              'La definitiva llega meses después, cuando la integración está confirmada y la encía ha terminado de estabilizarse. Se fabrica con otros materiales y sobre otras medidas, porque el contorno de la encía cambia durante la cicatrización y una prótesis hecha el primer día ya no ajustaría igual.',
              'Que existan dos prótesis no es un sobrecoste inesperado: es parte del tratamiento y debe aparecer en el presupuesto desde el principio.',
            ],
          },
          {
            id: 'limites',
            heading: 'Sus límites, dicho claramente',
            body: [
              'Ninguna de estas cosas descalifica la técnica. Todas deberían decírsele antes de decidir.',
            ],
            points: [
              {
                term: 'Poca redundancia',
                detail:
                  'Con cuatro implantes, la pérdida de uno compromete toda la estructura. Con seis, a veces el puente se puede rescatar. Es la razón por la que existe el All-on-6 y por la que a veces se recomienda.',
              },
              {
                term: 'La higiene cambia',
                detail:
                  'Debajo de una prótesis fija completa hay un espacio que hay que limpiar a diario con irrigador y cepillos específicos. Quien no lo haga tendrá inflamación, y después pérdida de hueso.',
              },
              {
                term: 'Mantenimiento de la prótesis',
                detail:
                  'Los tornillos se revisan, la resina se desgasta y en algún momento la prótesis necesita reparación o sustitución. Es una estructura mecánica sometida a carga, no una pieza permanente.',
              },
              {
                term: 'Adaptación del habla',
                detail:
                  'El volumen y el contorno cambian respecto a los dientes propios o a una dentadura anterior. La mayoría se adapta en días o semanas; conviene saber que ese periodo existe.',
              },
              {
                term: 'No revierte fácilmente',
                detail:
                  'Si se extraen dientes para colocarla, la decisión no tiene marcha atrás. Merece una segunda opinión si tiene la menor duda.',
              },
            ],
          },
        ],
        faq: [
          {
            question: '¿Salgo con los dientes puestos el mismo día?',
            answer:
              'A menudo sí, pero solo cuando la estabilidad conseguida en la cirugía lo permite, y siempre con una prótesis provisional. Si en el quirófano los implantes no alcanzan el anclaje necesario, cargarlos ese día perjudicaría el resultado, y la decisión correcta es esperar. Por eso no se puede prometer de antemano.',
          },
          {
            question: '¿Es mejor All-on-4 o All-on-6?',
            answer:
              'Depende del hueso disponible, de la fuerza de su mordida y de la arcada de que se trate. Más implantes reparten mejor la carga y dan margen si uno falla; menos implantes evitan zonas donde no hay hueso y reducen el coste y la cirugía. Es una decisión que se toma con la tomografía delante, no por preferencia.',
          },
          {
            question: '¿Puedo quitármela para limpiarla?',
            answer:
              'No. La prótesis va atornillada y solo la retira el odontólogo, normalmente en las revisiones de mantenimiento. La limpieza diaria se hace con la prótesis puesta, y por eso la técnica de higiene se enseña antes de terminar el tratamiento.',
          },
        ],
      },
      {
        slug: 'carga-inmediata',
        metaTitle: 'Carga Inmediata: Dientes Fijos el Mismo Día',
        metaDescription:
          'Qué es la carga inmediata en implantes dentales, qué condiciones exige, qué se coloca el mismo día y en qué casos es más prudente esperar.',
        shortLabel: 'Carga inmediata',
        cardSummary:
          'Colocar la pieza provisional el mismo día: cuándo se puede y cuándo no conviene.',
        h1: 'Carga inmediata: dientes fijos el mismo día',
        standfirst:
          'La carga inmediata coloca una pieza provisional sobre el implante en las horas siguientes a la cirugía. No acelera la biología: cambia lo que usted lleva en la boca mientras la biología ocurre. Y tiene condiciones que se comprueban en el quirófano, no antes.',
        procedureName: 'Carga inmediata de implantes dentales',
        keywords: [
          'carga inmediata implantes',
          'implantes dentales inmediatos Santiago',
          'dientes fijos el mismo día',
          'implante y corona el mismo día',
          'estabilidad primaria implante',
        ],
        sections: [
          {
            id: 'que-es',
            heading: 'Qué es exactamente',
            body: [
              'En el protocolo clásico, el implante se coloca y se deja tranquilo varios meses antes de ponerle nada encima. En la carga inmediata se atornilla una prótesis provisional el mismo día de la cirugía o en las cuarenta y ocho horas siguientes.',
              'Lo que no cambia es el tiempo de osteointegración. El hueso sigue necesitando sus tres a seis meses para unirse a la superficie del titanio. Lo que se hace es dejar que ese proceso ocurra bajo una prótesis diseñada para no recibir fuerza de masticación: se ajusta la oclusión para que no contacte, o para que contacte muy poco, con la arcada opuesta.',
              'Dicho de otro modo: la carga inmediata resuelve un problema estético y funcional durante la espera. No acorta la espera.',
            ],
          },
          {
            id: 'condiciones',
            heading: 'Las condiciones que exige',
            body: [
              'No todos los implantes se pueden cargar de inmediato, y la decisión final se toma durante la cirugía, con el implante ya colocado. Estos son los factores que la determinan:',
            ],
            points: [
              {
                term: 'Estabilidad primaria',
                detail:
                  'El anclaje mecánico que el implante consigue en el hueso en el momento mismo de colocarlo. Se mide con el torque de inserción y, cuando se dispone de ello, con análisis de frecuencia de resonancia. Si no llega al umbral, no se carga: es la condición que manda sobre todas las demás.',
              },
              {
                term: 'Cantidad y calidad de hueso',
                detail:
                  'Un hueso denso permite estabilidad alta; uno muy esponjoso, como suele ser el maxilar superior posterior, con frecuencia no la permite.',
              },
              {
                term: 'Ausencia de infección activa',
                detail:
                  'Si se ha extraído una pieza con infección, la zona necesita estar limpia. La carga inmediata sobre un lecho infectado es un mal negocio.',
              },
              {
                term: 'Una oclusión que se pueda controlar',
                detail:
                  'Si su mordida no permite dejar la pieza provisional fuera de contacto, cargarla sería exactamente lo que se intenta evitar.',
              },
              {
                term: 'Bruxismo',
                detail:
                  'Apretar los dientes anula el propósito de una prótesis descargada. En bruxistas marcados, la carga inmediata se plantea con mucha más cautela y casi siempre con férula.',
              },
            ],
            note: 'Si el día de la cirugía se decide no cargar el implante, no es una complicación ni un cambio de plan improvisado: es el protocolo funcionando. Un implante que se deja integrar tranquilo unas semanas más sigue siendo el mismo implante.',
          },
          {
            id: 'que-se-coloca',
            heading: 'Qué se le coloca ese día',
            body: [
              'Una prótesis provisional, no la definitiva. Puede ser una corona provisional sobre un implante unitario, un puente provisional sobre varios implantes o una prótesis fija completa en una rehabilitación de arcada.',
              'Está hecha con materiales pensados para durar meses, no años, y con una forma que además cumple una función clínica: guía la cicatrización de la encía para que el contorno esté hecho cuando llegue la corona definitiva. En el sector anterior esa función suele importar más que el propio hecho de llevar diente.',
              'La definitiva se fabrica después, con la integración confirmada y sobre unas medidas nuevas.',
            ],
          },
          {
            id: 'cuidados',
            heading: 'Cómo se cuida durante las primeras semanas',
            body: [
              'Aquí está el verdadero riesgo de la carga inmediata, y no es quirúrgico: es de comportamiento. Un implante que se micromueve demasiado durante las primeras semanas no se integra.',
            ],
            steps: [
              {
                title: 'Dieta blanda, en serio',
                desc: 'De seis a ocho semanas sin morder nada duro con esa zona. Nada de pan crujiente, hielo, frutos secos o carne fibrosa del lado tratado.',
              },
              {
                title: 'No usar la pieza provisional para cortar',
                desc: 'En el sector anterior, morder una manzana entera con el provisional es el gesto que más veces obliga a rehacer un tratamiento.',
              },
              {
                title: 'Higiene desde el primer día',
                desc: 'Suave alrededor de la herida, pero constante. La inflamación de la encía en esta fase compromete la integración.',
              },
              {
                title: 'Avisar ante cualquier movilidad',
                desc: 'Si nota que la pieza provisional se mueve, o si algo cambia al morder, hay que verlo pronto y no esperar a la siguiente cita.',
              },
            ],
          },
        ],
        faq: [
          {
            question: '¿La carga inmediata reduce el éxito del implante?',
            answer:
              'Cuando se aplica en los casos que cumplen las condiciones —sobre todo estabilidad primaria suficiente— los resultados publicados son comparables a los del protocolo convencional. El problema no es la técnica: es aplicarla a casos que no la cumplen. Por eso la decisión se toma en el quirófano y no al firmar el presupuesto.',
          },
          {
            question: '¿Puedo comer normal con el provisional?',
            answer:
              'No durante las primeras semanas. La prótesis provisional está pensada para que usted tenga diente, hable y sonría, no para masticar con fuerza. Volver a la dieta normal se hace de forma progresiva y cuando el odontólogo lo indique.',
          },
          {
            question: '¿Cuánto tiempo llevo el provisional?',
            answer:
              'Lo que dure la osteointegración, en torno a tres meses en la mandíbula y de cuatro a seis en el maxilar superior, más el tiempo de fabricación de la definitiva. En rehabilitaciones completas suele alargarse algo más porque la encía necesita estabilizarse antes de tomar las medidas finales.',
          },
        ],
      },
      {
        slug: 'injerto-oseo',
        metaTitle: 'Injerto Óseo y Elevación de Seno Maxilar',
        metaDescription:
          'Cuándo hace falta injerto óseo antes de un implante, qué tipos existen, en qué consiste la elevación de seno, cuánto se tarda y qué riesgos tiene.',
        shortLabel: 'Injerto óseo',
        cardSummary:
          'Cuando no hay hueso suficiente: tipos de injerto, elevación de seno, plazos y riesgos.',
        h1: 'Injerto óseo y elevación de seno maxilar',
        standfirst:
          'Cuando falta hueso donde debería ir el implante, hay técnicas para reponerlo. Añaden meses y una cirugía más al tratamiento, y por eso conviene entender qué se hace, qué se consigue y qué alternativas existen.',
        procedureName: 'Injerto óseo dental y elevación de seno maxilar',
        keywords: [
          'injerto óseo dental Santiago',
          'elevación de seno maxilar',
          'regeneración ósea guiada',
          'falta de hueso para implantes',
          'reabsorción ósea maxilar',
        ],
        sections: [
          {
            id: 'por-que-falta',
            heading: 'Por qué falta hueso',
            body: [
              'El hueso alveolar existe para sostener raíces. Cuando una raíz desaparece, el hueso que la rodeaba pierde su función y empieza a reabsorberse: es más rápido durante el primer año tras la extracción y continúa, más despacio, durante el resto de la vida. Nadie hace nada mal para que ocurra; ocurre.',
              'A eso se suman otras causas: una enfermedad periodontal que ya destruyó hueso antes de perder el diente, una infección larga, un traumatismo, o la presión constante de una dentadura completa apoyada sobre la encía durante años.',
              'En el maxilar superior posterior hay además un factor anatómico. El seno maxilar es una cavidad de aire que ocupa el espacio por encima de los molares, y con el tiempo tiende a neumatizarse, es decir, a expandirse hacia abajo ocupando el hueso que va quedando libre. De ahí que esa zona sea la que con más frecuencia necesita un procedimiento adicional.',
            ],
          },
          {
            id: 'tipos',
            heading: 'Qué tipos de injerto existen',
            body: [
              'Un injerto no es un bloque que se atornilla y ya está. En la mayoría de los casos es un material particulado que sirve de andamio para que su propio hueso crezca a través de él, protegido por una membrana. El material varía:',
            ],
            points: [
              {
                term: 'Autólogo',
                detail:
                  'Hueso del propio paciente, tomado de otra zona de la boca. Es el que mejor se comporta biológicamente, pero exige una segunda zona quirúrgica.',
              },
              {
                term: 'Alógeno',
                detail:
                  'Hueso humano de banco, procesado y esterilizado. Evita la segunda cirugía y está ampliamente documentado.',
              },
              {
                term: 'Xenoinjerto',
                detail:
                  'De origen animal, habitualmente bovino, tratado hasta dejar solo la matriz mineral. Se reabsorbe muy despacio, lo que ayuda a mantener el volumen a largo plazo.',
              },
              {
                term: 'Aloplástico',
                detail:
                  'Material sintético, como fosfatos de calcio. Sin origen biológico, útil en pacientes que prefieren evitarlo por convicción o por creencias.',
              },
              {
                term: 'Regeneración ósea guiada',
                detail:
                  'No es un material sino una técnica: cubrir el injerto con una membrana que impide que el tejido blando, que crece más rápido, invada el espacio antes de que lo haga el hueso.',
              },
            ],
          },
          {
            id: 'elevacion-de-seno',
            heading: 'La elevación de seno, en concreto',
            body: [
              'Cuando la altura de hueso bajo el seno maxilar no basta para alojar un implante, se levanta la membrana que tapiza el suelo del seno y se rellena el espacio ganado con material de injerto. Hay dos abordajes.',
              'La elevación por vía crestal se hace desde el mismo orificio del implante, empujando el suelo del seno unos milímetros hacia arriba. Es poco invasiva y sirve cuando falta poco. La elevación por vía lateral abre una ventana en la pared externa del maxilar, permite ganar mucha más altura y es una cirugía de mayor entidad.',
              'Según cuánto hueso quede, el implante se coloca en el mismo acto o se espera a que el injerto consolide. Esa decisión también depende de la estabilidad que se consiga, y también se toma en el quirófano.',
            ],
          },
          {
            id: 'plazos',
            heading: 'Cuánto se tarda',
            body: [
              'Un injerto necesita consolidar antes de recibir un implante, y esa consolidación se mide en meses, no en semanas. El rango habitual va de cuatro a nueve meses según la técnica, el material y el volumen que se haya repuesto; después empieza el tiempo de osteointegración del implante propiamente dicho.',
              'Sumado, un caso con injerto extenso puede ir de nueve a dieciocho meses desde la primera cirugía hasta la corona definitiva. Es el motivo por el que en la primera visita se insiste tanto en si hará falta injerto: cambia el calendario más que ninguna otra variable.',
              'Cuando el injerto es pequeño y se hace a la vez que el implante, no se añade tiempo apreciable. Los dos extremos existen y por eso no hay una cifra única.',
            ],
          },
          {
            id: 'riesgos-y-alternativas',
            heading: 'Riesgos, y cuándo se puede evitar',
            body: [
              'Los riesgos propios del injerto son la infección del material, su exposición a través de la encía, una reabsorción mayor de la esperada —de modo que el volumen final no alcance— y, en la elevación de seno, la perforación de la membrana sinusal o una sinusitis posterior. Una perforación advertida durante la cirugía se repara y en general no cambia el resultado; una no advertida sí puede complicarlo.',
              'También conviene saber que el injerto no siempre es obligatorio. Hay alternativas que a veces resuelven el mismo problema sin reponer hueso: implantes más cortos o más estrechos donde la anatomía lo admite, implantes inclinados que buscan el hueso disponible, o replantear la prótesis para apoyarse en otra zona. Cuál conviene depende enteramente de lo que muestre la tomografía.',
              'Y hay situaciones que exceden lo que se trata en una consulta general de implantología y que se derivan a cirugía maxilofacial. Decirlo a tiempo forma parte del trabajo.',
            ],
          },
        ],
        faq: [
          {
            question: '¿El injerto duele más que el implante?',
            answer:
              'Una regeneración pequeña hecha a la vez que el implante apenas cambia el postoperatorio. Una elevación de seno por vía lateral o un injerto en bloque sí suponen más inflamación y más días de molestias, y a veces hematoma. Se hacen con anestesia local y la pauta analgésica se ajusta a la magnitud de la cirugía.',
          },
          {
            question: '¿Puede fracasar un injerto?',
            answer:
              'Sí. Puede infectarse, exponerse o reabsorberse más de lo previsto y no llegar al volumen necesario. Cuando ocurre, en general se limpia la zona, se deja cicatrizar y se replantea: repetir el injerto, cambiar de técnica o cambiar de plan protésico. No suele significar que el implante sea imposible, sino que llegará más tarde.',
          },
          {
            question: '¿Puedo usar mi dentadura mientras cicatriza el injerto?',
            answer:
              'Casi nunca durante las primeras semanas, y después solo si se ajusta para que no apoye sobre la zona injertada. La presión de una prótesis removible sobre un injerto en consolidación es una de las causas evitables de fracaso. Si depende de su dentadura para trabajar, dígalo en la planificación: hay soluciones, pero hay que preverlas.',
          },
        ],
      },
      {
        slug: 'precio',
        metaTitle: 'Precio de los Implantes Dentales en Santiago',
        metaDescription:
          'De qué depende el presupuesto de un implante dental, qué conceptos debe incluir, cómo comparar dos presupuestos y por qué aquí no verá una tarifa.',
        shortLabel: 'Precio',
        cardSummary:
          'Qué entra en un presupuesto de implantes, y cómo comparar dos presupuestos de verdad.',
        h1: 'Qué determina el precio de unos implantes dentales',
        standfirst:
          'Aquí no hay una tarifa, y la explicación de por qué no la hay es probablemente más útil que la cifra que ha venido a buscar. Esta página le da las preguntas con las que un presupuesto se lee de verdad.',
        // The page is ABOUT dental implants; it happens to cover their cost.
        // Typing a quotation as a MedicalProcedure would be false, and `about`
        // is what a crawler reads to decide what entity this page discusses.
        procedureName: 'Implante dental',
        keywords: [
          'precio implantes dentales Santiago',
          'cuánto cuesta un implante dental República Dominicana',
          'presupuesto implantes dentales',
          'coste All-on-4',
        ],
        sections: [
          {
            id: 'por-que-no-hay-cifra',
            heading: 'Por qué no publicamos una cifra',
            body: [
              'Un precio publicado para «un implante» solo puede ser una de dos cosas: el precio del tornillo, que no es lo que usted va a recibir, o un precio de reclamo al que después se le suman los conceptos que faltaban. Ninguna de las dos le ayuda a decidir.',
              'Lo que se factura en un tratamiento con implantes es un conjunto de actos: el diagnóstico por imagen, la preparación previa si hace falta, la cirugía, los componentes, la prótesis provisional cuando la hay, la prótesis definitiva y los controles. Dos personas que llegan diciendo la misma frase pueden necesitar conjuntos muy distintos.',
              'Por eso el número honesto llega después de la evaluación, por escrito y desglosado; y por eso cualquier cifra que le den por teléfono, antes de verle, es una estimación que puede moverse mucho.',
            ],
          },
          {
            id: 'que-conceptos',
            heading: 'Qué conceptos debe incluir un presupuesto',
            body: [
              'Cuando reciba el suyo, compruebe que estos aparecen, aunque alguno esté a cero:',
            ],
            points: [
              {
                term: 'Estudio y pruebas de imagen',
                detail: 'Radiografía y, si se necesita, tomografía tridimensional.',
              },
              {
                term: 'Tratamientos previos',
                detail:
                  'Extracciones, tratamiento periodontal, endodoncias o cualquier cosa que haya que resolver antes de operar.',
              },
              {
                term: 'Regeneración ósea',
                detail:
                  'Injerto o elevación de seno, con el material y la membrana especificados, si están previstos.',
              },
              {
                term: 'Cirugía y componentes',
                detail:
                  'El implante, el pilar de cicatrización y el pilar definitivo. Son piezas distintas y se facturan por separado.',
              },
              {
                term: 'Prótesis provisional',
                detail:
                  'Si el plan la contempla. Es la partida que con más frecuencia falta en un presupuesto que parecía barato.',
              },
              {
                term: 'Prótesis definitiva',
                detail: 'Con el material indicado: no es lo mismo zirconio que metal-cerámica.',
              },
              {
                term: 'Controles y revisiones',
                detail:
                  'Cuántos van incluidos y a partir de cuál se factura aparte.',
              },
            ],
          },
          {
            id: 'comparar',
            heading: 'Cómo comparar dos presupuestos',
            body: [
              'Comparar totales no sirve de nada si los dos presupuestos no describen el mismo tratamiento. Estas son las preguntas que hacen comparables dos documentos, y son perfectamente razonables de plantear en cualquier consulta:',
              '¿Incluye la prótesis definitiva o solo la cirugía? ¿Cuántos implantes exactamente? ¿Con qué material se hace la corona? ¿Está prevista la regeneración ósea o se presupuestará después si aparece? ¿Cuántas revisiones incluye? ¿Quién realiza la cirugía y quién hace la prótesis? ¿Qué ocurre, y quién asume qué, si un implante no se integra?',
              'Esa última es la que más diferencias revela, y la respuesta debería ser explícita y por escrito, no una promesa verbal.',
            ],
            note: 'Un presupuesto notablemente más barato que el resto casi siempre está describiendo un tratamiento distinto. Antes de darlo por bueno, compruebe qué conceptos no aparecen en él.',
          },
          {
            id: 'seguros-y-pago',
            heading: 'Seguros y forma de pago',
            body: [
              'En la consulta se trabaja con varios planes de seguros dentales. La cobertura de implantes varía mucho entre pólizas, y en bastantes casos cubre solo una parte o solo determinadas fases, así que la única manera de saberlo es verificarlo con los datos concretos de su seguro antes de empezar.',
              'Si nos hace llegar esa información al solicitar la cita, la comprobación se puede tener hecha para cuando venga, y el presupuesto que reciba ya reflejará lo que le corresponde pagar a usted.',
            ],
          },
        ],
        faq: [
          {
            question: '¿Por qué no me dan un precio por teléfono?',
            answer:
              'Porque el precio depende de cuántos implantes, de si hace falta preparar el hueso y del tipo de prótesis, y ninguna de esas tres cosas se puede saber sin explorarle y sin una radiografía. Una cifra dada a ciegas o se queda corta y hay que corregirla después, o se infla para cubrirse. Preferimos la evaluación primero.',
          },
          {
            question: '¿El presupuesto puede cambiar durante el tratamiento?',
            answer:
              'Puede, y en tratamientos largos a veces cambia: aparece una raíz en peor estado de lo que mostraba la radiografía, o el hueso obliga a modificar el plan. Lo que no debe pasar es que se entere en la factura. Cualquier cambio se le comunica y se aprueba antes de realizarlo.',
          },
          {
            question: '¿Sale más barato hacerse los implantes en República Dominicana?',
            answer:
              'Para pacientes que llegan desde mercados con precios sanitarios altos, la diferencia suele ser real. Pero el coste de un tratamiento de implantes incluye los viajes, la estancia y, sobre todo, el seguimiento a lo largo de meses. Esa parte se explica en la página sobre turismo dental, porque decidir solo por el precio de la cirugía es cómo salen mal estos tratamientos.',
          },
        ],
      },
      {
        slug: 'turismo-dental-santiago',
        metaTitle: 'Turismo Dental en Santiago: Cómo Planificarlo',
        metaDescription:
          'Cómo organizar un tratamiento de implantes viajando a Santiago de los Caballeros: número de viajes, plazos entre fases, idiomas y qué preguntar antes.',
        shortLabel: 'Turismo dental',
        cardSummary:
          'Tratarse viajando a Santiago: cuántos viajes, qué plazos y qué preguntar antes de reservar.',
        h1: 'Turismo dental en Santiago de los Caballeros',
        standfirst:
          'Un tratamiento de implantes se puede hacer viajando, y muchas personas lo hacen bien. Lo que decide el resultado no es la cirugía, que dura una mañana, sino el seguimiento, que dura meses. Esta página trata sobre esa parte.',
        procedureName: 'Tratamiento de implantes dentales para pacientes internacionales',
        keywords: [
          'turismo dental República Dominicana',
          'turismo dental Santiago de los Caballeros',
          'implantes dentales para extranjeros República Dominicana',
          'dentista que habla inglés Santiago',
        ],
        sections: [
          {
            id: 'el-problema-real',
            heading: 'El problema real del turismo dental',
            body: [
              'La cirugía de implantes es una jornada. La osteointegración son meses, la prótesis definitiva llega después, y el mantenimiento no termina nunca. Un tratamiento que se planifica alrededor de un vuelo y no alrededor de esa secuencia es el que acaba mal.',
              'Los problemas que se ven no suelen ser quirúrgicos. Son de continuidad: nadie revisa el implante a los tres meses, un provisional se descementa a dos mil kilómetros de la consulta que lo puso, o el odontólogo de casa recibe a un paciente sin informe y sin saber qué componentes lleva dentro.',
              'Todo eso es evitable, pero se evita antes de reservar el vuelo, no después.',
            ],
          },
          {
            id: 'como-se-organiza',
            heading: 'Cómo se organiza, de forma realista',
            body: [
              'Un tratamiento de implantes para alguien que viaja se estructura normalmente en dos estancias, con la espera biológica entre ambas y el contacto a distancia sosteniendo el intervalo.',
            ],
            steps: [
              {
                title: 'Antes de viajar',
                desc: 'Se revisa a distancia lo que usted pueda enviar: radiografías recientes, informes, lista de medicación y antecedentes. Con eso se hace una orientación del caso, que no es un diagnóstico, y se acota qué es probable que se necesite.',
              },
              {
                title: 'Primera estancia',
                desc: 'Exploración presencial, pruebas de imagen y presupuesto definitivo el primer día. Cirugía en los días siguientes, con margen para la revisión postoperatoria y la retirada de puntos antes de volar. Cuente varios días, no cuarenta y ocho horas.',
              },
              {
                title: 'El intervalo',
                desc: 'Los meses de osteointegración transcurren en su casa. Se acuerdan puntos de contacto y qué hacer si algo se mueve o molesta, y se le entrega por escrito qué implantes lleva colocados, para que cualquier odontólogo pueda atenderle.',
              },
              {
                title: 'Segunda estancia',
                desc: 'Toma de medidas, pruebas y colocación de la prótesis definitiva. Necesita varios días porque entre la impresión y la colocación hay trabajo de laboratorio y al menos una prueba intermedia.',
              },
            ],
            note: 'Desconfíe de cualquier plan que le prometa el tratamiento completo, con prótesis definitiva incluida, en una sola semana. La osteointegración no se puede comprimir, y una prótesis definitiva colocada sobre un implante que aún no se ha integrado no es un atajo: es un riesgo.',
          },
          {
            id: 'que-traer',
            heading: 'Qué conviene traer, y qué conviene preguntar',
            body: [
              'Traiga las radiografías o tomografías recientes que tenga, aunque haya que repetirlas; sirven de referencia. Traiga la lista completa de su medicación, con dosis, y en particular si toma anticoagulantes, bifosfonatos o algún antirresortivo. Traiga los informes de cualquier enfermedad relevante y el contacto de su odontólogo habitual.',
              'Y pregunte antes de reservar: quién realiza la cirugía, cuántas estancias prevé el plan y cuántos días cada una, qué se le entrega por escrito al marcharse, qué ocurre si surge una complicación al volver a casa, y con quién se comunica entre viajes.',
            ],
          },
          {
            id: 'idiomas-y-consulta',
            heading: 'Idiomas y dónde está la consulta',
            body: [
              'La consulta atiende en español y en inglés, y este sitio está publicado íntegro en ambos idiomas. Para un tratamiento en el que el consentimiento informado, las instrucciones postoperatorias y las señales de alarma tienen que entenderse sin ambigüedad, poder hablar en su idioma no es un detalle de cortesía.',
              'Orthoprotesis Dental Clinic está en Plaza Las Ramblas, Módulo 101, en Santiago de los Caballeros, con horario de lunes a viernes. Santiago tiene aeropuerto internacional propio, el Cibao, lo que evita el trayecto por carretera desde Santo Domingo o Puerto Plata.',
              'Quien le atienda en la primera visita es quien realiza el tratamiento. En un caso que se reparte entre dos viajes y varios meses, esa continuidad es justamente lo que suele fallar.',
            ],
          },
          {
            id: 'si-surge-algo',
            heading: 'Si surge algo cuando ya está en casa',
            body: [
              'Antes de volver debería llevarse tres cosas: un informe con los implantes colocados y sus referencias, instrucciones escritas de qué es normal y qué no, y una vía de contacto directa con la consulta.',
              'Con eso, la mayoría de las incidencias se resuelven a distancia o las puede atender un odontólogo local con la información delante. Un provisional descementado o un tornillo que se afloja son problemas menores cuando quien los ve sabe exactamente qué tiene enfrente, y problemas serios cuando no.',
              'Conviene además tener localizado a un odontólogo cerca de su domicilio antes de viajar, y no el día que lo necesite.',
            ],
          },
        ],
        faq: [
          {
            question: '¿Cuántos viajes hacen falta?',
            answer:
              'Lo habitual son dos: uno para el estudio y la cirugía, y otro, meses después, para la prótesis definitiva. Los casos con injerto óseo pueden requerir un tercero, porque el injerto consolida antes de colocar el implante. El número se le concreta con el plan de tratamiento, no antes de haberle visto.',
          },
          {
            question: '¿Cuántos días debo reservar en cada viaje?',
            answer:
              'En la primera estancia conviene tener margen para la exploración, la cirugía y al menos una revisión posterior antes de volar. En la segunda, para la toma de medidas, el trabajo de laboratorio y la prueba previa a la colocación. Los días exactos dependen del caso, y se los indicamos antes de que compre los billetes.',
          },
          {
            question: '¿Puedo empezar el trámite a distancia?',
            answer:
              'Puede enviarnos sus radiografías, informes y medicación a través del formulario de contacto y le damos una orientación del caso. No es un diagnóstico: hasta que no haya exploración y pruebas propias no hay ni plan ni presupuesto en firme. Sirve para saber si merece la pena organizar el viaje.',
          },
          {
            question: '¿Se atiende en inglés?',
            answer:
              'Sí. La consulta atiende en español y en inglés, y el consentimiento informado y las instrucciones postoperatorias se le entregan en el idioma en el que usted se comunica.',
          },
        ],
      },
    ],
  },
  en: {
    ui: {
      breadcrumbLabel: 'Breadcrumb',
      home: 'Home',
      contentsTitle: 'On this page',
      faqTitle: 'Common questions',
      relatedTitle: 'Keep reading',
      relatedLead:
        'Each of these topics has its own page, with the detail this one only summarises.',
      backToPillar: 'Back to the dental implants guide',
      ctaTitle: 'The next step is an assessment, not a treatment',
      ctaBody:
        'Nothing you have read here replaces an examination and an x-ray. At the first visit Dr. Valerio reviews your case, explains the options that genuinely exist in your situation, and gives you a written quote before anything begins.',
      ctaPrimary: 'Request an appointment',
      ctaCall: 'Call the practice',
      ctaReassurance: 'Requesting an appointment commits you to nothing.',
      noteLabel: 'Worth knowing',
      medicalDisclaimer:
        'This page is general patient information, written so that you arrive at the practice knowing what to ask. It is not a diagnosis or a treatment recommendation: those can only follow a clinical examination and the appropriate imaging.',
      revisedLabel: 'Last updated',
    },
    pillar: {
      metaTitle: 'Dental Implants in Santiago, Dominican Republic',
      metaDescription:
        'A guide to dental implants in Santiago, DR: who is a candidate, the surgery, osseointegration, materials, what drives the cost, recovery and real risks.',
      shortLabel: 'Dental implants',
      cardSummary:
        'The full guide: what an implant is, who is a candidate, how long it takes and what can go wrong.',
      h1: 'Dental implants in Santiago de los Caballeros',
      standfirst:
        'An implant replaces the root of a tooth that is no longer there. This page sets out plainly who is a candidate, what happens at each visit, how long the bone takes to integrate it, what the quote actually depends on, and what can go wrong.',
      procedureName: 'Dental implant',
      keywords: [
        'dental implants Santiago Dominican Republic',
        'dental implants Santiago de los Caballeros',
        'dental implant surgery Dominican Republic',
        'osseointegration',
        'dental implant candidate',
        'dental implant risks',
        'peri-implantitis',
      ],
      sections: [
        {
          id: 'que-es',
          heading: 'What a dental implant is, and what it is not',
          body: [
            'A dental implant is a titanium screw placed inside the jawbone, occupying the space left by the root of the lost tooth. An abutment sits on top of it, and a crown on top of that. They are three separate pieces, made and fitted at different moments: when someone says "they put my implant in within the hour", they almost always mean only the first.',
            'What an implant is not: it is not a tooth. It has no periodontal ligament — the thin membrane that cushions a natural tooth and tells the brain how much force is being applied. An implant is anchored directly in bone, it is rigid, and it does not complain when it is overloaded. That difference explains most of the precautions further down this page.',
            'Nor is it permanent by default. A well-placed, well-maintained implant can be with you for decades; one placed on inflamed gums, in an active smoker, or never followed up, can be lost within a few years. The difference is not the brand of the screw.',
          ],
          points: [
            {
              term: 'The implant',
              detail:
                'The titanium body that sits inside the bone. It is the only part that actually integrates with it.',
            },
            {
              term: 'The abutment',
              detail:
                'The intermediate piece, joined to the implant, that passes through the gum and carries the crown.',
            },
            {
              term: 'The crown',
              detail:
                'The visible part, in ceramic, made to measure from an impression or a scan of your mouth.',
            },
          ],
        },
        {
          id: 'candidatura',
          heading: 'Are you a candidate for an implant?',
          body: [
            'The honest answer is that nobody knows until they look. Candidacy is decided with a clinical examination and an x-ray — a panoramic film, or where the case calls for it a cone-beam CT scan, which measures bone in three dimensions. Without that image nobody can tell you whether there is enough bone, or where the inferior alveolar nerve runs.',
            'That said, some factors are known in advance and are worth putting on the table at the first visit, because they change either the plan or the prognosis:',
          ],
          points: [
            {
              term: 'Healthy gums',
              detail:
                'Active periodontal disease is the most common avoidable cause of failure. It is treated before anything is placed, not afterwards.',
            },
            {
              term: 'Bone volume and density',
              detail:
                'If height or width falls short, there are regenerative techniques: bone grafting, sinus lift. They lengthen the schedule; they rarely close the door.',
            },
            {
              term: 'Smoking',
              detail:
                'Smoking reduces blood supply to the gum and is associated with more failures and more peri-implantitis. It is not an absolute contraindication, but it changes the prognosis and you deserve to know that before deciding.',
            },
            {
              term: 'Systemic conditions',
              detail:
                'Well-controlled diabetes does not rule out an implant; uncontrolled diabetes slows healing. The same applies to bisphosphonates and other antiresorptive drugs, head and neck radiotherapy, and immunosuppression: these need discussing in detail, and sometimes coordinating with your physician.',
            },
            {
              term: 'Bruxism',
              detail:
                'Clenching or grinding loads the implant with forces it has no cushioning against. It does not rule you out, but it usually means a night guard and a careful look at the bite.',
            },
            {
              term: 'Unfinished growth',
              detail:
                'In adolescents we wait until facial growth has finished. An implant stays fixed while the neighbouring teeth keep moving, and the step between them becomes visible over the years.',
            },
          ],
          note: 'No online questionnaire, and no web page, replaces that assessment. If someone confirms you are a candidate without having looked in your mouth and without an x-ray, be sceptical.',
        },
        {
          id: 'secuencia',
          heading: 'The treatment sequence, step by step',
          body: [
            'A single uncomplicated implant is usually spread over five or six visits across several months. Most of that time is not treatment: it is biological waiting, and it cannot be compressed for convenience.',
          ],
          steps: [
            {
              title: 'Assessment and planning',
              desc: 'Examination, x-ray and, where the case requires it, a CT scan. The position, diameter and length of the implant are decided, and you are given a written quote before anything starts.',
            },
            {
              title: 'Preparation',
              desc: 'Decay, infection or gum disease are resolved first. If bone is missing, this is where the graft happens, and the schedule lengthens accordingly.',
            },
            {
              title: 'Placement surgery',
              desc: 'Under local anaesthetic. The bone is accessed, the site prepared with slow-speed drills and copious irrigation so it is never overheated, and the implant is placed. A single tooth usually takes thirty to sixty minutes, and you go home the same day.',
            },
            {
              title: 'Osseointegration',
              desc: 'The period in which bone bonds to the implant surface. Nothing is done here: we wait, and we check.',
            },
            {
              title: 'Second stage and impressions',
              desc: 'The implant is uncovered if it was submerged and a healing abutment shapes the gum. A few weeks later the impression or scan is taken and sent to the laboratory.',
            },
            {
              title: 'Fitting the crown',
              desc: 'It is tried in, the bite is adjusted a fraction at a time, and the definitive crown is fixed. From there the treatment becomes maintenance.',
            },
          ],
        },
        {
          id: 'osteointegracion',
          heading: 'Osseointegration and the real timelines',
          body: [
            'Osseointegration is the process by which bone grows into direct contact with the titanium surface, with no fibrous tissue in between. It is what turns a screw into an anchor. It is not glue and it is not setting: it is living bone remodelling against metal.',
            'That process runs at its own biological pace. The figures ordinarily used are around three months in the lower jaw, where the bone is denser, and four to six months in the upper jaw, which is more porous. If there was a graft, add the graft consolidation time before the implant is even placed.',
            'Your case may fall inside or outside those ranges. The density of your bone, the stability achieved at the moment of surgery, and your own healing outrank any printed calendar. That is why the final timeline is confirmed after the surgery, not before it.',
            'Immediate loading, in which a temporary prosthesis goes on the same day, does exist. It does not shorten osseointegration: it lets it happen underneath a prosthesis designed not to take chewing force. It has its own requirements and its own page.',
          ],
        },
        {
          id: 'materiales',
          heading: 'Materials: titanium, ceramic and the crown',
          body: [
            'The implant body is medical-grade titanium, or a titanium-zirconium alloy. Titanium has been used in orthopaedic and dental surgery for over half a century because the body tolerates it well and bone adheres to its surface. Metal-free zirconia ceramic implants also exist, used mainly for aesthetic reasons in thin gum tissue or in people with documented metal sensitivity.',
            'The crown is a separate piece, and there is more than one reasonable option. Monolithic zirconia is very strong and suits the back of the mouth, where chewing forces are highest. Lithium disilicate is more translucent and is usually preferred at the front, where appearance is what is being judged. Porcelain-fused-to-metal remains a valid and thoroughly proven solution.',
            'No material performs well outside its indication. A highly aesthetic ceramic in a high-load area fractures; an opaque one on a visible incisor shows. That decision is made tooth by tooth, looking at where it goes, how much force it takes and what colour the neighbouring teeth are.',
          ],
        },
        {
          id: 'precio',
          heading: 'What determines the price of an implant',
          body: [
            'You will not find a figure on this page, and there is a reason. An implant quote is not a catalogue price: two people who both say "I need an implant" can receive quotes that differ by a factor of three, because what is billed is not the screw.',
          ],
          points: [
            {
              term: 'How many teeth, and of what kind',
              detail:
                'A single implant, three separate implants and a full arch on four or six implants are different treatments, not multiples of the same one.',
            },
            {
              term: 'Whether the ground needs preparing',
              detail:
                'Extractions, periodontal treatment, bone grafting or a sinus lift are procedures with their own cost and their own calendar.',
            },
            {
              term: 'The type of prosthesis',
              detail:
                'Crown material, screw-retained or cemented, whether a temporary is needed and for how long.',
            },
            {
              term: 'Imaging',
              detail:
                'A three-dimensional scan is not needed in every case. Where it is, it belongs in the quote and should appear as its own line.',
            },
            {
              term: 'The number of visits',
              detail:
                'Every check, adjustment and review takes chair time. Sometimes it is included and sometimes it is not; asking is entirely reasonable.',
            },
          ],
          note: 'The quote is given in writing after the assessment, itemised. If something changes during treatment — and sometimes it does — you are told before it is done, not on the invoice.',
        },
        {
          id: 'recuperacion',
          heading: 'Recovery, day by day',
          body: [
            'Single-implant surgery is less unpleasant than most people expect; it usually compares favourably with a difficult extraction. That said, there is a real recovery and it is worth planning for, particularly if you have commitments in the days that follow.',
          ],
          steps: [
            {
              title: 'The first twenty-four hours',
              desc: 'Swelling and slight bleeding are expected. Intermittent cold on the cheek, the medication as prescribed, no vigorous rinsing and no spitting. Soft food, cold or lukewarm.',
            },
            {
              title: 'Day two to day five',
              desc: 'Swelling peaks between forty-eight and seventy-two hours and then subsides. A bruise may appear on the skin. Gentle hygiene around the wound, with no brushing over the suture.',
            },
            {
              title: 'Week one and week two',
              desc: 'Sutures out, where there are any, between seven and fourteen days. Most people are back to normal activity in two or three days, and to strenuous exercise at around a week.',
            },
            {
              title: 'Until the definitive crown',
              desc: 'While the implant integrates you chew on the other side and attend the checks. If you are wearing a temporary, do not use it to bite anything hard.',
            },
          ],
          note: 'Call the practice if pain increases from the third day instead of easing, if a fever appears, if swelling grows markedly, or if the temporary feels loose. Those are the signs that genuinely need seeing straight away.',
        },
        {
          id: 'riesgos',
          heading: 'Risks and complications',
          body: [
            'Dental implants are a predictable and thoroughly documented treatment, but they are not a treatment without risk. Any practice that presents a surgical procedure with no list of complications is withholding information you need in order to decide.',
          ],
          points: [
            {
              term: 'Failure to integrate',
              detail:
                'The implant does not bond to the bone and stays mobile. It usually shows in the first few months. It is removed, the site is allowed to heal, and in many cases it can be attempted again later.',
            },
            {
              term: 'Peri-implantitis',
              detail:
                'Chronic inflammation of the tissue around an integrated implant, with progressive loss of the bone holding it. It is the most common late complication and the one most tied to hygiene, smoking and skipped check-ups.',
            },
            {
              term: 'Nerve injury',
              detail:
                'In the lower jaw the inferior alveolar nerve runs close by. Injury can cause numbness of the lip or chin, usually temporary and rarely permanent. It is why the case is planned on imaging and safety margins are respected.',
            },
            {
              term: 'Communication with the maxillary sinus',
              detail:
                'In the upper back jaw the sinus sits directly above. Where bone is scarce the membrane is lifted in a controlled way; an unnoticed perforation can lead to sinusitis.',
            },
            {
              term: 'Mechanical complications',
              detail:
                'A loosened or fractured screw, a decemented crown, a fractured ceramic. These are usually repairable, and they are more frequent in people who clench.',
            },
            {
              term: 'An aesthetic result that falls short',
              detail:
                'Gum recession, a visible grey margin, or a papilla that does not fill the space between teeth. More likely at the front and in thin gum tissue, which is why those cases are planned more cautiously.',
            },
          ],
          note: 'Almost all of these have good solutions when they are caught early, and catching them early depends on you attending the check-ups. The complication with the worst outlook is always the one that arrives late.',
        },
        {
          id: 'mantenimiento',
          heading: 'Looking after an implant long term',
          body: [
            'An implant cannot decay. The bone holding it can be lost, and that is what the whole of maintenance is about. Three things, none of them optional.',
          ],
          points: [
            {
              term: 'Specific daily hygiene',
              detail:
                'Brushing twice a day, plus cleaning between the teeth with a correctly sized interdental brush or a water flosser. Conventional floss is not always the right tool around an implant.',
            },
            {
              term: 'Regular reviews',
              detail:
                'Clinical and radiographic checks. Early bone loss does not hurt and cannot be seen: it can only be measured, and it is far easier to correct at the start.',
            },
            {
              term: 'Controlling what loads it',
              detail:
                'A night guard if you clench, a bite adjustment where one is needed, and stopping smoking if that is within your reach.',
            },
          ],
        },
        {
          id: 'alternativas',
          heading: 'When an implant is not the best option',
          body: [
            'Recommending an implant to everybody would be convenient and would be dishonest. There are situations where something else serves better: a fixed bridge when the neighbouring teeth are already crowned or will need crowns anyway; a well-made removable prosthesis when the state of the bone, general health or budget does not allow otherwise; or simply monitoring, when the missing tooth is a wisdom tooth and compromises neither function nor appearance.',
            'And there are cases where an implant is clearly the better choice, which deserves saying just as plainly: when the neighbouring teeth are healthy and cutting them down for a bridge would mean destroying sound tissue, or when a lower full denture will not stay put and two implants stabilise it completely.',
            'What should come out of the first visit is not a "yes" to a treatment, but a comparison of the options that genuinely exist in your case — what each one costs, how long each lasts, and what each will ask of you.',
          ],
        },
      ],
      faq: [
        {
          question: 'Does placing an implant hurt?',
          answer:
            'The surgery is done under local anaesthetic and should not hurt while it is happening. What follows is what follows any minor procedure: swelling and discomfort manageable with the prescribed medication, peaking between forty-eight and seventy-two hours. Most patients describe it as easier than a difficult extraction.',
        },
        {
          question: 'How long does the whole treatment take?',
          answer:
            'From the first visit to the definitive crown, three to six months is usual where no graft is needed, and six to twelve months where one is. The exact timeline depends on your bone density and your healing, which is why it is confirmed after the surgery rather than before it.',
        },
        {
          question: 'Will it show?',
          answer:
            'A well-made crown on an implant is hard to tell from a natural tooth in everyday use. The delicate part is usually not the crown but the gum around it, particularly at the front and in thin tissue. That is assessed before surgery, because it determines where the implant goes.',
        },
        {
          question: 'How long does an implant last?',
          answer:
            'There is no expiry date and no single figure that applies to everyone. There are implants still in function after twenty or thirty years, and others lost in the first year. What weighs most is not the material but gum health, daily hygiene, smoking, and turning up for reviews.',
        },
        {
          question: 'Will I be without a tooth while I wait?',
          answer:
            'In most cases, no. Depending on the site and the stability achieved, a temporary crown, a temporary bridge or a temporary removable prosthesis is fitted. In some specific cases it is better to load nothing for a few weeks; when that happens, you are told why.',
        },
        {
          question: 'Can I have implants after years in a full denture?',
          answer:
            'Often yes, but this is exactly the case where the bone has to be measured before anything is promised: years without roots mean resorption. There may be enough volume, a graft may be needed, and the best answer may be an overdenture held by two or four implants rather than a fixed bridge.',
        },
      ],
    },
    spokes: [
      {
        slug: 'all-on-4',
        metaTitle: 'All-on-4 in Santiago: A Fixed Full Arch',
        metaDescription:
          'What All-on-4 is, who it suits, what it asks of the bone, how the temporary and definitive bridges work, and its real limitations.',
        shortLabel: 'All-on-4',
        cardSummary:
          'A whole arch on four implants: indications, requirements and honest limitations.',
        h1: 'All-on-4: a full arch on four implants',
        standfirst:
          'Rehabilitating a whole arch on four implants is an established, well-documented technique. It also has specific requirements and drawbacks that are rarely spelled out. Both halves are here.',
        procedureName: 'Full-arch rehabilitation on four implants (All-on-4)',
        keywords: [
          'All-on-4 Santiago Dominican Republic',
          'all on 4 dental implants',
          'full arch dental implants',
          'fixed implant bridge',
          'All-on-6',
        ],
        sections: [
          {
            id: 'en-que-consiste',
            heading: 'What it involves',
            body: [
              'The All-on-4 concept rehabilitates an entire arch — the whole upper or the whole lower — on four implants rather than six, eight or ten. Two are placed straight at the front, and two are tilted backwards to use the bone that is usually preserved in front of the maxillary sinus above and in front of the alveolar nerve below.',
              'That tilt is the central idea. Angling the rear implants lets the bridge be supported further back without invading those structures and, in many cases, without grafting bone where none is left. That is why the technique exists: not to save implants, but to avoid an extensive graft.',
              'The result is a fixed, screw-retained full bridge that you do not take out. It is not a denture that is glued in, and not an appliance removed at night.',
            ],
          },
          {
            id: 'para-quien',
            heading: 'Who it is for',
            body: [
              'It is a solution designed for complete arches, not for isolated gaps. The usual profiles are these:',
            ],
            points: [
              {
                term: 'A completely edentulous arch',
                detail:
                  'Especially the lower jaw, where a conventional full denture moves when you talk and eat because there is nothing to retain it.',
              },
              {
                term: 'Teeth that cannot be saved',
                detail:
                  'Where what remains is mobile or has generalised bone loss, and keeping it only postpones the problem.',
              },
              {
                term: 'Posterior resorption',
                detail:
                  'Where the bone in the molar region no longer gives any height but the front of the jaw still does. That is precisely the scenario the technique was designed for.',
              },
              {
                term: 'People who would rather avoid an extensive graft',
                detail:
                  'Avoiding one shortens the calendar and reduces the number of surgeries, and for many patients that weighs as heavily as the final result.',
              },
            ],
            note: 'It is not a universal technique. If you still have healthy teeth in that arch, extracting them to fit a full bridge is a serious decision and needs justifying with more than convenience of planning.',
          },
          {
            id: 'requisitos',
            heading: 'What it asks of the bone and the bite',
            body: [
              'With four implants carrying twelve or fourteen teeth, each implant works harder than in a rehabilitation on six or more. That means the planning has less margin for error, not more.',
              'There must be enough bone at the front to house the four implants with good initial stability, and that stability has to be measured at the time of surgery rather than assumed. The bite matters too: if the opposing arch is healthy natural teeth, the forces are greater than if it is another prosthesis.',
              'Three-dimensional imaging is not optional here. Angling an implant backwards requires knowing precisely where the sinus or the nerve is, and a flat x-ray does not show that.',
            ],
          },
          {
            id: 'provisional-y-definitiva',
            heading: 'The temporary bridge and the definitive one',
            body: [
              'The image that circulates of All-on-4 — walking out of the clinic with teeth in place — refers to the temporary bridge, not the definitive one. Where conditions allow, a fixed temporary bridge is fitted in the hours after surgery, lighter and with the bite adjusted so it does not load the implants while they integrate.',
              'The definitive bridge comes months later, once integration is confirmed and the gum has settled. It is made from different materials and on fresh measurements, because the gum contour changes during healing and a bridge made on day one would no longer fit the same way.',
              'Two prostheses is not a surprise extra: it is part of the treatment and it belongs in the quote from the outset.',
            ],
          },
          {
            id: 'limites',
            heading: 'Its limits, stated plainly',
            body: [
              'None of this disqualifies the technique. All of it should be said before you decide.',
            ],
            points: [
              {
                term: 'Little redundancy',
                detail:
                  'With four implants, losing one compromises the whole structure. With six, the bridge can sometimes be rescued. That is why All-on-6 exists, and why it is sometimes the recommendation.',
              },
              {
                term: 'Hygiene changes',
                detail:
                  'Under a fixed full bridge there is a space that has to be cleaned every day with a water flosser and specific brushes. Anyone who does not will get inflammation, and then bone loss.',
              },
              {
                term: 'The prosthesis needs maintenance',
                detail:
                  'Screws are checked, acrylic wears, and at some point the bridge needs repair or replacement. It is a mechanical structure under load, not a permanent part.',
              },
              {
                term: 'Speech takes adjusting',
                detail:
                  'The volume and contour differ from your own teeth or from a previous denture. Most people adapt within days or weeks; it is worth knowing that period exists.',
              },
              {
                term: 'It does not easily reverse',
                detail:
                  'If teeth are extracted to fit it, the decision cannot be undone. It deserves a second opinion if you have the slightest doubt.',
              },
            ],
          },
        ],
        faq: [
          {
            question: 'Do I leave with teeth the same day?',
            answer:
              'Often yes, but only when the stability achieved during surgery allows it, and always with a temporary bridge. If the implants do not reach the necessary anchorage in theatre, loading them that day would harm the outcome, and the correct decision is to wait. That is why it cannot be promised in advance.',
          },
          {
            question: 'Is All-on-4 better than All-on-6?',
            answer:
              'It depends on the bone available, the force of your bite and which arch is involved. More implants spread the load better and leave a margin if one fails; fewer implants avoid areas with no bone and reduce both surgery and cost. It is a decision made with the CT scan in front of you, not a preference.',
          },
          {
            question: 'Can I take it out to clean it?',
            answer:
              'No. The bridge is screw-retained and only the dentist removes it, normally at maintenance visits. Daily cleaning is done with the bridge in place, which is why the hygiene technique is taught before the treatment finishes.',
          },
        ],
      },
      {
        slug: 'carga-inmediata',
        metaTitle: 'Immediate Loading: Fixed Teeth the Same Day',
        metaDescription:
          'What immediate loading of dental implants is, the conditions it requires, what is fitted on the day, and when waiting is the wiser choice.',
        shortLabel: 'Immediate loading',
        cardSummary:
          'Fitting the temporary on the day of surgery: when it works and when it should not be done.',
        h1: 'Immediate loading: fixed teeth the same day',
        standfirst:
          'Immediate loading fits a temporary tooth onto the implant within hours of surgery. It does not speed up biology: it changes what you are wearing while the biology happens. And it has conditions that are checked in theatre, not beforehand.',
        procedureName: 'Immediate loading of dental implants',
        keywords: [
          'immediate loading dental implants',
          'same day dental implants Santiago',
          'teeth in a day Dominican Republic',
          'implant primary stability',
        ],
        sections: [
          {
            id: 'que-es',
            heading: 'What it actually is',
            body: [
              'In the conventional protocol the implant is placed and left alone for several months before anything goes on top of it. In immediate loading a temporary prosthesis is fitted on the day of surgery or within the following forty-eight hours.',
              'What does not change is the osseointegration time. Bone still needs its three to six months to bond to the titanium surface. What is done is to let that happen underneath a prosthesis designed not to take chewing force: the bite is adjusted so it does not contact the opposing arch, or barely does.',
              'Put another way: immediate loading solves an aesthetic and functional problem during the wait. It does not shorten the wait.',
            ],
          },
          {
            id: 'condiciones',
            heading: 'The conditions it requires',
            body: [
              'Not every implant can be loaded immediately, and the final decision is made during surgery, with the implant already in place. These are the factors that decide it:',
            ],
            points: [
              {
                term: 'Primary stability',
                detail:
                  'The mechanical anchorage the implant achieves in bone at the moment it is placed. It is measured by insertion torque and, where available, by resonance frequency analysis. Below the threshold, it is not loaded: this condition outranks all the others.',
              },
              {
                term: 'Bone quantity and quality',
                detail:
                  'Dense bone allows high stability; very porous bone, as the upper back jaw often is, frequently does not.',
              },
              {
                term: 'No active infection',
                detail:
                  'If a tooth with infection has been removed, the site needs to be clean. Immediate loading onto an infected site is a poor bargain.',
              },
              {
                term: 'A bite that can be controlled',
                detail:
                  'If your occlusion makes it impossible to keep the temporary out of contact, loading it would be exactly what the protocol is trying to avoid.',
              },
              {
                term: 'Bruxism',
                detail:
                  'Clenching defeats the purpose of an unloaded prosthesis. In marked bruxists, immediate loading is approached far more cautiously and almost always with a guard.',
              },
            ],
            note: 'If on the day of surgery the decision is not to load the implant, that is not a complication or an improvised change of plan: it is the protocol working. An implant left to integrate quietly for a few more weeks is still the same implant.',
          },
          {
            id: 'que-se-coloca',
            heading: 'What is fitted on the day',
            body: [
              'A temporary prosthesis, not the definitive one. It may be a temporary crown on a single implant, a temporary bridge on several, or a fixed full bridge in a full-arch case.',
              'It is made from materials meant to last months rather than years, and its shape does clinical work as well: it guides the healing of the gum so that the contour is already formed when the definitive crown arrives. At the front of the mouth that function usually matters more than the fact of having a tooth at all.',
              'The definitive prosthesis is made afterwards, with integration confirmed and on fresh measurements.',
            ],
          },
          {
            id: 'cuidados',
            heading: 'Looking after it in the first weeks',
            body: [
              'This is where the real risk of immediate loading sits, and it is not surgical: it is behavioural. An implant that micro-moves too much during the first weeks does not integrate.',
            ],
            steps: [
              {
                title: 'A soft diet, seriously',
                desc: 'Six to eight weeks biting nothing hard on that side. No crusty bread, ice, nuts or fibrous meat on the treated side.',
              },
              {
                title: 'Do not use the temporary to cut',
                desc: 'At the front of the mouth, biting into a whole apple with a temporary is the single gesture that most often forces a treatment to be redone.',
              },
              {
                title: 'Hygiene from day one',
                desc: 'Gentle around the wound, but consistent. Gum inflammation at this stage compromises integration.',
              },
              {
                title: 'Report any movement',
                desc: 'If the temporary feels loose, or something changes when you bite, it needs seeing promptly rather than at the next scheduled visit.',
              },
            ],
          },
        ],
        faq: [
          {
            question: 'Does immediate loading reduce the implant success rate?',
            answer:
              'Applied to cases that meet the conditions — above all sufficient primary stability — published outcomes are comparable to the conventional protocol. The problem is not the technique: it is applying it to cases that do not meet them. That is why the decision is made in theatre and not when the quote is signed.',
          },
          {
            question: 'Can I eat normally with the temporary?',
            answer:
              'Not in the first weeks. The temporary is there so you have a tooth, can speak and can smile — not so you can chew hard. Returning to a normal diet is done gradually and when the dentist says so.',
          },
          {
            question: 'How long do I wear the temporary?',
            answer:
              'As long as osseointegration takes — around three months in the lower jaw and four to six in the upper — plus the time to make the definitive prosthesis. In full-arch cases it usually runs a little longer, because the gum needs to settle before the final measurements are taken.',
          },
        ],
      },
      {
        slug: 'injerto-oseo',
        metaTitle: 'Bone Grafting and Maxillary Sinus Lift',
        metaDescription:
          'When a bone graft is needed before a dental implant, which types exist, what a sinus lift involves, how long it takes and what the risks are.',
        shortLabel: 'Bone grafting',
        cardSummary:
          'When there is not enough bone: graft types, sinus lift, timelines and risks.',
        h1: 'Bone grafting and maxillary sinus lift',
        standfirst:
          'When bone is missing where the implant should go, there are techniques to replace it. They add months and another surgery to the treatment, so it is worth understanding what is done, what it achieves, and what the alternatives are.',
        procedureName: 'Dental bone graft and maxillary sinus lift',
        keywords: [
          'bone graft dental implant Dominican Republic',
          'maxillary sinus lift',
          'guided bone regeneration',
          'not enough bone for dental implants',
          'jaw bone resorption',
        ],
        sections: [
          {
            id: 'por-que-falta',
            heading: 'Why bone goes missing',
            body: [
              'Alveolar bone exists to hold roots. When a root disappears, the bone that surrounded it loses its purpose and begins to resorb: fastest in the first year after extraction, and then more slowly for the rest of your life. Nobody does anything wrong to cause it; it simply happens.',
              'Other causes stack on top: periodontal disease that had already destroyed bone before the tooth was lost, a long-standing infection, trauma, or the constant pressure of a full denture resting on the gum for years.',
              'In the upper back jaw there is an anatomical factor as well. The maxillary sinus is an air cavity above the molars, and over time it tends to pneumatise — to expand downwards into the bone as it becomes free. That is why this region needs an additional procedure more often than any other.',
            ],
          },
          {
            id: 'tipos',
            heading: 'The types of graft',
            body: [
              'A graft is not a block that gets screwed in. In most cases it is a particulate material acting as a scaffold for your own bone to grow through, protected by a membrane. The material varies:',
            ],
            points: [
              {
                term: 'Autograft',
                detail:
                  "The patient's own bone, harvested from elsewhere in the mouth. It behaves best biologically, but it needs a second surgical site.",
              },
              {
                term: 'Allograft',
                detail:
                  'Processed, sterilised human bank bone. It avoids the second surgery and is extensively documented.',
              },
              {
                term: 'Xenograft',
                detail:
                  'Of animal origin, usually bovine, treated until only the mineral matrix remains. It resorbs very slowly, which helps hold the volume long term.',
              },
              {
                term: 'Alloplast',
                detail:
                  'Synthetic material such as calcium phosphates. No biological origin, useful for patients who prefer to avoid one on principle or belief.',
              },
              {
                term: 'Guided bone regeneration',
                detail:
                  'Not a material but a technique: covering the graft with a membrane so that soft tissue, which grows faster, cannot invade the space before bone does.',
              },
            ],
          },
          {
            id: 'elevacion-de-seno',
            heading: 'The sinus lift, specifically',
            body: [
              'When the height of bone beneath the maxillary sinus is insufficient for an implant, the membrane lining the sinus floor is lifted and the space gained is filled with graft material. There are two approaches.',
              'The crestal approach works through the implant site itself, pushing the sinus floor up by a few millimetres. It is minimally invasive and suits small deficits. The lateral approach opens a window in the outer wall of the upper jaw, allows far more height to be gained, and is a more substantial operation.',
              'Depending on how much bone remains, the implant goes in at the same time or waits for the graft to consolidate. That decision also depends on the stability achieved, and it too is made in theatre.',
            ],
          },
          {
            id: 'plazos',
            heading: 'How long it takes',
            body: [
              'A graft has to consolidate before it can carry an implant, and that consolidation is measured in months, not weeks. The usual range runs from four to nine months depending on technique, material and how much volume was replaced; only then does the implant osseointegration period begin.',
              'Added together, a case with an extensive graft can run nine to eighteen months from the first surgery to the definitive crown. That is why the first visit puts so much weight on whether a graft will be needed: it changes the calendar more than any other variable.',
              'When the graft is small and done at the same time as the implant, it adds no appreciable time. Both extremes exist, which is why there is no single figure.',
            ],
          },
          {
            id: 'riesgos-y-alternativas',
            heading: 'Risks, and when it can be avoided',
            body: [
              'The risks specific to grafting are infection of the material, exposure through the gum, more resorption than expected so the final volume falls short, and — in a sinus lift — perforation of the sinus membrane or subsequent sinusitis. A perforation noticed during surgery is repaired and generally does not change the outcome; an unnoticed one can.',
              'It is also worth knowing that grafting is not always compulsory. There are alternatives that sometimes solve the same problem without replacing bone: shorter or narrower implants where the anatomy allows, tilted implants that seek out the bone that is there, or rethinking the prosthesis so it rests elsewhere. Which one applies depends entirely on what the CT scan shows.',
              'And there are situations beyond what a general implant practice should treat, which are referred to maxillofacial surgery. Saying so in good time is part of the job.',
            ],
          },
        ],
        faq: [
          {
            question: 'Does a graft hurt more than the implant?',
            answer:
              'A small regeneration done alongside the implant barely changes the recovery. A lateral sinus lift or a block graft does mean more swelling, more days of discomfort and sometimes bruising. They are done under local anaesthetic and the pain relief is matched to the scale of the surgery.',
          },
          {
            question: 'Can a graft fail?',
            answer:
              'Yes. It can become infected, become exposed, or resorb more than expected and not reach the volume needed. When that happens the site is generally cleaned, allowed to heal, and the plan is revisited: repeat the graft, change technique, or change the prosthetic plan. It usually does not mean the implant is impossible, only that it will arrive later.',
          },
          {
            question: 'Can I wear my denture while the graft heals?',
            answer:
              'Almost never in the first weeks, and afterwards only if it is adjusted so it does not rest on the grafted area. Pressure from a removable prosthesis on a consolidating graft is one of the avoidable causes of failure. If you depend on your denture for work, say so during planning: there are solutions, but they have to be arranged in advance.',
          },
        ],
      },
      {
        slug: 'precio',
        metaTitle: 'Dental Implant Cost in Santiago, DR',
        metaDescription:
          'What a dental implant quote actually depends on, which items it should include, how to compare two quotes, and why no price list appears here.',
        shortLabel: 'Cost',
        cardSummary:
          'What goes into an implant quote, and how to compare two quotes properly.',
        h1: 'What determines the cost of dental implants',
        standfirst:
          'There is no price list here, and the explanation of why not is probably more useful than the figure you came for. This page gives you the questions that let you read a quote properly.',
        // The page is ABOUT dental implants; it happens to cover their cost.
        // Typing a quotation as a MedicalProcedure would be false, and `about`
        // is what a crawler reads to decide what entity this page discusses.
        procedureName: 'Dental implant',
        keywords: [
          'dental implants cost Santiago',
          'how much do dental implants cost Dominican Republic',
          'dental implant quote',
          'All-on-4 cost',
        ],
        sections: [
          {
            id: 'por-que-no-hay-cifra',
            heading: 'Why we do not publish a figure',
            body: [
              'A published price for "an implant" can only be one of two things: the price of the screw, which is not what you are going to receive, or a headline price to which the missing items are added later. Neither helps you decide.',
              'What is billed in implant treatment is a set of acts: diagnostic imaging, preparatory work where it is needed, the surgery, the components, the temporary prosthesis where there is one, the definitive prosthesis, and the reviews. Two people arriving with the same sentence can need very different sets.',
              'So the honest number comes after the assessment, in writing and itemised; and any figure given over the phone, before you have been seen, is an estimate that can move a long way.',
            ],
          },
          {
            id: 'que-conceptos',
            heading: 'What a quote should include',
            body: [
              'When you receive yours, check that these appear, even if some of them are at zero:',
            ],
            points: [
              {
                term: 'Assessment and imaging',
                detail: 'X-ray and, where needed, a three-dimensional CT scan.',
              },
              {
                term: 'Preparatory treatment',
                detail:
                  'Extractions, periodontal treatment, root canals, or anything else that has to be resolved before surgery.',
              },
              {
                term: 'Bone regeneration',
                detail:
                  'Graft or sinus lift, with the material and membrane specified, if they are planned.',
              },
              {
                term: 'Surgery and components',
                detail:
                  'The implant, the healing abutment and the definitive abutment. They are separate pieces and they are billed separately.',
              },
              {
                term: 'Temporary prosthesis',
                detail:
                  'If the plan includes one. It is the line most often missing from a quote that looked cheap.',
              },
              {
                term: 'Definitive prosthesis',
                detail: 'With the material named: zirconia and porcelain-fused-to-metal are not the same thing.',
              },
              {
                term: 'Reviews and follow-up',
                detail: 'How many are included, and from which one they are billed separately.',
              },
            ],
          },
          {
            id: 'comparar',
            heading: 'How to compare two quotes',
            body: [
              'Comparing totals is worthless if the two quotes do not describe the same treatment. These are the questions that make two documents comparable, and they are perfectly reasonable to put to any practice:',
              'Does it include the definitive prosthesis or only the surgery? Exactly how many implants? What material is the crown? Is bone regeneration planned, or will it be quoted later if it turns out to be needed? How many reviews are included? Who performs the surgery, and who makes the prosthesis? What happens, and who bears what, if an implant fails to integrate?',
              'That last one reveals the most difference, and the answer should be explicit and in writing, not a verbal assurance.',
            ],
            note: 'A quote that is markedly cheaper than the rest is almost always describing a different treatment. Before accepting it, check which items are not on it.',
          },
          {
            id: 'seguros-y-pago',
            heading: 'Insurance and payment',
            body: [
              'The practice works with several dental insurance plans. Implant cover varies widely between policies, and in many cases only part of the treatment or only certain stages are covered, so the only way to know is to verify it against your specific policy details before starting.',
              'If you send that information when you request an appointment, the check can be done before you arrive, and the quote you receive will already reflect what is left for you to pay.',
            ],
          },
        ],
        faq: [
          {
            question: 'Why will you not give me a price over the phone?',
            answer:
              'Because the price depends on how many implants, on whether the bone needs preparing, and on the type of prosthesis — and none of those three can be known without examining you and taking an x-ray. A blind figure either falls short and has to be corrected later, or is inflated to be safe. We would rather do the assessment first.',
          },
          {
            question: 'Can the quote change during treatment?',
            answer:
              'It can, and in long treatments it sometimes does: a root turns out to be in worse condition than the x-ray showed, or the bone forces a change of plan. What should not happen is that you find out on the invoice. Any change is explained and approved before it is carried out.',
          },
          {
            question: 'Are implants cheaper in the Dominican Republic?',
            answer:
              'For patients coming from higher-cost healthcare markets the difference is usually real. But the cost of implant treatment includes the travel, the stay and, above all, the follow-up over months. That part is covered on the dental tourism page, because deciding on the price of the surgery alone is how these treatments go wrong.',
          },
        ],
      },
      {
        slug: 'turismo-dental-santiago',
        metaTitle: 'Dental Tourism in Santiago: How to Plan It',
        metaDescription:
          'How to organise implant treatment while travelling to Santiago, Dominican Republic: how many trips, the gaps between stages, languages, and what to ask.',
        shortLabel: 'Dental tourism',
        cardSummary:
          'Treatment while travelling: how many trips, what timelines, and what to ask before booking.',
        h1: 'Dental tourism in Santiago de los Caballeros',
        standfirst:
          'Implant treatment can be done while travelling, and many people do it well. What decides the outcome is not the surgery, which takes a morning, but the follow-up, which takes months. This page is about that part.',
        procedureName: 'Dental implant treatment for international patients',
        keywords: [
          'dental tourism Dominican Republic',
          'dental tourism Santiago de los Caballeros',
          'dental implants abroad Dominican Republic',
          'English speaking dentist Santiago',
        ],
        sections: [
          {
            id: 'el-problema-real',
            heading: 'The real problem with dental tourism',
            body: [
              'Implant surgery is a day. Osseointegration is months, the definitive prosthesis comes afterwards, and maintenance never ends. Treatment planned around a flight rather than around that sequence is the treatment that ends badly.',
              'The problems that show up are rarely surgical. They are problems of continuity: nobody checks the implant at three months, a temporary comes loose two thousand kilometres from the practice that fitted it, or the dentist back home receives a patient with no report and no idea which components are inside them.',
              'All of that is avoidable, but it is avoided before the flight is booked, not after.',
            ],
          },
          {
            id: 'como-se-organiza',
            heading: 'How it is realistically organised',
            body: [
              'Implant treatment for someone travelling is normally structured as two stays, with the biological wait between them and remote contact holding the gap together.',
            ],
            steps: [
              {
                title: 'Before you travel',
                desc: 'Whatever you can send is reviewed remotely: recent x-rays, reports, a medication list and your history. That gives an orientation on the case — not a diagnosis — and narrows down what is likely to be needed.',
              },
              {
                title: 'First stay',
                desc: 'Examination in person, imaging and the definitive quote on day one. Surgery in the days that follow, with room for the post-operative check and suture removal before you fly. Plan for several days, not forty-eight hours.',
              },
              {
                title: 'The gap',
                desc: 'The osseointegration months pass at home. Contact points are agreed, along with what to do if something moves or hurts, and you leave with a written record of which implants were placed so that any dentist can treat you.',
              },
              {
                title: 'Second stay',
                desc: 'Measurements, try-in and fitting of the definitive prosthesis. It needs several days, because between the impression and the fitting there is laboratory work and at least one intermediate try-in.',
              },
            ],
            note: 'Be sceptical of any plan promising the complete treatment, definitive prosthesis included, within a single week. Osseointegration cannot be compressed, and a definitive prosthesis fitted on an implant that has not yet integrated is not a shortcut: it is a risk.',
          },
          {
            id: 'que-traer',
            heading: 'What to bring, and what to ask',
            body: [
              "Bring any recent x-rays or CT scans you have, even if they need repeating; they are useful as a reference. Bring a complete list of your medication with doses, and say in particular if you take anticoagulants, bisphosphonates or any antiresorptive drug. Bring reports for any relevant condition, and your regular dentist's contact details.",
              'And ask before you book: who performs the surgery, how many stays the plan involves and how many days each, what you are given in writing when you leave, what happens if a complication arises once you are home, and who you communicate with between trips.',
            ],
          },
          {
            id: 'idiomas-y-consulta',
            heading: 'Languages, and where the practice is',
            body: [
              'The practice sees patients in Spanish and in English, and this site is published in full in both. For a treatment where informed consent, post-operative instructions and warning signs all have to be understood without ambiguity, being able to speak your own language is not a courtesy detail.',
              'Orthoprotesis Dental Clinic is at Plaza Las Ramblas, Module 101, in Santiago de los Caballeros, open Monday to Friday. Santiago has its own international airport, Cibao, which avoids the road transfer from Santo Domingo or Puerto Plata.',
              'The person who sees you at the first visit is the one who carries out the treatment. In a case split across two trips and several months, that continuity is exactly what usually fails.',
            ],
          },
          {
            id: 'si-surge-algo',
            heading: 'If something happens once you are home',
            body: [
              'Before you fly back you should leave with three things: a report listing the implants placed and their references, written instructions on what is normal and what is not, and a direct line to the practice.',
              'With those, most incidents are resolved remotely or can be handled by a local dentist with the information in front of them. A loose temporary or a screw that has worked free is a minor problem when whoever sees it knows exactly what they are looking at, and a serious one when they do not.',
              'It is also worth identifying a dentist near home before you travel, rather than on the day you need one.',
            ],
          },
        ],
        faq: [
          {
            question: 'How many trips does it take?',
            answer:
              'Usually two: one for the assessment and surgery, and another, months later, for the definitive prosthesis. Cases involving a bone graft may need a third, because the graft consolidates before the implant goes in. The number is confirmed with your treatment plan, not before you have been seen.',
          },
          {
            question: 'How many days should I allow for each trip?',
            answer:
              'On the first stay, allow room for the examination, the surgery and at least one follow-up before flying. On the second, for the measurements, the laboratory work and the try-in before fitting. The exact days depend on the case, and we tell you before you buy tickets.',
          },
          {
            question: 'Can I start the process remotely?',
            answer:
              'You can send us your x-rays, reports and medication through the contact form and we will give you an orientation on the case. It is not a diagnosis: until there has been an examination and our own imaging there is no firm plan and no firm quote. It is there to tell you whether the trip is worth organising.',
          },
          {
            question: 'Do you see patients in English?',
            answer:
              'Yes. The practice works in Spanish and in English, and your informed consent and post-operative instructions are given to you in the language you communicate in.',
          },
        ],
      },
    ],
  },
};

/** The pillar and every spoke for one language, in reading order. */
export function implantClusterPages(lang: Language): ImplantPageContent[] {
  const cluster = implantCluster[lang];
  return [cluster.pillar, ...cluster.spokes];
}

/** Resolves a URL segment to its spoke, or `undefined` if it is not one. */
export function getImplantSpoke(
  lang: Language,
  slug: string,
): ImplantSpokeContent | undefined {
  return implantCluster[lang].spokes.find((spoke) => spoke.slug === slug);
}
