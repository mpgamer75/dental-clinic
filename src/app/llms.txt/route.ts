import {
  clinicContact,
  contactDetails,
  diplomas,
  getHomeFaq,
  implantCluster,
  implantClusterPath,
  implantEducation,
  services,
} from '@/lib/data';
import { absoluteUrl, localePath } from '@/lib/site';
import type { Language } from '@/lib/types';

/**
 * /llms.txt — the site described in plain Markdown, for AI assistants.
 *
 * A growing share of "who does dental implants in Santiago" is asked of an
 * assistant rather than typed into a search box, and an assistant answers from
 * whatever it could read cleanly. This is the page written to be read that
 * way: who the clinic is, what it does, where it is and how to reach it, the
 * implant guide page by page, and the questions patients ask — with no
 * navigation, no markup and nothing to render.
 *
 * GENERATED FROM `data.ts`, never written by hand. A hand-written summary is a
 * second copy of the facts, and the day the phone number or the hours change
 * it is the copy nobody remembers. Every line below is read from the same
 * exports the pages render, so it cannot say something the site does not.
 *
 * Spanish first: it is the language the practice sells in and the language
 * most of these questions are asked in. English follows in the same file.
 *
 * Static — built once, no request-time data. It lives outside `[lang]` on
 * purpose (the convention is one file at the site root); the proxy lets any
 * path containing a dot through without a locale prefix.
 */
export const dynamic = 'force-static';

function fill(text: string, lang: Language): string {
  return text
    .replaceAll('{{clinicName}}', contactDetails.clinicName[lang])
    .replaceAll('{{doctorName}}', contactDetails.doctorName[lang]);
}

/** No-break spaces are typography for a browser; in plain text they are noise. */
const plain = (text: string) => text.replace(/[  ]/g, ' ');

const LABELS = {
  es: {
    about: 'Sobre la clínica',
    contact: 'Contacto',
    address: 'Dirección',
    phone: 'Teléfono y WhatsApp',
    email: 'Correo',
    hours: 'Horario',
    booking: 'Solicitar una cita',
    doctor: 'El doctor',
    credentials: 'Diplomas y certificados',
    services: 'Servicios',
    implants: 'Implantes dentales',
    parts: 'Las piezas de un implante',
    treatment: 'El tratamiento, paso a paso',
    guide: 'Guía de implantes',
    faq: 'Preguntas frecuentes',
    note: 'Este contenido es informativo y no sustituye una evaluación clínica.',
  },
  en: {
    about: 'About the clinic',
    contact: 'Contact',
    address: 'Address',
    phone: 'Phone and WhatsApp',
    email: 'Email',
    hours: 'Hours',
    booking: 'Request an appointment',
    doctor: 'The doctor',
    credentials: 'Diplomas and certificates',
    services: 'Services',
    implants: 'Dental implants',
    parts: 'The parts of an implant',
    treatment: 'The treatment, step by step',
    guide: 'Implant guide',
    faq: 'Frequently asked questions',
    note: 'This content is informational and does not replace a clinical assessment.',
  },
} as const;

function section(lang: Language): string {
  const t = LABELS[lang];
  const clinic = contactDetails.clinicName[lang];
  const doctor = contactDetails.doctorName[lang];
  const cluster = implantCluster[lang];
  const education = implantEducation[lang];
  const lines: string[] = [];

  lines.push(`## ${t.about}`, '');
  lines.push(fill(contactDetails.servicesSection[lang].description, lang), '');

  lines.push(`## ${t.contact}`, '');
  lines.push(`- ${t.address}: ${contactDetails.address[lang]}`);
  lines.push(`- ${t.phone}: ${contactDetails.phone[lang]} (${clinicContact.phoneE164})`);
  lines.push(`- ${t.email}: ${contactDetails.email[lang]}`);
  lines.push(`- ${t.hours}: ${contactDetails.schedule[lang]}`);
  lines.push(`- [${t.booking}](${absoluteUrl(localePath(lang, 'agendar-cita'))})`, '');

  lines.push(`## ${t.doctor}`, '');
  lines.push(`${doctor}, ${clinic}.`, '');
  for (const qualification of contactDetails.qualifications[lang]) lines.push(`- ${qualification}`);
  lines.push('', `### ${t.credentials}`, '');
  const byYear = [...diplomas[lang]].sort((a, b) => Number.parseInt(a.year, 10) - Number.parseInt(b.year, 10));
  for (const diploma of byYear) {
    lines.push(`- ${diploma.year}: ${diploma.title} — ${diploma.institution}`);
  }
  lines.push('');

  lines.push(`## ${t.services}`, '');
  for (const service of services[lang]) lines.push(`- **${service.title}**: ${service.summary}`);
  lines.push('');

  lines.push(`## ${t.implants}`, '');
  lines.push(education.description, '');
  lines.push(`### ${t.parts}`, '');
  for (const part of education.parts) lines.push(`- **${part.label}**: ${part.desc}`);
  lines.push('', `### ${t.treatment}`, '');
  education.steps.forEach((step, index) => {
    lines.push(`${index + 1}. **${step.title}** (${step.when}): ${step.desc}`);
  });
  lines.push('', `### ${t.guide}`, '');
  lines.push(
    `- [${cluster.pillar.h1}](${absoluteUrl(implantClusterPath(lang))}): ${cluster.pillar.cardSummary}`,
  );
  for (const spoke of cluster.spokes) {
    lines.push(
      `- [${spoke.shortLabel}](${absoluteUrl(implantClusterPath(lang, spoke.slug))}): ${spoke.cardSummary}`,
    );
  }
  lines.push('');

  lines.push(`## ${t.faq}`, '');
  for (const item of getHomeFaq(lang)) {
    lines.push(`### ${item.question}`, '', fill(item.answer, lang), '');
  }

  lines.push(`_${t.note}_`, '');
  return lines.join('\n');
}

export function GET() {
  const clinic = contactDetails.clinicName.es;
  const body = [
    `# ${clinic} — ${contactDetails.doctorName.es}`,
    '',
    `> ${contactDetails.address.es} — ${contactDetails.schedule.es} — Tel. ${contactDetails.phone.es}`,
    '',
    `- Español: ${absoluteUrl(localePath('es'))}`,
    `- English: ${absoluteUrl(localePath('en'))}`,
    '',
    '---',
    '',
    '# Español',
    '',
    section('es'),
    '---',
    '',
    '# English',
    '',
    section('en'),
  ].join('\n');

  return new Response(plain(body), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
