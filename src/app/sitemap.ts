import { MetadataRoute } from 'next';
import { absoluteUrl, hreflangAlternatesAbsolute, LOCALES, localePath } from '@/lib/site';
import { IMPLANT_CLUSTER_SEGMENT, IMPLANT_CONTENT_REVISED, IMPLANT_SPOKE_SLUGS } from '@/lib/data';

/**
 * One entry per real document, emitted once per locale with its hreflang set.
 *
 * `path` is locale-agnostic — the part after `/es` or `/en` — so a route can
 * never be listed for one language and forgotten for the other, which is the
 * failure mode this file had before it was table-driven.
 */
interface SitemapRoute {
  path: string;
  /** When the document last changed in substance, if it is known. */
  lastModified?: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}

const ROUTES: SitemapRoute[] = [
  { path: '', changeFrequency: 'weekly', priority: 1.0 },

  // The implant cluster. This is the practice's commercial priority and the
  // pillar sits at the same priority as the homepage on purpose: it is the
  // document that should rank for "implantes dentales Santiago", not a
  // homepage fragment. The spokes sit just below it, above the booking page,
  // because they are the entry points for the long-tail queries the keyword
  // list has always targeted and nothing on the site answered.
  { path: IMPLANT_CLUSTER_SEGMENT, lastModified: IMPLANT_CONTENT_REVISED, changeFrequency: 'monthly', priority: 1.0 },
  ...IMPLANT_SPOKE_SLUGS.map((slug) => ({
    path: `${IMPLANT_CLUSTER_SEGMENT}/${slug}`,
    lastModified: IMPLANT_CONTENT_REVISED,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  })),

  { path: 'agendar-cita', changeFrequency: 'monthly', priority: 0.8 },
  { path: 'privacidad', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // NOTE: homepage section anchors (#servicios, #implantes, …) are deliberately
  // NOT listed.
  //
  // A fragment is not a distinct URL. Search engines strip the fragment, so the
  // twelve `/{lang}#section` entries that used to be emitted here collapsed to
  // two URLs already present above — the sitemap declared 16 URLs describing 6
  // documents, with conflicting priorities and changeFrequency for the same
  // page. That is a duplicate-URL signal, not extra coverage. It is also why
  // `#implantes` had no crawlable surface at all until the cluster above
  // existed: there was nothing to list.
  return LOCALES.flatMap((lang) =>
    ROUTES.map((route) => ({
      url: absoluteUrl(localePath(lang, route.path)),
      // Only where the date is real. It used to be `new Date()` for every URL,
      // so every build announced every page as freshly changed — a signal
      // crawlers learn to ignore. The implant pages carry the date their
      // clinical copy was last revised; the rest omit it rather than guess.
      ...(route.lastModified ? { lastModified: route.lastModified } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: hreflangAlternatesAbsolute(route.path) },
    })),
  );
}
