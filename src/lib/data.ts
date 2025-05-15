import type { ContactDetails, ServiceData, TestimonialData, FAQData, NavItemData, BaseMetadata, FormTranslations, ActionMessages, GeneralUIData, AdminNavItemData, CarouselImageItem } from './types';
import { Home, ShieldCheck, MessageCircleQuestion, BadgeInfo, Phone, CalendarDays, LayoutDashboard, MessagesSquare, ShieldAlert, Settings } from 'lucide-react'; 

export const navItems: NavItemData = {
  es: [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Servicios', href: '/#servicios', icon: ShieldCheck },
    { label: 'Testimonios', href: '/#testimonios', icon: MessageCircleQuestion },
    { label: 'Preguntas Frecuentes', href: '/#preguntas-frecuentes', icon: BadgeInfo },
    { label: 'Contacto', href: '/#contacto', icon: Phone },
    { label: 'Agendar Cita', href: '/agendar-cita', icon: CalendarDays },
  ],
  en: [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Services', href: '/#servicios', icon: ShieldCheck }, 
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

export const services: ServiceData = {
  es: [
    {
      iconName: 'Users', // Represents multiple teeth or dentures
      title: 'Prótesis Dentales',
      description: 'Restauramos la función y estética de tu sonrisa con prótesis fijas y removibles de alta calidad. Esto incluye coronas individuales para proteger dientes dañados, puentes para reemplazar uno o más dientes ausentes utilizando dientes adyacentes como soporte, y dentaduras completas o parciales para una restauración extensa. Cada solución es personalizada para asegurar comodidad, durabilidad y una apariencia natural.',
    },
    {
      iconName: 'Anchor', // Represents stability of implants
      title: 'Implantes Dentales',
      description: 'Los implantes dentales son la solución más avanzada y duradera para reemplazar dientes perdidos. Consisten en un tornillo de titanio biocompatible que se integra con el hueso maxilar, actuando como una raíz artificial. Sobre este implante se coloca una corona de porcelana o zirconio, indistinguible de un diente natural. Los implantes ofrecen una base estable, previenen la pérdida ósea, mejoran la capacidad de masticación y restauran la estética de manera excepcional.',
    },
    {
      iconName: 'Smile', // Represents a beautiful, aligned smile
      title: 'Ortodoncia',
      description: 'Corregimos dientes desalineados y problemas de mordida (maloclusiones) para mejorar tanto la estética de tu sonrisa como tu salud oral general. Ofrecemos opciones como brackets metálicos tradicionales, brackets cerámicos más discretos, y los modernos alineadores transparentes (ortodoncia invisible). Los tratamientos son adaptados para niños, adolescentes y adultos, buscando una sonrisa alineada, funcional y saludable.',
    },
    {
      // iconName: 'ShieldCheck', Using ToothIcon directly in component for now for dental-specific imagery
      iconName: 'ShieldCheck', 
      title: 'Limpieza Dental Profesional',
      description: 'La profilaxis dental es fundamental para mantener una boca sana. Este procedimiento elimina la placa bacteriana y el sarro (cálculo dental) que el cepillado diario no puede remover, especialmente en zonas de difícil acceso. Ayuda a prevenir caries, gingivitis, periodontitis y mal aliento. Recomendamos una limpieza cada seis meses para una sonrisa radiante y encías saludables.',
    },
    {
      iconName: 'Sparkles', // Represents whitening/brightness
      title: 'Blanqueamiento Dental',
      description: 'Devuelve el brillo y un tono más blanco a tu sonrisa con nuestros tratamientos de blanqueamiento dental seguros y efectivos. Utilizamos geles blanqueadores de última generación, aplicados profesionalmente en la clínica para resultados rápidos y notables, o mediante kits personalizados para usar en casa bajo supervisión odontológica. Elimina manchas y rejuvenece tu apariencia.',
    },
    {
      // iconName: 'ShieldCheck', // Re-using for general protection/repair
      iconName: 'ShieldCheck', 
      title: 'Empastes (Restauraciones)',
      description: 'Reparamos dientes dañados por caries, devolviéndoles su forma, función e integridad. Tras eliminar el tejido carioso, rellenamos la cavidad con resinas compuestas del color del diente (estéticas) que se mimetizan perfectamente con tu sonrisa. Este tratamiento detiene el avance de la caries y alivia la sensibilidad dental.',
    },
    {
      iconName: 'HeartPulse', // Represents saving a tooth/health
      title: 'Endodoncia (Tratamiento de Canal)',
      description: 'Este procedimiento salva un diente cuya pulpa (nervio) está infectada o inflamada debido a caries profundas o traumatismos. Se elimina la pulpa dañada, se limpian y desinfectan los conductos radiculares, y luego se sellan herméticamente. La endodoncia alivia el dolor intenso y permite conservar el diente natural, evitando su extracción.',
    },
    {
      iconName: 'Bone', // Represents examination of teeth/bone structure
      title: 'Consulta General/Revisión',
      description: 'Las consultas generales y revisiones periódicas son la base de una buena salud bucodental. El Dr. Francis Valerio realizará un examen completo de tus dientes, encías y tejidos orales, utilizando radiografías digitales si es necesario, para detectar problemas en etapas tempranas. Se discutirá cualquier hallazgo y se elaborará un plan de tratamiento personalizado si es preciso.',
    }
  ],
  en: [
    {
      iconName: 'Users',
      title: 'Dental Prosthetics',
      description: 'We restore the function and aesthetics of your smile with high-quality fixed and removable prosthetics. This includes individual crowns to protect damaged teeth, bridges to replace one or more missing teeth using adjacent teeth as support, and full or partial dentures for extensive restoration. Each solution is customized to ensure comfort, durability, and a natural appearance.',
    },
    {
      iconName: 'Anchor',
      title: 'Dental Implants',
      description: 'Dental implants are the most advanced and durable solution for replacing missing teeth. They consist of a biocompatible titanium screw that integrates with the jawbone, acting as an artificial root. A porcelain or zirconia crown, indistinguishable from a natural tooth, is placed on this implant. Implants offer a stable base, prevent bone loss, improve chewing ability, and exceptionally restore aesthetics.',
    },
    {
      iconName: 'Smile', 
      title: 'Orthodontics',
      description: 'We correct misaligned teeth and bite problems (malocclusions) to improve both the aesthetics of your smile and your overall oral health. We offer options such as traditional metal braces, more discreet ceramic braces, and modern clear aligners (invisible orthodontics). Treatments are tailored for children, adolescents, and adults, aiming for a straight, functional, and healthy smile.',
    },
    {
      iconName: 'ShieldCheck',
      title: 'Professional Dental Cleaning',
      description: 'Dental prophylaxis is essential for maintaining a healthy mouth. This procedure removes bacterial plaque and tartar (dental calculus) that daily brushing cannot, especially in hard-to-reach areas. It helps prevent cavities, gingivitis, periodontitis, and bad breath. We recommend a cleaning every six months for a radiant smile and healthy gums.',
    },
    {
      iconName: 'Sparkles',
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
      iconName: 'Bone', 
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
      phoneLabel: "Teléfono (Opcional)",
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
      phoneLabel: "Phone (Optional)",
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
    zod: {
      nameMin: "El nombre debe tener al menos 2 caracteres.",
      emailInvalid: "Por favor, ingrese un correo electrónico válido.",
      phoneInvalid: "Número de teléfono inválido.",
      messageMin: "El mensaje debe tener al menos 10 caracteres.",
      serviceTypeRequired: "Por favor, seleccione un tipo de servicio.",
      reasonMin: "El motivo debe tener al menos 10 caracteres.",
      reasonMax: "El motivo no debe exceder los 500 caracteres.",
      quoteMin: "El testimonio debe tener al menos 15 caracteres.",
      quoteMax: "El testimonio no debe exceder los 500 caracteres.",
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
    zod: {
      nameMin: "Name must be at least 2 characters long.",
      emailInvalid: "Please enter a valid email address.",
      phoneInvalid: "Invalid phone number.",
      messageMin: "Message must be at least 10 characters long.",
      serviceTypeRequired: "Please select a service type.",
      reasonMin: "The reason must be at least 10 characters long.",
      reasonMax: "The reason must not exceed 500 characters.",
      quoteMin: "Testimonial must be at least 15 characters long.",
      quoteMax: "Testimonial must not exceed 500 characters.",
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
    es: `https://maps.google.com/maps?q=${encodeURIComponent('Plaza Las Ramblas, Módulo 101, Santiago de los Caballeros, República Dominicana')}&output=embed`,
    en: `https://maps.google.com/maps?q=${encodeURIComponent('Plaza Las Ramblas, Module 101, Santiago de los Caballeros, Dominican Republic')}&output=embed`
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

export const visitUsCarouselImages: CarouselImageItem[] = [
  { src: "https://picsum.photos/seed/plaza-ramblas1/1200/800", altEs: "Plaza Las Ramblas, Santiago de los Caballeros", altEn: "Plaza Las Ramblas, Santiago de los Caballeros", hint: "Plaza Ramblas" },
  { src: "https://picsum.photos/seed/plaza-ramblas2/1200/800", altEs: "Interior o exterior de Plaza Las Ramblas, Santiago de los Caballeros", altEn: "Interior or exterior of Plaza Las Ramblas, Santiago de los Caballeros", hint: "Plaza facade" },
  { src: "https://picsum.photos/seed/clinic-exterior/1200/800", altEs: "Exterior de la clínica dental en Santiago de los Caballeros", altEn: "Dental clinic exterior in Santiago de los Caballeros", hint: "clinic exterior" },
  { src: "https://picsum.photos/seed/santiago-cityscape/1200/800", altEs: "Vista de Santiago de los Caballeros", altEn: "View of Santiago de los Caballeros", hint: "Santiago cityscape" },
];
