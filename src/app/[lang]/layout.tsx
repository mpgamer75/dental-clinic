import type { Metadata } from 'next';
import '@/app/globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BackToTop } from '@/components/back-to-top';
import { ScrollProgress } from '@/components/scroll-progress';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';
import type { Language } from '@/lib/types';
import { getHomeMetadata } from '@/lib/seo-config';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang: Language = (resolvedParams?.lang === 'en' || resolvedParams?.lang === 'es') ? resolvedParams.lang as Language : 'es';

  // Utiliser la configuration SEO optimisée pour les implants dentaires
  return getHomeMetadata(lang);
}

export default async function LangLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}) {
  const resolvedParams = await params;
  const lang: Language = (resolvedParams?.lang === 'en' || resolvedParams?.lang === 'es') ? resolvedParams.lang as Language : 'es';
  
  return (
    <LanguageProvider initialLanguage={lang}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light" 
        enableSystem={false}
        disableTransitionOnChange
      >
        <div suppressHydrationWarning>
          <ScrollProgress />
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <BackToTop />
        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}

