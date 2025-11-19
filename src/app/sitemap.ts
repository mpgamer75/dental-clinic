import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orthoprotesis-dental.com';
  const currentDate = new Date();

  // Pages principales en espagnol et anglais
  const languages = ['es', 'en'] as const;

  const routes: MetadataRoute.Sitemap = [];

  // Page d'accueil pour chaque langue
  languages.forEach((lang) => {
    routes.push({
      url: `${baseUrl}/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          es: `${baseUrl}/es`,
          en: `${baseUrl}/en`,
        },
      },
    });

    // Page de prise de rendez-vous
    routes.push({
      url: `${baseUrl}/${lang}/agendar-cita`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          es: `${baseUrl}/es/agendar-cita`,
          en: `${baseUrl}/en/agendar-cita`,
        },
      },
    });
  });

  // Sections importantes de la page d'accueil (avec anchors)
  const sections = [
    { path: 'servicios', priority: 0.8 },
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
