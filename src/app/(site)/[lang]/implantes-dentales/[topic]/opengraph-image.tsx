import { IMPLANT_SPOKE_SLUGS, getImplantSpoke, implantCluster } from '@/lib/data';
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og-card';

export const runtime = 'nodejs';
export const alt = 'Implantes dentales — Dr. Francis Valerio';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/* Same params as the spoke page beside it; the [lang] layout supplies `lang`. */
export function generateStaticParams() {
  return IMPLANT_SPOKE_SLUGS.map((topic) => ({ topic }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ lang: string; topic: string }>;
}) {
  const { lang: raw, topic } = await params;
  const lang = raw === 'en' ? 'en' : 'es';
  const page = getImplantSpoke(lang, topic) ?? implantCluster[lang].pillar;
  return renderOgCard({
    lang,
    eyebrow: lang === 'es' ? 'Guía de implantes dentales' : 'Dental implant guide',
    title: page.h1,
  });
}
