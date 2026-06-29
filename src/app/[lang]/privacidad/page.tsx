import type { Metadata } from 'next';
import { privacyPolicy } from '@/lib/data';
import type { Language } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Language = raw === 'en' ? 'en' : 'es';
  const content = privacyPolicy[lang];
  return {
    title: `${content.title} — Orthoprotesis Dental Clinic`,
    description: content.intro,
    alternates: {
      canonical: `/${lang}/privacidad`,
      languages: {
        'es-DO': '/es/privacidad',
        'en-US': '/en/privacidad',
        'x-default': '/es/privacidad',
      },
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang: Language = raw === 'en' ? 'en' : 'es';
  const content = privacyPolicy[lang];

  return (
    <section className="bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{content.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{content.intro}</p>

        <div className="mt-10 space-y-8">
          {content.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-xl font-semibold text-foreground">{s.heading}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}

          <div className="rounded-xl border border-border bg-secondary/40 p-6">
            <h2 className="text-xl font-semibold text-foreground">{content.contactHeading}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{content.contactBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
