import type { Metadata } from 'next';
import type { Language } from './types';
import { SITE_URL, absoluteUrl, hreflangAlternates, localePath } from './site';
import {
  contactDetails,
  diplomas,
  implantCluster,
  implantClusterPath,
  services,
  IMPLANT_CLUSTER_SEGMENT,
  IMPLANT_CONTENT_REVISED,
  type ImplantSpokeSlug,
} from './data';

/**
 * The clinic's Google Business Profile URL.
 *
 * THIS IS THE ONE PLACE TO ADD IT. `sameAs` is the property Google uses to
 * reconcile this site with the entity it already knows about, and for a local
 * practice the Business Profile is by far the most valuable link in it —
 * more than any social account.
 *
 * It is `null` rather than a guess on purpose: a `sameAs` pointing at the wrong
 * profile is worse than an absent one, because it asserts an identity. Paste
 * the real URL here (the `https://maps.app.goo.gl/…` share link or the full
 * `https://www.google.com/maps/place/…` URL) and the property starts being
 * emitted automatically. Add verified social profiles to the array below it the
 * same way — real URLs only.
 */
const GOOGLE_BUSINESS_PROFILE_URL: string | null = null;
const VERIFIED_SOCIAL_PROFILES: string[] = [];

/** Stable node identifiers, so every page's graph points at one clinic and one
 *  clinician instead of re-declaring them as new entities. */
const CLINIC_ID = `${SITE_URL}/#clinic`;
const DOCTOR_ID = `${SITE_URL}/#dr-francis-valerio`;

/**
 * The two diplomas that are academic degrees rather than course or congress
 * certificates. Everything else in `diplomas` is continuing education, and
 * calling a two-day congress a "degree" in structured data is the kind of
 * inflation that costs a health site its rich results.
 */
const DEGREE_DIPLOMA_IDS = new Set(['diploma2', 'diploma6']);

/** Spokes that describe an actual clinical procedure. `precio` and
 *  `turismo-dental-santiago` are real pages but they are not MedicalProcedures,
 *  and typing them as one would be false. */
const CLINICAL_SPOKES: ImplantSpokeSlug[] = ['all-on-4', 'carga-inmediata', 'injerto-oseo'];

interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    type: string;
    locale: string;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
  };
}

/**
 * Homepage SEO copy.
 *
 * Three claims were removed from this block and must not come back:
 *
 *   "resultados garantizados" / "guaranteed results" — an unsubstantiated
 *   outcome guarantee on a medical site. It is a regulatory exposure before it
 *   is an SEO problem, and no page of this site said it.
 *
 *   "Consulta gratis" / "Free consultation" — the site nowhere offers one. The
 *   booking page describes the first visit as an assessment ending in a written
 *   quote. A promise that only exists in the meta description is a promise a
 *   patient arrives holding.
 *
 *   "materiales FDA aprobados" / "FDA-approved materials" — the practice has
 *   never named which implant system it uses, so this asserted a certification
 *   nothing on the site supports.
 *
 * What is left is verifiable from `contactDetails` and `diplomas`: the
 * location, the specialities, and thirty years in practice.
 */
