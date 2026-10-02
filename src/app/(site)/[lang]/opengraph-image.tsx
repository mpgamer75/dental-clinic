import { homeContent } from '@/lib/data';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card';

/* Node, not edge (deprecated in Next 16), and statically generated per locale:
   the card is derived entirely from data.ts. Without `generateStaticParams`
   this route rendered on every crawler hit — 561 ms cold, 129 KB, uncached. */
export const runtime = 'nodejs';
export const alt = 'Orthoprotesis Dental Clinic — Dr. Francis Valerio';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = raw === 'en' ? 'en' : 'es';
  const hero = homeContent[lang].hero;
  return renderOgCard({ lang, eyebrow: hero.eyebrow, title: hero.title });
}
