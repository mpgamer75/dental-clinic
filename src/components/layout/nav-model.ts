import { implantClusterPath, navStrings } from '@/lib/data';
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
 * The five links in the bar, in the order the homepage tells its story.
 *
 * Six was one too many for a row that also carries a wordmark, three utilities
 * and a call to action, so "Testimonios" and "Diplomas" live in the mobile
 * overlay's secondary index and the footer, and stay reachable by scrolling.
 *
 * The section→link map is the ordering of the homepage itself. Every band
 * belongs to exactly one entry, so the indicator never goes dark mid-page; a
 * listed id that is absent (testimonials render only when there is one) is
 * simply skipped by the spy.
 *   por-que · implantes            → Implantes   (why it matters, and how)
 *   el-doctor · testimonios        → El doctor   (who treats you, and the proof)
 *   servicios                      → Servicios
 *   preguntas-frecuentes           → Preguntas
 *   contacto · agendar             → Contacto    (where it is, then the ask)
 *
 * The last entry must own the last band: at the foot of the page the spy
 * lights the last entry.
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
      key: 'el-doctor',
      href: `${base}#el-doctor`,
      label: t.links.doctor,
      sections: ['el-doctor', 'testimonios'],
    },
    {
      key: 'servicios',
      href: `${base}#servicios`,
      label: t.links.services,
      sections: ['servicios'],
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
      sections: ['contacto', 'agendar'],
    },
  ];
}

/** Secondary index — mobile overlay only, below the primary list. "La
 *  consulta" is gone: the visit band merged into Contacto ("Cómo llegar"). */
export function getSecondaryNav(lang: Language): NavLink[] {
  const t = navStrings[lang];
  const base = `/${lang}`;

  return [
    { key: 'diplomas', href: `${base}#diplomas`, label: t.secondary.diplomas },
    { key: 'testimonios', href: `${base}#testimonios`, label: t.secondary.testimonials },
  ];
}

/* This module is in the CLIENT graph (navbar.tsx imports it), which is why it
   takes only short strings from data.ts. Turbopack tree-shakes data.ts per
   export — verified on a production build: the implant articles' prose is in
   no client chunk — but labels a server component can read directly should
   still be read there and handed down as props, as the footer and the
   homepage's implant band do. */
