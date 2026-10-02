import { services } from '@/lib/data';
import type { Language, ServiceKey } from '@/lib/types';

/* ============================================================================
   SERVICE CATALOG — one identity per treatment, whatever the label says
   ----------------------------------------------------------------------------
   `appointments.service_type` is free text, and it used to store whichever
   title the patient happened to be looking at. An English visitor booking an
   implant wrote "Dental Implants"; a Spanish one wrote "Implantes Dentales"; the
   dashboard grouped by the raw string and drew them as two treatments. The
   server also accepted any string up to 100 characters, so a direct POST could
   put anything in the column.

   The rules now:

     - The form submits a KEY (`implants`), never a label.
     - The server resolves whatever arrives — a key, a current title in either
       language, or any spelling the column has held historically — through
       `serviceKeyOf`, and refuses what it cannot resolve.
     - It STORES the canonical Spanish title, so the column stays readable to a
       person querying it directly and consistent with the rows already there.
     - Readers (the admin tables and charts) pass stored values back through
       `serviceLabelEs`, which folds the historical spellings onto the current
       title, so the history and the new rows land in the same bucket.

   No `server-only`: the appointment form is a client component and builds its
   options from `serviceOptions`.
   ========================================================================== */

/**
 * Every title the column has held before the sentence-case rewrite, mapped to
 * its key. Append here whenever a title in `services` changes — do not edit an
 * entry, because rows with the old spelling are still in the table.
 */
const HISTORICAL_TITLES: Record<ServiceKey, readonly string[]> = {
  implants: ['Implantes Dentales', 'Dental Implants'],
  prosthetics: ['Prótesis Dentales', 'Dental Prosthetics'],
  orthodontics: ['Ortodoncia', 'Orthodontics'],
  checkup: ['Consulta General/Revisión', 'General Consultation/Check-up'],
  cleaning: ['Limpieza Dental Profesional', 'Professional Dental Cleaning'],
  fillings: ['Empastes (Restauraciones)', 'Fillings (Restorations)'],
  endodontics: ['Endodoncia (Tratamiento de Canal)', 'Endodontics (Root Canal Treatment)'],
  whitening: ['Blanqueamiento Dental', 'Teeth Whitening'],
};

/** Case-, spacing- and composition-insensitive, so "Consulta general / revisión"
 *  and "Consulta General/Revisión" are the same spelling. */
function fold(value: string): string {
  return value.normalize('NFC').toLowerCase().replace(/\s+/g, '');
}

const KEY_BY_SPELLING = new Map<string, ServiceKey>();
for (const lang of ['es', 'en'] as const) {
  for (const service of services[lang]) {
    KEY_BY_SPELLING.set(fold(service.key), service.key);
    KEY_BY_SPELLING.set(fold(service.title), service.key);
  }
}
for (const [key, titles] of Object.entries(HISTORICAL_TITLES) as [ServiceKey, readonly string[]][]) {
  for (const title of titles) KEY_BY_SPELLING.set(fold(title), key);
}

/** Resolves a key, a title in either language or a historical spelling. */
export function serviceKeyOf(value: string | null | undefined): ServiceKey | null {
  if (!value) return null;
  return KEY_BY_SPELLING.get(fold(value)) ?? null;
}

/** The value written to `appointments.service_type` for a key. */
export function canonicalServiceTitle(key: ServiceKey): string {
  const service = services.es.find((entry) => entry.key === key);
  if (!service) throw new Error(`Unknown service key: ${key}`);
  return service.title;
}

/**
 * A stored value as the Spanish-only admin should show it. Historical
 * spellings and English titles fold onto the current Spanish title; anything
 * unrecognised (free text from before the server validated it) passes through
 * unchanged rather than being hidden.
 */
export function serviceLabelEs(stored: string): string {
  const key = serviceKeyOf(stored);
  return key ? canonicalServiceTitle(key) : stored;
}

/**
 * Options for the appointment form's service field, in the visitor's
 * language. General consultation first: it is the right answer for anyone who
 * does not know what they need, and the validation message tells them so.
 */
export function serviceOptions(lang: Language): { value: ServiceKey; label: string }[] {
  const options = services[lang].map((service) => ({ value: service.key, label: service.title }));
  const checkup = options.filter((option) => option.value === 'checkup');
  return [...checkup, ...options.filter((option) => option.value !== 'checkup')];
}
