import { clinicContact, contactDetails } from '@/lib/data';
import type { Language } from '@/lib/types';

/* ============================================================================
   CONTACT LINKS — built once, used by every call and WhatsApp control
   ----------------------------------------------------------------------------
   Eight components used to build their own `tel:` link by stripping the
   display number to digits, which produced `tel:8095817059`: dialable inside
   the North American numbering plan and nowhere else. A visitor reading the
   dental-tourism page from Madrid tapped "Llamar" and reached nothing. The
   links below are built from the E.164 number, so they dial from any phone in
   any country, and there is one place to change them.

   No `server-only`: the navbar and the mobile menu are client components and
   need these too. Nothing here is secret.
   ========================================================================== */

/** Dials the clinic from any country. */
export const TEL_HREF = `tel:${clinicContact.phoneE164}`;

/** Opens a WhatsApp chat with the clinic, first message pre-filled (and
 *  editable by the patient before it is sent). */
export function whatsappHref(lang: Language): string {
  const text = encodeURIComponent(clinicContact.whatsappMessage[lang]);
  return `https://wa.me/${clinicContact.whatsappNumber}?text=${text}`;
}

/** Visible labels and accessible names for the two controls, number filled in. */
export function contactLinkLabels(lang: Language) {
  const phone = contactDetails.phone[lang];
  const labels = clinicContact.labels[lang];
  return {
    phone,
    call: labels.call,
    whatsapp: labels.whatsapp,
    callAria: labels.callAria.replace('{{phone}}', phone),
    whatsappAria: labels.whatsappAria.replace('{{phone}}', phone),
  };
}
