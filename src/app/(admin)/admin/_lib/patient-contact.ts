/* ============================================================================
   CALLING A PATIENT BACK — from whatever they typed into the form
   ----------------------------------------------------------------------------
   The queue exists so somebody rings people back, and on a phone that used to
   take about six taps per patient: the number was hidden below `lg`, inside a
   dialog, as plain text. This turns the stored number into the two links the
   front desk actually uses, a call and a WhatsApp chat, so each row can carry
   both at every width.

   The phone column is free text — "(829) 123-4567", "8291234567",
   "+34 612 345 678", "581-7059" — so the number is normalised rather than
   trusted:

     - Written with a leading `+` or `00`: already international, kept as is.
     - Ten digits: the North American numbering plan, which is the clinic's own
       (809, 829, 849 — and a visiting patient's US or Canadian number has the
       same shape). Prefixed with country code 1.
     - Eleven digits beginning with 1: the same, with the 1 already there.
     - Any other number of ten digits or more: taken as international without
       its `+`.
     - Fewer than ten: a local number missing its area code. It is dialled as
       typed — prefixing `+` would turn "5817059" into a number in no country —
       and offered no WhatsApp link, because wa.me only accepts full
       international numbers and would open a chat with a stranger or nobody.

   Pure and dependency-free: the view models in queries.ts compute these on the
   server, and the tables only render the result.
   ========================================================================== */

export interface PatientContactLinks {
  /** A `tel:` URI, or null when there is no number to call. */
  phoneHref: string | null;
  /** A wa.me click-to-chat URL, or null when the number cannot be resolved to
   *  a full international one. */
  whatsappHref: string | null;
}

const NONE: PatientContactLinks = { phoneHref: null, whatsappHref: null };

export function patientContactLinks(phone: string | null | undefined): PatientContactLinks {
  if (!phone) return NONE;

  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return NONE;

  const writtenInternational = trimmed.startsWith('+') || trimmed.startsWith('00');
  if (trimmed.startsWith('00')) digits = digits.replace(/^00/, '');

  let international: string | null = null;
  if (writtenInternational) international = digits;
  else if (digits.length === 10) international = `1${digits}`;
  else if (digits.length === 11 && digits.startsWith('1')) international = digits;
  else if (digits.length >= 10) international = digits;

  if (!international) {
    return { phoneHref: `tel:${digits}`, whatsappHref: null };
  }

  return {
    phoneHref: `tel:+${international}`,
    whatsappHref: international.length >= 10 ? `https://wa.me/${international}` : null,
  };
}
