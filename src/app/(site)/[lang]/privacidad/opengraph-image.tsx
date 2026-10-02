import { privacyPolicy } from '@/lib/data';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card';

export const runtime = 'nodejs';
export const alt = 'Política de privacidad — Orthoprotesis Dental Clinic';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = raw === 'en' ? 'en' : 'es';
  return renderOgCard({ lang, eyebrow: 'Orthoprotesis Dental Clinic', title: privacyPolicy[lang].title });
}
