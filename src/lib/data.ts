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
      { label: "Corona", desc: "La parte visible, hecha a medida para imitar tu diente natural." },
      { label: "Pilar", desc: "Conecta la corona con el implante de forma segura." },
      { label: "Implante de titanio", desc: "Un poste de titanio biocompatible que reemplaza la raíz." },
      { label: "Hueso", desc: "El implante se integra con el hueso para dar firmeza (osteointegración)." },
    ],
    stepsTitle: "El proceso, paso a paso",
    steps: [
      { title: "Evaluación", desc: "Revisamos tu salud bucal y planificamos tu tratamiento contigo." },
      { title: "Colocación", desc: "Se coloca el implante de titanio en el hueso con cuidado." },
      { title: "Corona definitiva", desc: "Tras la cicatrización, se coloca tu corona personalizada." },
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
      messageMax: "El mensaje no debe exceder los 2000 caracteres.",
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
      messageMax: "Message must not exceed 2000 characters.",
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
