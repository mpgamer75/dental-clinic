import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@/app/globals.css';
import { fontVariables } from '@/app/fonts';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

/* ============================================================================
   THE ADMIN ROOT LAYOUT
   ----------------------------------------------------------------------------
   The second of the app's two root layouts. It exists so the public site can be
   statically generated: the single root layout this replaces read an `x-lang`
   request header to set <html lang>, and reading a Dynamic API in the root
   layout opts every route in the application out of static generation. Moving
   <html> down to (site)/[lang]/layout.tsx — the first layout that knows the
   locale from `params` rather than from a header — fixes that, and leaves
   /admin, which is not locale-prefixed, needing its own.

   `lang="es"` is hardcoded because the panel is Spanish-only. That is a product
   decision recorded in CLAUDE.md, not an oversight: the clinic's staff work in
   Spanish, and a half-translated admin is worse than an untranslated one.

   NOTE: this layout renders no chrome and performs no authentication. The
   security boundary is (admin)/admin/(panel)/layout.tsx, which is a server
   component that resolves the session and a staff row before returning any
   children. It has to sit below this one, because /admin/login must be reachable
   without a session and therefore cannot be inside the guarded group.
   ========================================================================== */

export const metadata: Metadata = {
  title: 'Panel · Orthoprotesis',
  /* Belt and braces with the per-page rules. The panel's RSC payload embeds
     patient names, emails and phone numbers; none of it belongs in an index. */
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
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
