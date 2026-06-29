import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Figtree, Noto_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

const fontHeading = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const fontBody = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
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