'use client';

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
        console.log('🔍 Layout: Vérification auth pour:', pathname);
        
        // Éviter les vérifications pour les routes publiques
        if (pathname === '/admin/login') {
          console.log('📋 Layout: Page de login, pas de vérification auth');
          setIsLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        console.log('📋 Layout: Session:', session ? 'Trouvée' : 'Pas de session');

        if (sessionError) {
          console.error('❌ Layout: Error fetching session:', sessionError);
          setIsAuthenticatedAdmin(false);
        } else if (!session) {
          console.log('❌ Layout: Pas de session, redirection vers login');
          setIsAuthenticatedAdmin(false);
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
          }
        } else {
          // Vérifier dans la table admin_users
          try {
            console.log('🔍 Layout: Vérification admin_users pour:', session.user.id);
            
            const { data: adminCheck, error: adminError } = await supabase
              .from('admin_users')
              .select('id')
              .eq('id', session.user.id)
              .single();

            console.log('📋 Layout: Admin check result:', adminCheck);
            console.log('📋 Layout: Admin check error:', adminError);

            if (adminError && adminError.code !== 'PGRST116') {
              console.error('❌ Layout: Admin check error:', adminError);
              setIsAuthenticatedAdmin(false);
              if (pathname !== '/admin/login') {
                router.replace('/admin/login');
              }
              return;
            }

            if (adminCheck) {
              console.log('✅ Layout: Utilisateur admin vérifié');
              setIsAuthenticatedAdmin(true);
              if (pathname === '/admin/login') {
                router.replace('/admin');
              }
            } else {
              console.log('❌ Layout: Utilisateur non admin, déconnexion');
              setIsAuthenticatedAdmin(false);
              await supabase.auth.signOut();
              if (pathname !== '/admin/login') {
                router.replace('/admin/login');
              }
            }
          } catch (adminCheckError) {
            console.error('❌ Layout: Error checking admin status:', adminCheckError);
            setIsAuthenticatedAdmin(false);
            if (pathname !== '/admin/login') {
              router.replace('/admin/login');
            }
          }
        }
      } catch (error) {
        console.error('❌ Layout: Unexpected error during auth check:', error);
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔄 Layout: Auth state change:', event, session ? 'Session exists' : 'No session');

      if (session?.user) {
        // Vérifier dans admin_users
        try {
          const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (adminCheck) {
            console.log('✅ Layout: Auth change - admin vérifié');
            setIsAuthenticatedAdmin(true);
            if (pathname === '/admin/login') {
              router.replace('/admin');
            }
          } else {
            console.log('❌ Layout: Auth change - non admin');
            setIsAuthenticatedAdmin(false);
            if (pathname !== '/admin/login') {
              router.replace('/admin/login');
            }
          }
        } catch (error) {
          console.error('❌ Layout: Auth state change admin check error:', error);
          setIsAuthenticatedAdmin(false);
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
          }
        }
      } else {
        console.log('❌ Layout: Auth change - pas de session');
        setIsAuthenticatedAdmin(false);
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    console.log('🚪 Layout: Déconnexion...');
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsAuthenticatedAdmin(false);
    router.push('/admin/login');
  };

  // Si on est sur la page de login, render minimal
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando panel de administración...</p>
      </div>
    );
  }

  // Si pas authentifié et pas sur login
  if (!isAuthenticatedAdmin) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando acceso...</p>
        </div>
    );
  }
  
  // Interface admin complète
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