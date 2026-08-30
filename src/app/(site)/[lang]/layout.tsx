import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@/app/globals.css';
import { fontVariables } from '@/app/fonts';
import { BackToTop } from '@/components/back-to-top';
import { Footer } from '@/components/layout/footer';
import { MobileActionBar } from '@/components/layout/mobile-action-bar';
import { Navbar } from '@/components/layout/navbar';
import { ScrollProgress } from '@/components/scroll-progress';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/language-context';
import { getHomeMetadata } from '@/lib/seo-config';
import type { Language } from '@/lib/types';

/* ============================================================================
   THE PUBLIC SITE'S ROOT LAYOUT
   ----------------------------------------------------------------------------
   This is a ROOT layout — it renders <html> and <body> — even though it sits
   two segments deep, because (site) and (admin) are route groups and each group
   gets its own root. That structure exists to delete one line.

   The previous single root layout at src/app/layout.tsx did:

       const requestHeaders = await headers();
       const lang = requestHeaders.get('x-lang') === 'en' ? 'en' : 'es';

   `headers()` is a Dynamic API, and reading one in the ROOT layout opts EVERY
   route in the application out of static generation. So the entire marketing
   site — eleven bands of copy that come from a TypeScript file — was
   server-rendered on every request and could never be cached at a CDN, in order
   to choose between two string literals. Every route in `next build` printed as
   ƒ (Dynamic).

   Here `lang` comes from `params`, which is a static input: `generateStaticParams`
   below enumerates both locales, so these pages prerender at build time.
   src/proxy.ts still sets the `x-lang` header, harmlessly — nothing reads it
   now, and it is what makes the redirect logic legible.
   ========================================================================== */

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
 * `dynamicParams = false` makes the router 404 anything not listed here, before
 * a page component ever runs.
 */
export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}

export const dynamicParams = false;

/** Narrow the raw segment to the union. Anything else is impossible given
 *  `dynamicParams = false`, but the router's type is still `string`. */
function toLanguage(value: string | undefined): Language {
  return value === 'en' ? 'en' : 'es';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return getHomeMetadata(toLanguage(lang));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = toLanguage(rawLang);

  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      {/* `flex flex-col` with `flex-1` on <main> is what holds the footer at the
          bottom of a short page. It used to be declared here and defeated one
          level down: body was the flex container, but its child was a plain
          <div>, so `flex-grow` on <main> resolved against a block parent and did
          nothing. On /privacidad and every error state the footer floated
          mid-viewport. The wrapper div is gone — body is the flex container it
          always claimed to be. */}
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        {/* ONE ThemeProvider. There were two — this one and another in the root
            layout — with different storage keys, both stamping a class on
            <html>. Whichever ran second won the class, and the key that got
            written was not the key that got read, so the theme never survived a
            reload. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="orthoprotesis-theme"
        >
          <LanguageProvider initialLanguage={lang}>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground focus:shadow-e3"
            >
              {lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}
            </a>
            <ScrollProgress />
            <Navbar />
            {/* `tabIndex={-1}` so the skip link actually moves focus. Chrome and
                Firefox set the sequential-focus starting point from a fragment
                link to a non-focusable element; Safari does not, so without this
                the link scrolled and the next Tab went back to the header.

                No bottom padding for the MobileActionBar here: <main> is the
                footer's SIBLING, so its padding never protected the footer from
                the fixed bar. The clearance lives in the footer now, where it
                also accounts for env(safe-area-inset-bottom). */}
            <main id="main-content" tabIndex={-1} className="flex-1">
              {children}
            </main>
            <Footer />
            <BackToTop />
            <MobileActionBar />
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
