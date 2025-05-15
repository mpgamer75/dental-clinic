'use client'; // Required for hooks like useState, useEffect, useRouter

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminNav } from '@/components/admin/admin-nav';
import { generalUiStrings, contactDetails } from '@/lib/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftToLine, LogOut, Loader2, PanelLeft } from 'lucide-react';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import type { Language } from '@/lib/types';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Admin panel will be primarily in Spanish as requested.
const lang: Language = 'es';
const adminStrings = generalUiStrings[lang];

// Metadata needs to be static or generated in a generateMetadata function for server components
// export const metadata: Metadata = {
//   title: `${adminStrings.adminPanelTitle} - Orthoprotesis Dental Clinic`,
//   description: `Panel de administración para ${adminStrings.appointmentsTitle}, ${adminStrings.messagesTitle}, y ${adminStrings.testimonialsTitle}.`,
//   robots: 'noindex, nofollow',
// };

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          setIsAuthenticatedAdmin(false);
        } else if (!session) {
          setIsAuthenticatedAdmin(false);
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
          }
        } else {
          const user = session.user;
          if (user?.user_metadata?.role === 'admin_role') {
            setIsAuthenticatedAdmin(true);
            // If user is admin and on login page, redirect to admin dashboard
            if (pathname === '/admin/login') {
                router.replace('/admin');
            }
          } else {
            setIsAuthenticatedAdmin(false);
            await supabase.auth.signOut(); // Sign out if not admin
            if (pathname !== '/admin/login') {
              router.replace('/admin/login');
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        setIsAuthenticatedAdmin(false);
        if (pathname !== '/admin/login' && isMounted) {
           router.replace('/admin/login');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const user = session?.user;
      if (user?.user_metadata?.role === 'admin_role') {
        setIsAuthenticatedAdmin(true);
        if (pathname === '/admin/login') { // If somehow on login page after an auth state change signifies admin
            router.replace('/admin');
        }
      } else {
        setIsAuthenticatedAdmin(false);
        if (pathname !== '/admin/login' && !pathname.startsWith('/admin/login')) { // Avoid redirect loop if already on or going to login
          router.replace('/admin/login');
        }
      }
       // Update loading state only if it hasn't been set by the initial check or if on login page.
      if (pathname === '/admin/login' && !session) {
        setIsLoading(false);
      } else if (pathname !== '/admin/login' && isLoading && (session || _event === 'SIGNED_OUT')) {
        // if not on login page and still loading, but we have session info or signed out, finish loading
        // this scenario is less likely if initial checkAuth is robust
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname, isLoading]); // isLoading included for the missing dependency

  const handleLogout = async () => {
    setIsLoading(true); // Optional: show loading on logout action
    await supabase.auth.signOut();
    setIsAuthenticatedAdmin(false); // Explicitly set state
    router.push('/admin/login'); // Use push for logout to allow back navigation if desired, or replace
    // setIsLoading(false); // Loading will be handled by the effect on path change
  };

  // If on the login page, render children directly with minimal providers
  // The useEffect will still run to redirect if already logged in as admin
  if (pathname === '/admin/login') {
    return (
      <LanguageProvider initialLanguage={lang}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {isLoading && (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && children}
        </ThemeProvider>
      </LanguageProvider>
    );
  }


  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando panel de administración...</p>
      </div>
    );
  }

  // If not loading and not authenticated admin (and not on login page - handled above)
  // This state should ideally be covered by the redirect in useEffect,
  // but as a fallback or during brief transition.
  if (!isAuthenticatedAdmin) {
     // The useEffect should have redirected. If we reach here, it's likely a brief moment before redirect.
     // Or, if redirects are failing, this could be a fallback.
     // Showing a loader or a minimal "redirecting" message can be better than "access denied" if redirect is imminent.
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando acceso...</p>
        </div>
    );
  }
  
  const sidebarContent = (
    <>
      <nav className="flex flex-col gap-4 p-4 sm:py-5">
        <Link
          href={`/${lang}`} // Points to public homepage, e.g. /es
          className="group flex h-9 w-full items-center justify-start rounded-lg bg-primary px-2 text-sm font-medium text-primary-foreground md:px-3"
          prefetch={false}
        >
          <ArrowLeftToLine className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="ml-2">{adminStrings.viewSite}</span>
        </Link>
        <AdminNav />
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5 print:hidden">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          {adminStrings.logout}
        </Button>
      </nav>
    </>
  );


  return (
    <LanguageProvider initialLanguage={lang}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="flex min-h-screen w-full flex-col bg-muted/40 print:hidden">
          <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex print:hidden">
            <div className="flex h-full max-h-screen flex-col gap-2">
                {sidebarContent}
            </div>
          </aside>
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 print:hidden">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline" className="sm:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs bg-background p-0 w-60">
                  <div className="flex h-full flex-col">
                    {sidebarContent}
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-semibold text-primary">{adminStrings.adminPanelTitle}</h1>
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggleButton />
              </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 bg-background">
              {children}
            </main>
             <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t bg-background sm:pl-64 print:hidden">
                &copy; {new Date().getFullYear()} {generalUiStrings[lang].adminPanelTitle} - {contactDetails.clinicName[lang]}. Todos los derechos reservados.
            </footer>
          </div>
        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}