export const seoConfig: Record<Language, SEOConfig> = {
  es: {
    title: 'Implantes Dentales en Santiago - Dr. Francis Valerio | Orthoprotesis',
    description:
      'Implantes dentales en Santiago de los Caballeros, República Dominicana. Más de 30 años de experiencia en prótesis, implantes y ortodoncia. Agende su evaluación.',
    keywords: [
      'implantes dentales Santiago',
      'implantes dentales República Dominicana',
      'implantes dentales Santiago de los Caballeros',
      'dentista implantes Santiago',
      'Dr. Francis Valerio',
      'Orthoprotesis',
      'precio implantes dentales Santiago',
      'all on 4 implantes Santiago',
      'All-on-4 República Dominicana',
      'carga inmediata implantes',
      'implantes dentales inmediatos',
      'injerto óseo dental Santiago',
      'elevación de seno maxilar',
      'osteointegración implante dental',
      'riesgos de los implantes dentales',
      'clínica dental Santiago',
      'dentista Santiago República Dominicana',
      'prótesis dentales Santiago',
      'ortodoncia Santiago',
      'blanqueamiento dental Santiago',
      'endodoncia Santiago',
      'limpieza dental Santiago',
      'turismo dental República Dominicana',
      'turismo dental Santiago de los Caballeros',
      'Plaza Las Ramblas Santiago',
      'clínica dental moderna Santiago',
    ],
    openGraph: {
      title: 'Implantes Dentales en Santiago | Dr. Francis Valerio',
      description:
        'Especialista en implantes dentales con más de 30 años de experiencia en Santiago, República Dominicana. Prótesis, implantes y ortodoncia en Plaza Las Ramblas.',
      type: 'website',
      locale: 'es_DO',
      siteName: 'Orthoprotesis Dental Clinic',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Implantes Dentales Santiago | Dr. Francis Valerio',
      description:
        'Implantes, prótesis y ortodoncia en Santiago de los Caballeros. Más de 30 años de experiencia.',
    },
  },
  en: {
    title: 'Dental Implants Santiago Dominican Republic - Dr. Francis Valerio',
    description:
      'Dental implants in Santiago de los Caballeros, Dominican Republic. Over 30 years of experience in prosthetics, implants and orthodontics. Book an assessment.',
    keywords: [
      'dental implants Santiago Dominican Republic',
      'dental implants Santiago de los Caballeros',
      'dentist Santiago Dominican Republic',
      'Dr. Francis Valerio',
      'Orthoprotesis',
      'dental implants cost Santiago',
      'all on 4 dental implants Santiago',
      'All-on-4 Dominican Republic',
      'immediate loading dental implants',
      'same day dental implants',
      'bone graft dental implant',
      'maxillary sinus lift',
      'osseointegration',
      'dental implant risks',
      'dental clinic Santiago',
      'dental tourism Dominican Republic',
      'dental tourism Santiago de los Caballeros',
      'English speaking dentist Santiago',
      'orthodontics Santiago',
      'teeth whitening Santiago',
      'root canal Santiago',
      'dental cleaning Santiago',
      'Plaza Las Ramblas Santiago',
      'modern dental clinic Santiago',
    ],
    openGraph: {
      title: 'Dental Implants in Santiago | Dr. Francis Valerio',
      description:
        'Dental implant specialist with 30+ years of experience in Santiago, Dominican Republic. Prosthetics, implants and orthodontics at Plaza Las Ramblas.',
      type: 'website',
      locale: 'en_US',
      siteName: 'Orthoprotesis Dental Clinic',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Dental Implants Santiago DR | Dr. Francis Valerio',
      description:
        'Implants, prosthetics and orthodontics in Santiago de los Caballeros. Over 30 years of experience.',
    },
  },
};

