import type { Metadata } from 'next';
import type { Language } from './types';

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

// Configuration SEO optimisée pour les implants dentaires
export const seoConfig: Record<Language, SEOConfig> = {
  es: {
    title: 'Implantes Dentales en Santiago - Dr. Francis Valerio | Orthoprotesis',
    description: 'Implantes dentales de alta calidad en Santiago, República Dominicana. Más de 30 años de experiencia. Tecnología de vanguardia, resultados garantizados. Consulta gratis.',
    keywords: [
      'implantes dentales Santiago',
      'implantes dentales República Dominicana',
      'implantes dentales Santiago de los Caballeros',
      'dentista implantes Santiago',
      'Dr. Francis Valerio',
      'Orthoprotesis',
      'implantes dentales baratos República Dominicana',
      'all on 4 implantes Santiago',
      'all on 6 implantes República Dominicana',
      'implantes dentales inmediatos',
      'implantes dentales con garantía',
      'clínica dental Santiago',
      'dentista Santiago República Dominicana',
      'prótesis dentales Santiago',
      'ortodoncia Santiago',
      'blanqueamiento dental Santiago',
      'endodoncia Santiago',
      'limpieza dental Santiago',
      'dentista certificado República Dominicana',
      'turismo dental República Dominicana',
      'implantes dentales FDA aprobados',
      'cirugía dental computarizada',
      'implantes dentales 3D',
      'Plaza Las Ramblas Santiago',
      'dentista profesional Santiago',
      'mejor dentista Santiago',
      'clínica dental moderna Santiago',
    ],
    openGraph: {
      title: 'Implantes Dentales Premium en Santiago | Dr. Francis Valerio',
      description: 'Especialista en implantes dentales con más de 30 años de experiencia en Santiago, República Dominicana. Tecnología avanzada, resultados naturales, precios competitivos.',
      type: 'website',
      locale: 'es_DO',
      siteName: 'Orthoprotesis Dental Clinic',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Implantes Dentales Santiago | Dr. Francis Valerio',
      description: 'Implantes dentales de calidad premium en Santiago, RD. +30 años de experiencia. Consulta gratis.',
    },
  },
  en: {
    title: 'Dental Implants Santiago Dominican Republic - Dr. Francis Valerio',
    description: 'Premium dental implants in Santiago, Dominican Republic. 30+ years experience. Advanced technology, FDA-approved materials, guaranteed results. Free consultation.',
    keywords: [
      'dental implants Santiago Dominican Republic',
      'dental implants Santiago de los Caballeros',
      'dentist Santiago Dominican Republic',
      'Dr. Francis Valerio',
      'Orthoprotesis',
      'affordable dental implants Dominican Republic',
      'all on 4 dental implants Santiago',
      'all on 6 implants Dominican Republic',
      'immediate dental implants',
      'guaranteed dental implants',
      'dental clinic Santiago',
      'dental tourism Dominican Republic',
      'FDA approved dental implants',
      'computer guided dental surgery',
      '3D dental implants',
      'dental implants prices Dominican Republic',
      'affordable dentistry Santiago',
      'orthodontics Santiago',
      'dental veneers Dominican Republic',
      'teeth whitening Santiago',
      'root canal Santiago',
      'dental cleaning Santiago',
      'certified dentist Dominican Republic',
      'Plaza Las Ramblas Santiago',
      'best dentist Santiago',
      'modern dental clinic Santiago',
      'dental implants cost Santiago',
    ],
    openGraph: {
      title: 'Premium Dental Implants in Santiago | Dr. Francis Valerio',
      description: 'Dental implant specialist with 30+ years experience in Santiago, Dominican Republic. Advanced technology, natural results, competitive prices.',
      type: 'website',
      locale: 'en_US',
      siteName: 'Orthoprotesis Dental Clinic',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Dental Implants Santiago DR | Dr. Francis Valerio',
      description: 'Premium quality dental implants in Santiago, DR. 30+ years experience. Free consultation.',
    },
  },
};

