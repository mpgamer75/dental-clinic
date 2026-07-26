'use server';

import type { ContactFormData, AppointmentFormData, TestimonialFormSubmitData, Language } from '@/lib/types';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { actionMessages } from '@/lib/data';
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
    phone: z.string().optional().refine(value => {
      if (!value || value.trim() === '') return true;
      const digitsOnly = value.replace(/[^0-9]/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 15 && /^[0-9+\s()-]*$/.test(value);
    }, {
      message: zodMsgs.phoneInvalid
    }),
    service_type: z.string()
      .min(1, { message: zodMsgs.serviceTypeRequired })
      .max(100, { message: zodMsgs.serviceTypeMax }),
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
  phone?: string;
  service_type: string;
  reason: string;
  is_urgent: boolean;
}

export async function submitAppointmentForm(formData: Omit<AppointmentFormData, 'id' | 'submitted_at' | 'status' | 'serviceType'> & { serviceType: string }, lang: Language) {
  const appointmentFormSchema = createAppointmentFormSchema(lang);
  
  // The form is camelCase, the table is snake_case. Every renamed field must be
  // mapped here.
  //
  // `is_urgent` was missing from this map. The client sends `isUrgent`, the
  // schema declares `is_urgent: z.boolean().default(false)`, and Zod's default
  // silently filled the absent key — so EVERY appointment was stored with
  // is_urgent = false. The patient saw the toggle turn red and got a success
  // toast; the clinic's admin table never showed a single urgent request. For
  // a dental practice that is the entire triage signal, lost without an error.
  const dataToValidate = {
    ...formData,
    service_type: formData.serviceType,
    is_urgent: formData.isUrgent,
  };

  const validatedFields = appointmentFormSchema.safeParse(dataToValidate);
  const messages = actionMessages[lang];

  if (!validatedFields.success) {
    const errorFields = validatedFields.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string[]> = {};

    // Map snake_case validation keys back to the form's field names, or
    // react-hook-form's setError silently targets a field that doesn't exist.
    const TO_FORM_FIELD: Record<string, string> = {
      service_type: 'serviceType',
      is_urgent: 'isUrgent',
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
  // Validation supplémentaire
  if (!validateEmail(validatedFields.data.email)) {
    return {
      success: false,
      message: lang === 'es'
        ? 'Por favor, use una dirección de email válida.'
        : 'Please use a valid email address.',
    };
  }

  if (validatedFields.data.phone && !validatePhone(validatedFields.data.phone)) {
    return {
      success: false,
      message: lang === 'es'
        ? 'Por favor, proporcione un número de teléfono válido.'
        : 'Please provide a valid phone number.',
    };
  }

  try {
    // Sanitize les données
    const sanitizedData: AppointmentSupabaseInsertData = {
      name: sanitizeText(validatedFields.data.name),
      email: validatedFields.data.email.toLowerCase().trim(),
      phone: validatedFields.data.phone,
      service_type: sanitizeText(validatedFields.data.service_type),
      reason: sanitizeText(validatedFields.data.reason),
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