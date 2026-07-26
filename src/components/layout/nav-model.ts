import { navStrings } from '@/lib/data';
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
 */
export function getPrimaryNav(lang: Language): NavEntry[] {
  const t = navStrings[lang];
  const base = `/${lang}`;

  return [
    {
      key: 'implantes',
      href: `${base}#implantes`,
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
