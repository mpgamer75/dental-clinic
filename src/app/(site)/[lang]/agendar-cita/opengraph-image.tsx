import { contactDetails, homeContent } from '@/lib/data';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card';

/* The booking link is the one most often sent on WhatsApp ("pide la cita
   aquí"); it deserves a card that says what it is. */
export const runtime = 'nodejs';
export const alt = 'Agendar una cita — Orthoprotesis Dental Clinic';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = raw === 'en' ? 'en' : 'es';
  return renderOgCard({
    lang,
    eyebrow: contactDetails.appointmentPage[lang].title,
    title: homeContent[lang].booking.description,
  });
}
