import type { Metadata } from 'next';
import '@/app/globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BackToTop } from '@/components/back-to-top';
import { MobileActionBar } from '@/components/layout/mobile-action-bar';
import { ScrollProgress } from '@/components/scroll-progress';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';
import type { Language } from '@/lib/types';
import { getHomeMetadata } from '@/lib/seo-config';

/**
 * Constrains the [lang] segment to the two locales that actually exist.
 *
 * Without this, any unmatched path fell through to the dynamic segment and was
 * used verbatim as a dictionary key — so `/apple-touch-icon.png`, `/.env` and
 * every bot probe for `/wp-login.php` produced a 500 (`faqItems['foo.bar']` is
 * undefined, and the SEO helper then called `.map` on it) instead of a 404.
 * Middleware skips any path containing a dot, so those never got the locale
 * redirect that would otherwise have caught them.
 *
 * `dynamicParams = false` makes the router 404 anything not listed here,
 * before a page component ever runs.
 */
export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}

export const dynamicParams = false;

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
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground focus:shadow-lg"
          >
            {lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}
          </a>
          <ScrollProgress />
          <Navbar />
          {/* Bottom padding on small screens reserves room for the fixed
              MobileActionBar so it never covers the footer's last row. */}
          <main id="main-content" className="flex-grow pb-[4.75rem] lg:pb-0">
            {children}
          </main>
          <Footer />
          <BackToTop />
          <MobileActionBar />
        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}