// Métadonnées pour la page d'accueil
export function getHomeMetadata(lang: Language): Metadata {
  const config = seoConfig[lang];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orthoprotesis-dental.com';

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
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'es-DO': '/es',
        'en-US': '/en',
      },
    },
    openGraph: {
      ...config.openGraph,
      url: `${baseUrl}/${lang}`,
      images: [
        {
          url: '/images/og-image-implants.jpg', // À créer
          width: 1200,
          height: 630,
          alt: config.openGraph.title,
        },
      ],
    },
    twitter: {
      ...config.twitter,
      images: ['/images/twitter-image-implants.jpg'], // À créer
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
    verification: {
      google: 'votre-code-verification-google', // À remplacer
      // yandex: 'votre-code-yandex',
      // bing: 'votre-code-bing',
    },
  };
}

// Structured Data (JSON-LD) pour le clinic
export function getDentalClinicStructuredData(lang: Language) {
  const isSpanish = lang === 'es';

  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': 'https://orthoprotesis-dental.com',
    name: 'Orthoprotesis Dental Clinic',
    alternateName: 'Dr. Francis Valerio - Orthoprotesis',
    description: isSpanish
      ? 'Clínica dental especializada en implantes dentales en Santiago, República Dominicana. Más de 30 años de experiencia.'
      : 'Dental clinic specialized in dental implants in Santiago, Dominican Republic. Over 30 years of experience.',
    url: 'https://orthoprotesis-dental.com',
    telephone: '+1-809-581-7059',
    email: 'info@orthoprotesisdental.com',
    priceRange: '$$',
    image: 'https://orthoprotesis-dental.com/images/clinic-exterior.jpg',
    logo: 'https://orthoprotesis-dental.com/logo.png',
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
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    areaServed: [
      {
        '@type': 'City',
        name: 'Santiago de los Caballeros',
      },
      {
        '@type': 'Country',
        name: 'Dominican Republic',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: isSpanish ? 'Servicios Dentales' : 'Dental Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalProcedure',
            name: isSpanish ? 'Implantes Dentales' : 'Dental Implants',
            description: isSpanish
              ? 'Implantes dentales de alta calidad con tecnología 3D y materiales FDA aprobados'
              : 'High-quality dental implants with 3D technology and FDA-approved materials',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalProcedure',
            name: isSpanish ? 'All-on-4 Implantes' : 'All-on-4 Implants',
            description: isSpanish
              ? 'Restauración completa con 4 implantes dentales'
              : 'Full mouth restoration with 4 dental implants',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalProcedure',
            name: isSpanish ? 'Prótesis Dentales' : 'Dental Prosthetics',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'MedicalTherapy',
            name: isSpanish ? 'Ortodoncia' : 'Orthodontics',
          },
        },
      ],
    },
    founder: {
      '@type': 'Person',
      name: 'Dr. Francis Valerio',
      jobTitle: isSpanish ? 'Doctor en Odontología' : 'Doctor of Dental Surgery',
      alumniOf: 'Universidad Autónoma de Santo Domingo',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [
      // À ajouter : liens vers réseaux sociaux
      // 'https://www.facebook.com/orthoprotesis',
      // 'https://www.instagram.com/orthoprotesis',
      // 'https://www.linkedin.com/company/orthoprotesis',
    ],
  };
}

// Breadcrumb structured data
export function getBreadcrumbStructuredData(lang: Language, path: string) {
  const baseUrl = 'https://orthoprotesis-dental.com';
  const isSpanish = lang === 'es';

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: isSpanish ? 'Inicio' : 'Home',
      item: `${baseUrl}/${lang}`,
    },
  ];

  if (path.includes('agendar-cita')) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: isSpanish ? 'Agendar Cita' : 'Book Appointment',
      item: `${baseUrl}/${lang}/agendar-cita`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };
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
