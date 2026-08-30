import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  getImplantSpoke,
  implantCluster,
  implantClusterPath,
  IMPLANT_SPOKE_SLUGS,
  type ImplantSpokeSlug,
} from '@/lib/data';
import { getClusterPageMetadata } from '@/lib/seo-config';
import type { Language } from '@/lib/types';
import { ImplantArticle } from '../_components/implant-article';
import { ClusterJsonLd } from '../_components/cluster-json-ld';

/**
 * The five spokes are prerendered by name and nothing else resolves.
 *
 * `dynamicParams = false` is declared here as well as in the [lang] layout:
 * relying on it cascading would make a 404 for `/es/implantes-dentales/foo`
 * depend on a config option written in a different file for a different
 * segment. With it, an unknown topic is a router-level 404 before this
 * component ever runs — and `resolve()` below is the belt to that braces, so
 * an unvalidated segment can never be used as a content-dictionary key.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return IMPLANT_SPOKE_SLUGS.map((topic) => ({ topic }));
}

function resolve(rawLang: string | undefined, rawTopic: string | undefined) {
  if (rawLang !== 'es' && rawLang !== 'en') notFound();
  const lang: Language = rawLang;

  const spoke = rawTopic ? getImplantSpoke(lang, rawTopic) : undefined;
  if (!spoke) notFound();

  return { lang, spoke };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; topic: string }>;
}): Promise<Metadata> {
  const { lang: rawLang, topic } = await params;
  const resolved = resolve(rawLang, topic);
  return getClusterPageMetadata(resolved.lang, resolved.spoke.slug);
}

/**
 * One spoke of the implant cluster.
 *
 * Nested under the pillar rather than sitting at `/{lang}/all-on-4`, so the URL
 * itself states the topical relationship — `/es/implantes-dentales/all-on-4`
 * tells a crawler what the page is subordinate to before it reads a word of it.
 *
 * Every spoke links up to the pillar and sideways to its four siblings, so no
 * page in the cluster is more than one click from any other and none of them
 * depends on the header for its inbound links.
 */
export default async function ImplantSpokePage({
  params,
}: {
  params: Promise<{ lang: string; topic: string }>;
}) {
  const { lang: rawLang, topic } = await params;
  const { lang, spoke } = resolve(rawLang, topic);
  const cluster = implantCluster[lang];

  const siblings = cluster.spokes.filter((s) => s.slug !== spoke.slug);

  return (
    <>
      <ClusterJsonLd lang={lang} spoke={spoke.slug as ImplantSpokeSlug} />
      <ImplantArticle
        lang={lang}
        page={spoke}
        crumbs={[
          { name: cluster.pillar.shortLabel, href: implantClusterPath(lang) },
          {
            name: spoke.shortLabel,
            href: implantClusterPath(lang, spoke.slug),
            current: true,
          },
        ]}
        // The pillar leads the list on every spoke: it is the page that should
        // accumulate the internal links, and it is the one a reader who landed
        // here from a long-tail query most likely wants next.
        related={[
          {
            key: 'pillar',
            href: implantClusterPath(lang),
            label: cluster.pillar.shortLabel,
            summary: cluster.pillar.cardSummary,
          },
          ...siblings.map((sibling) => ({
            key: sibling.slug,
            href: implantClusterPath(lang, sibling.slug),
            label: sibling.shortLabel,
            summary: sibling.cardSummary,
          })),
        ]}
        backLink={{
          href: implantClusterPath(lang),
          label: cluster.ui.backToPillar,
        }}
      />
    </>
  );
}
