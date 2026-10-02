import { implantCluster } from '@/lib/data';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card';

/* The implant guide is the page most worth sharing, and it used to be shared
   with no image at all: the page's own `openGraph` block replaced the layout's
   and carried no `images`. */
export const runtime = 'nodejs';
export const alt = 'Implantes dentales en Santiago de los Caballeros — Dr. Francis Valerio';
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
    eyebrow: lang === 'es' ? 'Guía de implantes dentales' : 'Dental implant guide',
    title: implantCluster[lang].pillar.h1,
  });
}
