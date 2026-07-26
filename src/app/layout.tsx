import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Newsreader, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

/**
 * Newsreader (Production Type) — headings, pull-quotes, display.
 *
 * Chosen over the previous Piazzolla for one measurable reason: Piazzolla's
 * optical-size axis stops at 30, so an 88px hero headline was a 30pt TEXT
 * master scaled up, and its stroke contrast is a near-monolinear ~1.5:1 at
 * every size — at display sizes that reads as an even grey slab rather than a
 * drawn letter. Newsreader runs opsz 6–72 and its contrast modulates from
 * ~2.1:1 to ~4.6:1 as size rises, which is the whole reason display serifs
 * look expensive. Optical sizing is free via the CSS default
 * `font-optical-sizing: auto` — do NOT set `font-variation-settings: 'opsz'`,
 * which disables it and also overrides font-weight.
 *
 * Its digits are monowidth by default, which matters here: the stat counters,
 * phone numbers and diploma years all carry `.tabular`.
 *
 * Instrument_Sans (Rodrigo Fuenzalida / Jordan Egstad) — body, UI, forms.
 * Paired on the serif↔grotesk axis. Its `wdth` 75–100 axis is genuinely useful
 * for Spanish, which runs 20–25% longer than English.
 *
 * `latin-ext` is loaded alongside `latin` — Latin-1 already covers ñ á é í ó ú
 * ü ¿ ¡, but patient and doctor names are not guaranteed to stay inside it.
 */
const fontHeading = Newsreader({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
});

const fontBody = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
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