// Per-language page metadata for the homepage.
// OG/Twitter images are produced by the file-based `opengraph-image` route
// (src/app/[lang]/opengraph-image.tsx), so no static image paths are referenced
// here (the previously referenced JPGs did not exist and broke social previews).
export function getHomeMetadata(lang: Language): Metadata {
  const config = seoConfig[lang];
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    authors: [{ name: 'Dr. Francis Valerio' }],
    creator: 'Orthoprotesis Dental Clinic',
    publisher: 'Orthoprotesis Dental Clinic',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: localePath(lang),
      languages: hreflangAlternates(),
    },
    openGraph: {
      ...config.openGraph,
      url: `${SITE_URL}${localePath(lang)}`,
    },
    twitter: {
      ...config.twitter,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

/**
 * Metadata for one page of the implant cluster.
 *
 * Every field the pillar and the five spokes need, derived from the content in
 * `data.ts` so a page cannot drift from its own copy: the title, description
 * and keywords come from the page object, and the canonical / hreflang set
 * comes from the one path the caller passes.
 *
 * Note what is NOT appended: the clinic name. "… | Orthoprotesis Dental Clinic"
 * costs 32 of the ~60 characters a title gets before Google truncates it, and
 * on a page whose whole job is to rank for "implantes dentales Santiago" that
 * is a third of the budget spent on a word nobody searches for.
 */
export function getClusterPageMetadata(
  lang: Language,
  spoke?: ImplantSpokeSlug,
): Metadata {
  const cluster = implantCluster[lang];
  const page = spoke
    ? (cluster.spokes.find((s) => s.slug === spoke) ?? cluster.pillar)
    : cluster.pillar;

  const path = spoke ? `${IMPLANT_CLUSTER_SEGMENT}/${spoke}` : IMPLANT_CLUSTER_SEGMENT;
  const canonical = localePath(lang, path);

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: {
      canonical,
      languages: hreflangAlternates(path),
    },
    // Metadata merges rather than replaces, so without an explicit block here
    // every one of these pages would inherit the [lang] layout's openGraph —
    // which describes the homepage. Sharing a spoke on WhatsApp would show the
    // homepage's title, blurb and URL.
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: canonical,
      type: 'article',
      locale: lang === 'es' ? 'es_DO' : 'en_US',
      siteName: contactDetails.clinicName[lang],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

/**
 * The clinic, as one schema.org node.
 *
 * Four things were wrong here and are fixed:
 *
 *   1. `hasOfferCatalog` wrapped every service in an `Offer` whose
 *      `itemOffered` was a `MedicalProcedure`. `Offer.itemOffered` ranges over
 *      Product / Service / Event / Trip — a MedicalProcedure is none of those,
 *      so the whole catalogue was out of range and produced nothing. The
 *      services now hang off `availableService`, which is the property
 *      `MedicalOrganization` actually defines for exactly this and whose range
 *      IS MedicalProcedure / MedicalTherapy / MedicalTest.
 *
 *   2. `hasCredential` did not exist, while nine real, photographed diplomas
 *      sat in `data.ts` rendering as an image gallery no crawler can read.
 *      They are the single strongest expertise signal this practice has.
 *
 *   3. No `medicalSpecialty`, no language declaration and no `hasMap`. The
 *      language pair is a direct dental-tourism signal and costs one line.
 *
 *   4. `sameAs` was three commented-out placeholder URLs. See the constant at
 *      the top of this file.
 */
export function getDentalClinicStructuredData(lang: Language) {
  const isSpanish = lang === 'es';
  const cluster = implantCluster[lang];

  const sameAs = [GOOGLE_BUSINESS_PROFILE_URL, ...VERIFIED_SOCIAL_PROFILES].filter(
    (url): url is string => Boolean(url),
  );

  // Implant procedures come from the cluster so each one carries the URL of the
  // page that documents it — the link is what turns a name into an entity.
  const implantServices = [
    {
      '@type': 'MedicalProcedure',
      name: cluster.pillar.procedureName,
      description: cluster.pillar.cardSummary,
      procedureType: 'https://schema.org/SurgicalProcedure',
      url: absoluteUrl(implantClusterPath(lang)),
    },
    ...CLINICAL_SPOKES.map((slug) => {
      const spoke = cluster.spokes.find((s) => s.slug === slug);
      return {
        '@type': 'MedicalProcedure',
        name: spoke?.procedureName ?? slug,
        description: spoke?.cardSummary,
        procedureType: 'https://schema.org/SurgicalProcedure',
        url: absoluteUrl(implantClusterPath(lang, slug)),
      };
    }),
  ];

  // Everything else the practice does, by name, from the single services list.
  // `Scan` is the implant entry, already covered above in far more detail.
  const otherServices = services[lang]
    .filter((service) => service.iconName !== 'Scan')
    .map((service) => ({
      '@type': 'MedicalProcedure',
      name: service.title,
    }));

  return {
    '@context': 'https://schema.org',
    '@type': ['Dentist', 'MedicalClinic'],
    '@id': CLINIC_ID,
    name: contactDetails.clinicName[lang],
    alternateName: 'Dr. Francis Valerio - Orthoprotesis',
    description: isSpanish
      ? 'Clínica dental en Santiago de los Caballeros, República Dominicana, especializada en implantes dentales, prótesis y ortodoncia. Más de 30 años de experiencia.'
      : 'Dental clinic in Santiago de los Caballeros, Dominican Republic, specialising in dental implants, prosthetics and orthodontics. Over 30 years of experience.',
    url: absoluteUrl(localePath(lang)),
    telephone: '+1-809-581-7059',
    email: contactDetails.email[lang],
    priceRange: '$$',
    medicalSpecialty: 'https://schema.org/Dentistry',
    // `knowsLanguage` is the property an Organization actually defines;
    // `availableLanguage` belongs to the ContactPoint below. Both are stated,
    // because between them they are the machine-readable form of "we can treat
    // you in English" — the single most load-bearing fact for a patient
    // deciding whether to fly here.
    knowsLanguage: ['es', 'en'],
    image: [
      absoluteUrl('/images/vitrine_clinique1.jpg'),
      absoluteUrl('/images/vitrine_clinique2.jpg'),
      absoluteUrl('/images/vitrine_clinique3.jpg'),
    ],
    logo: absoluteUrl('/images/logo_valerio.png'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plaza Las Ramblas, Módulo 101',
      addressLocality: 'Santiago de los Caballeros',
      addressRegion: 'Santiago',
      postalCode: '51000',
      addressCountry: 'DO',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 19.4541221,
      longitude: -70.69729749999999,
    },
    hasMap: contactDetails.mapLink[lang],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: isSpanish ? 'Citas y consultas' : 'Appointments and enquiries',
      telephone: '+1-809-581-7059',
      email: contactDetails.email[lang],
      availableLanguage: ['es', 'en'],
      areaServed: ['DO', 'US', 'CA', 'ES'],
    },
    // Mirrors `contactDetails.schedule`: Monday to Friday, 09:00–18:00. If the
    // opening hours ever change, both have to change — the string is what the
    // page prints and this is what the search result prints.
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    areaServed: [
      { '@type': 'City', name: 'Santiago de los Caballeros' },
      { '@type': 'Country', name: 'Dominican Republic' },
    ],
    availableService: [...implantServices, ...otherServices],
    founder: { '@id': DOCTOR_ID },
    employee: { '@id': DOCTOR_ID },
    // NOTE: a fabricated aggregateRating (4.9 / 150 reviews) was removed here.
    // It had no backing data and risks Google structured-data penalties + erodes
    // trust on a health site. To re-introduce it legitimately, compute it from
    // verified reviews (the `testimonials` table, or the Google Business
    // Profile) — do not hardcode.
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * Dr. Valerio, with his nine real diplomas attached.
 *
 * Separate node rather than an inline `founder` object so the clinic, the
 * pages and the credentials all reference one `@id`. `hasCredential` belongs to
 * the person who earned the qualification, not to the building.
 *
 * Every field here is read out of `diplomas` / `contactDetails`. Nothing is
 * asserted that the site cannot show a photograph of.
 */
export function getDoctorStructuredData(lang: Language) {
  const isSpanish = lang === 'es';

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': DOCTOR_ID,
    name: contactDetails.doctorName[lang],
    jobTitle: isSpanish ? 'Doctor en Odontología' : 'Doctor of Dental Surgery',
    worksFor: { '@id': CLINIC_ID },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Pontificia Universidad Católica Madre y Maestra (PUCMM)',
    },
    memberOf: {
      '@type': 'Organization',
      name: isSpanish
        ? 'Asociación Odontológica Dominicana'
        : 'Dominican Dental Association',
    },
    knowsAbout: isSpanish
      ? ['Implantología oral', 'Prótesis dental', 'Ortodoncia', 'Rehabilitación oral']
      : ['Oral implantology', 'Dental prosthetics', 'Orthodontics', 'Oral rehabilitation'],
    knowsLanguage: ['es', 'en'],
    hasCredential: diplomas[lang].map((diploma) => ({
      '@type': 'EducationalOccupationalCredential',
      name: diploma.title,
      description: diploma.description,
      // A congress attendance certificate is not a degree. Only the Magíster
      // and the Especialista are, and inflating the rest is exactly the kind of
      // overclaim that gets a health site's rich results pulled.
      credentialCategory: DEGREE_DIPLOMA_IDS.has(diploma.id) ? 'degree' : 'certificate',
      dateCreated: diploma.year,
      recognizedBy: { '@type': 'Organization', name: diploma.institution },
      image: absoluteUrl(diploma.image),
      url: `${absoluteUrl(localePath(lang))}#diplomas`,
    })),
  };
}

/** One step of a breadcrumb trail. `path` is locale-agnostic — the locale
 *  prefix is added here, so a caller can never emit a crumb in the wrong
 *  language. */
export interface BreadcrumbCrumb {
  name: string;
  /** Path after the locale segment, e.g. `implantes-dentales/precio`. */
  path: string;
}

/**
 * Breadcrumb structured data.
 *
 * The old version could only ever produce one or two items, and on the homepage
 * — its only caller — it produced a single "Inicio" entry. A one-item
 * BreadcrumbList tells a crawler nothing it did not already know from the URL,
 * which is why Google ignores them.
 *
 * The trail form is what the implant cluster needs: Inicio › Implantes
 * dentales › Precio is a real hierarchy and it is the shape that actually
 * appears under a search result.
 *
 * The legacy string form is kept because the homepage still calls it that way.
 * It resolves the known routes rather than pattern-matching a raw path, so a
 * typo produces the Home-only list instead of a crumb pointing nowhere.
 */
export function getBreadcrumbStructuredData(
  lang: Language,
  trail: string | BreadcrumbCrumb[],
) {
  const isSpanish = lang === 'es';
  const crumbs = typeof trail === 'string' ? resolveLegacyTrail(lang, trail) : trail;

  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: isSpanish ? 'Inicio' : 'Home',
      item: absoluteUrl(localePath(lang)),
    },
    ...crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: crumb.name,
      item: absoluteUrl(localePath(lang, crumb.path)),
    })),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(localePath(lang, crumbs[crumbs.length - 1]?.path ?? ''))}#breadcrumb`,
    itemListElement,
  };
}

