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

  // Key on-page sections (anchored on the homepage).
  const sections = [
    { path: 'servicios', priority: 0.8 },
    { path: 'implantes', priority: 0.7 },
    { path: 'testimonios', priority: 0.7 },
    { path: 'preguntas-frecuentes', priority: 0.7 },
    { path: 'contacto', priority: 0.8 },
    { path: 'diplomas', priority: 0.6 },
  ];

  languages.forEach((lang) => {
    sections.forEach((section) => {
      routes.push({
        url: `${baseUrl}/${lang}#${section.path}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: section.priority,
      });
    });
  });

  return routes;
}
