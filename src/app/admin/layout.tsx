import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { AdminNav } from '@/components/admin/admin-nav';
import { generalUiStrings, contactDetails } from '@/lib/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeftToLine, LogOut, PanelLeft } from 'lucide-react';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Language } from '@/lib/types';

const lang: Language = 'es';
const adminStrings = generalUiStrings[lang];

async function signOut() {
  'use server';
  const supabase = createServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  
  // Vérifier l'authentification
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    redirect('/admin/login');
  }

  // Vérifier si l'utilisateur est admin
  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (adminError || !adminCheck) {
    console.error('User is not admin:', session.user.id);
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  const sidebarContent = (
    <>
      <nav className="flex flex-col gap-4 p-4 sm:py-5">
        <Link
          href={`/${lang}`}
          className="group flex h-9 w-full items-center justify-start rounded-lg bg-primary px-2 text-sm font-medium text-primary-foreground md:px-3"
          prefetch={false}
        >
          <ArrowLeftToLine className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="ml-2">{adminStrings.viewSite}</span>
        </Link>
        <AdminNav />
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5 print:hidden">
        <form action={signOut} className="w-full">
          <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            {adminStrings.logout}
          </Button>
        </form>
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
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {session.user.email}
                </span>
                <ThemeToggleButton />
              </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 bg-background">
              {children}
            </main>
            <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t bg-background sm:pl-64 print:hidden">
              &copy; {new Date().getFullYear()} {adminStrings.adminPanelTitle} - {contactDetails.clinicName[lang]}. Todos los derechos reservados.
            </footer>
          </div>
        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}