function resolveLegacyTrail(lang: Language, path: string): BreadcrumbCrumb[] {
  const isSpanish = lang === 'es';

  if (path.includes('agendar-cita')) {
    return [
      { name: isSpanish ? 'Agendar Cita' : 'Book Appointment', path: 'agendar-cita' },
    ];
  }
  if (path.includes('privacidad')) {
    return [
      {
        name: isSpanish ? 'Política de Privacidad' : 'Privacy Policy',
        path: 'privacidad',
      },
    ];
  }
  if (path.includes(IMPLANT_CLUSTER_SEGMENT)) {
    return getImplantBreadcrumbTrail(lang);
  }
  return [];
}

/** The trail for the pillar, or for one of its spokes. Two levels, because the
 *  URL has two levels — that is the whole point of nesting the spokes. */
export function getImplantBreadcrumbTrail(
  lang: Language,
  spoke?: ImplantSpokeSlug,
): BreadcrumbCrumb[] {
  const cluster = implantCluster[lang];
  const trail: BreadcrumbCrumb[] = [
    { name: cluster.pillar.shortLabel, path: IMPLANT_CLUSTER_SEGMENT },
  ];

  if (spoke) {
    const page = cluster.spokes.find((s) => s.slug === spoke);
    if (page) {
      trail.push({
        name: page.shortLabel,
        path: `${IMPLANT_CLUSTER_SEGMENT}/${spoke}`,
      });
    }
  }

  return trail;
}

