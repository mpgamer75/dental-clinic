import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Piazzolla, Archivo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

/**
 * Piazzolla (Huerta Tipográfica, Buenos Aires) — bookish humanist serif with a
 * real optical-size axis. Carries headings and pull-quotes. Its Spanish
 * diacritics and ¿ ¡ are drawn, not bolted on, which matters when the primary
 * language is Spanish.
 *
 * Archivo (Omnibus-Type, Buenos Aires) — sturdy grotesk for UI, body, forms and
 * data. Paired with Piazzolla on the serif↔grotesk contrast axis rather than
 * two near-identical sans faces.
 */
const fontHeading = Piazzolla({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  axes: ['opsz'],
});

const fontBody = Archivo({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Métadonnées de base, les métadonnées spécifiques à la langue seront dans [lang]/layout.tsx
export const metadata: Metadata = {
  title: 'Orthoprotesis Dental Clinic',
  description: 'Clínica dental especializada Orthoprotesis. Specialized dental clinic Orthoprotesis.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The active locale is forwarded by middleware so the document language is
  // correct for SEO and screen readers (e.g. /en pages render lang="en").
  const requestHeaders = await headers();
  const lang = requestHeaders.get('x-lang') === 'en' ? 'en' : 'es';

  return (
    <html lang={lang} className={`${fontHeading.variable} ${fontBody.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans flex flex-col min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="orthoprotesis-theme"
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}