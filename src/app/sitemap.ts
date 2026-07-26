import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const currentDate = new Date();

  const languages = ['es', 'en'] as const;
  const routes: MetadataRoute.Sitemap = [];

  // Home + appointment page per language, with hreflang alternates.
  languages.forEach((lang) => {
    routes.push({
      url: `${baseUrl}/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'es-DO': `${baseUrl}/es`,
          'en-US': `${baseUrl}/en`,
          'x-default': `${baseUrl}/es`,
        },
      },
    });

    routes.push({
      url: `${baseUrl}/${lang}/agendar-cita`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          'es-DO': `${baseUrl}/es/agendar-cita`,
          'en-US': `${baseUrl}/en/agendar-cita`,
          'x-default': `${baseUrl}/es/agendar-cita`,
        },
      },
    });
  });

  // Privacy policy, which exists as a real route and was missing.
  languages.forEach((lang) => {
    routes.push({
      url: `${baseUrl}/${lang}/privacidad`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          'es-DO': `${baseUrl}/es/privacidad`,
          'en-US': `${baseUrl}/en/privacidad`,
          'x-default': `${baseUrl}/es/privacidad`,
        },
      },
    });
  });

  // NOTE: homepage section anchors (#servicios, #implantes, …) are deliberately
  // NOT listed.
  //
  // A fragment is not a distinct URL. Search engines strip the fragment, so the
  // twelve `/{lang}#section` entries that used to be emitted here collapsed to
  // two URLs already present above — the sitemap declared 16 URLs describing 6
  // documents, with conflicting priorities and changeFrequency for the same
  // page. That is a duplicate-URL signal, not extra coverage.

  return routes;
}
