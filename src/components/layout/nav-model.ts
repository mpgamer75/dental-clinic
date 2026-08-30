import { implantClusterPath, IMPLANT_SPOKE_SLUGS, navStrings } from '@/lib/data';
import type { Language } from '@/lib/types';

export interface NavEntry {
  /** Stable identity: scrollspy key and React key. Never rendered. */
  key: string;
  href: string;
  label: string;
  /**
   * Homepage section ids this entry is responsible for, in document order.
   * The first is the entry's own anchor target; the rest are the bands that
   * belong to it narratively, so the indicator never goes dark mid-page.
   *
   * An entry that points at a real route rather than a fragment still declares
   * its homepage sections: the scrollspy tracks element ids, not hrefs, so
   * "Implantes" keeps lighting up as the reader passes the implant band on the
   * homepage even though clicking it now leaves the page.
   */
  sections: string[];
}

export type NavLink = Omit<NavEntry, 'sections'>;

/**
 * The five links in the bar.
 *
 * Six was one too many for a row that also has to carry a wordmark, three
 * utilities and a call to action — "Testimonios" is the item a visitor is least
 * likely to navigate to deliberately, so it moves to the secondary index inside
 * the mobile overlay and stays reachable by scrolling. It is still claimed by
 * "Servicios" for scrollspy purposes (the proof follows the offer), so passing
 * through it does not blank the indicator.
 *
 * The section→link map is the ordering of the homepage itself:
 *   por-que · implantes            → Implantes   (why it matters, and how)
 *   servicios · testimonios        → Servicios   (the offer, then the proof)
 *   el-doctor · diplomas ·
 *     la-consulta                  → El doctor   (who treats you, and where)
 *   preguntas-frecuentes           → Preguntas
 *   agendar · contacto             → Contacto    (the ask, then the details)
 *
 * "Implantes" is the one entry that is NOT a fragment. Implants are the
 * practice's commercial priority and they now have a pillar page with five
 * spokes beneath it; pointing the primary nav at `#implantes` sent every
 * visitor — and every crawler following the header — to ~300 words on the
 * homepage instead. Fragments are correctly excluded from the sitemap, so
 * until this changed there was no internal link into that content at all.
 */
export function getPrimaryNav(lang: Language): NavEntry[] {
  const t = navStrings[lang];
  const base = `/${lang}`;

  return [
    {
      key: 'implantes',
      href: implantClusterPath(lang),
      label: t.links.implants,
      sections: ['por-que', 'implantes'],
    },
    {
      key: 'servicios',
      href: `${base}#servicios`,
      label: t.links.services,
      sections: ['servicios', 'testimonios'],
    },
    {
      key: 'el-doctor',
      href: `${base}#el-doctor`,
      label: t.links.doctor,
      sections: ['el-doctor', 'diplomas', 'la-consulta'],
    },
    {
      key: 'preguntas',
      href: `${base}#preguntas-frecuentes`,
      label: t.links.faq,
      sections: ['preguntas-frecuentes'],
    },
    {
      key: 'contacto',
      href: `${base}#contacto`,
      label: t.links.contact,
      sections: ['agendar', 'contacto'],
    },
  ];
}

/** Secondary index — mobile overlay only, below the primary list. */
export function getSecondaryNav(lang: Language): NavLink[] {
  const t = navStrings[lang];
  const base = `/${lang}`;

  return [
    {
      key: 'testimonios',
      href: `${base}#testimonios`,
      label: t.secondary.testimonials,
    },
    { key: 'diplomas', href: `${base}#diplomas`, label: t.secondary.diplomas },
    {
      key: 'la-consulta',
      href: `${base}#la-consulta`,
      label: t.secondary.clinic,
    },
  ];
}

/**
 * Every URL in the implant cluster, pillar first, in reading order.
 *
 * Hrefs only — deliberately no labels, even though a label per link would be
 * the obvious API.
 *
 * This module is in the CLIENT graph: `navbar.tsx` is a client component and
 * imports it. `data.ts` is a single module and is not being tree-shaken here —
 * measured on a production build, the chunk the homepage loads contains the
 * full text of all six clinical articles (~35 KB gzipped of prose nothing in
 * the browser reads). That is a standing problem this file did not create and
 * cannot fix alone; what it can do is not add a second reason for it, so that
 * splitting `data.ts` — or handing the header its strings as props from a
 * server parent — is enough to make the content stop shipping.
 *
 * Labels therefore live where the pages that render them do: server components
 * read `implantCluster[lang]` directly. A client component that needs one
 * should be handed it as a prop.
 *
 * The cluster is reachable without this: the header links the pillar, and the
 * pillar links every spoke. This exists for the footer, which is the right
 * second path — a topic cluster wants more than one internal route into each
 * leaf, and the header cannot carry six links without becoming a mega-menu.
 */
export function getImplantClusterHrefs(lang: Language): string[] {
  return [
    implantClusterPath(lang),
    ...IMPLANT_SPOKE_SLUGS.map((slug) => implantClusterPath(lang, slug)),
  ];
}
