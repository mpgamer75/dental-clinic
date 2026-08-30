import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { implantCluster, implantClusterPath } from '@/lib/data';
import { getClusterPageMetadata } from '@/lib/seo-config';
import type { Language } from '@/lib/types';
import { ImplantArticle } from './_components/implant-article';
import { ClusterJsonLd } from './_components/cluster-json-ld';

function resolveLang(raw: string | undefined): Language {
  if (raw !== 'es' && raw !== 'en') notFound();
  return raw;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  return getClusterPageMetadata(resolveLang(raw));
}

/**
 * The implant pillar.
 *
 * Fully static: every string comes from `data.ts` and nothing here reads a
 * cookie, a header or the database, so both locales are prerendered at build
 * time and served as files. There is no `revalidate` because there is nothing
 * to revalidate — the copy changes when someone edits `data.ts` and redeploys.
 *
 * Why this page exists at all: the entire implant offering used to be ~300
 * Spanish words behind a `#implantes` fragment on the homepage, while the title
 * tag targeted "Implantes Dentales en Santiago" and the keyword list targeted
 * All-on-4, carga inmediata, injerto óseo and turismo dental — none of which
 * had a single supporting word anywhere in the content layer. One document
 * cannot rank for a reference query and a transactional one at the same time.
 */
export default async function ImplantPillarPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang = resolveLang(raw);
  const cluster = implantCluster[lang];

  return (
    <>
      <ClusterJsonLd lang={lang} />
      <ImplantArticle
        lang={lang}
        page={cluster.pillar}
        crumbs={[
          {
            name: cluster.pillar.shortLabel,
            href: implantClusterPath(lang),
            current: true,
          },
        ]}
        related={cluster.spokes.map((spoke) => ({
          key: spoke.slug,
          href: implantClusterPath(lang, spoke.slug),
          label: spoke.shortLabel,
          summary: spoke.cardSummary,
        }))}
      />
    </>
  );
}