// FAQ Structured Data
export function getFAQStructuredData(faqItems: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * `MedicalWebPage` for a clinical page.
 *
 * This is the type Google reserves for health content, and it is what carries
 * `specialty` and the medical audience — a generic `WebPage` on a page about
 * implant surgery leaves the single most useful classification unstated.
 *
 * `dateModified` and NOT `lastReviewed` / `reviewedBy`, deliberately. Those two
 * assert that a named clinician checked the page for accuracy; until Dr.
 * Valerio has actually signed the copy off, emitting them would be a fabricated
 * credential on a medical page. `dateModified` only claims when the document
 * last changed, which is a fact about the file. Add the other two — here and in
 * `IMPLANT_CONTENT_REVISED` — the day he reviews it.
 */
export function getMedicalWebPageStructuredData(args: {
  lang: Language;
  /** Path after the locale segment. */
  path: string;
  name: string;
  description: string;
  /** The procedure the page is about. */
  procedureName: string;
  /** Whether the page also emits a BreadcrumbList to point at. */
  hasBreadcrumb?: boolean;
}) {
  const { lang, path, name, description, procedureName, hasBreadcrumb = true } = args;
  const url = absoluteUrl(localePath(lang, path));

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: lang === 'es' ? 'es-DO' : 'en-US',
    specialty: 'https://schema.org/Dentistry',
    about: {
      '@type': 'MedicalProcedure',
      name: procedureName,
    },
    audience: {
      '@type': 'MedicalAudience',
      audienceType: lang === 'es' ? 'Paciente' : 'Patient',
    },
    dateModified: IMPLANT_CONTENT_REVISED,
    publisher: { '@id': CLINIC_ID },
    ...(hasBreadcrumb ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
  };
}
