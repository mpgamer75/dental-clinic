'use server';

import type { ContactFormData, AppointmentFormData, TestimonialFormSubmitData, Language } from '@/lib/types';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { actionMessages } from '@/lib/data';

const createContactFormSchema = (lang: Language) => {
  const zodMsgs = actionMessages[lang].zod;
  return z.object({
    name: z.string().min(2, { message: zodMsgs.nameMin }),
    email: z.string().email({ message: zodMsgs.emailInvalid }),
    phone: z.string().optional().refine(value => !value || /^[0-9+\s()-]*$/.test(value), {
      message: zodMsgs.phoneInvalid
    }),
    message: z.string().min(10, { message: zodMsgs.messageMin }),
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

  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        ...validatedFields.data,
      });

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
    name: z.string().min(2, { message: zodMsgs.nameMin }),
    email: z.string().email({ message: zodMsgs.emailInvalid }),
    phone: z.string().optional().refine(value => !value || /^[0-9+\s()-]*$/.test(value), {
      message: zodMsgs.phoneInvalid
    }),
    service_type: z.string().min(1, { message: zodMsgs.serviceTypeRequired }),
    reason: z.string().min(10, { message: zodMsgs.reasonMin }).max(500, { message: zodMsgs.reasonMax }),
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
  
  const dataToValidate = {
    ...formData,
    service_type: formData.serviceType,
  };

  const validatedFields = appointmentFormSchema.safeParse(dataToValidate);
  const messages = actionMessages[lang];

  if (!validatedFields.success) {
    const errorFields = validatedFields.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string[]> = {};
    
    if (errorFields.service_type) {
      fieldErrors.serviceType = errorFields.service_type;
    }
    
    Object.entries(errorFields).forEach(([key, value]) => {
      if (key !== 'service_type') {
        fieldErrors[key] = value;
      }
    });

    return {
      success: false,
      errors: fieldErrors,
      message: messages.formCorrection
    };
  }
  
  const supabaseData: AppointmentSupabaseInsertData = {
      name: validatedFields.data.name,
      email: validatedFields.data.email,
      phone: validatedFields.data.phone,
      service_type: validatedFields.data.service_type,
      reason: validatedFields.data.reason,
      is_urgent: validatedFields.data.is_urgent,
  };

  try {
    const { error } = await supabase
      .from('appointments')
      .insert(supabaseData);

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
    name: z.string().min(2, { message: zodMsgs.nameMin }),
    quote: z.string().min(15, { message: zodMsgs.quoteMin }).max(500, { message: zodMsgs.quoteMax }),
    location: z.string().optional(),
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

  try {
    // Insertion directe sans modération AI
    // Le statut sera 'pending_approval' par défaut pour modération manuelle
    const { error } = await supabase
      .from('testimonials')
      .insert({
        ...validatedFields.data,
        status: 'pending_approval'
      });

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