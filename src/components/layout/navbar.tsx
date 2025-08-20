'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generalUiStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const { lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .single();
      
      setIsAdmin(!error && !!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      router.push(`/${lang}`);
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const uiStrings = generalUiStrings[lang];
  const homeHref = `/${lang}`;
  const appointmentsHref = `/${lang}/agendar-cita`;
  const servicesHref = `/${lang}#servicios`;
  const faqHref = `/${lang}#preguntas-frecuentes`;
  const testimonialsHref = `/${lang}#testimonios`;
  const contactHref = `/${lang}#contacto`;

  const isActive = (href: string) => {
    const baseHref = href.split('#')[0];
    return pathname === baseHref || pathname?.startsWith(baseHref);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={homeHref} className="flex items-center gap-2 group">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary transition-transform group-hover:scale-110"
              >
                <path d="M6.3 5.2A9 9 0 0 1 12 3a9 9 0 0 1 5.7 2.2" />
                <path d="M10.2 17.1a9 9 0 0 1-3.9-12" />
                <path d="M13.8 7a9 9 0 0 1 3.9 12" />
                <path d="M17.7 18.8A9 9 0 0 1 12 21a9 9 0 0 1-5.7-2.2" />
                <path d="M12 12h.01" />
              </svg>
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:inline">
              Orthoprotesis
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <Link 
            href={homeHref} 
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all hover:bg-accent hover:text-accent-foreground ${
              isActive(homeHref) ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            {uiStrings.home}
          </Link>
          <Link 
            href={servicesHref} 
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all hover:bg-accent hover:text-accent-foreground ${
              isActive(servicesHref) ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            {uiStrings.services}
          </Link>
          <Link 
            href={faqHref} 
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all hover:bg-accent hover:text-accent-foreground ${
              isActive(faqHref) ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            {uiStrings.faq}
          </Link>
          <Link 
            href={testimonialsHref} 
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all hover:bg-accent hover:text-accent-foreground ${
              isActive(testimonialsHref) ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            {uiStrings.testimonials}
          </Link>
          <Link 
            href={contactHref} 
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all hover:bg-accent hover:text-accent-foreground ${
              isActive(contactHref) ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            {uiStrings.contact}
          </Link>
          <Link href={appointmentsHref} className="ml-2">
            <Button size="sm" className="shadow-sm hover:shadow-md transition-all">
              {uiStrings.appointments}
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleLanguage} 
            className="h-9 w-9 font-semibold hover:bg-accent"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </Button>
          
          {/* Admin Section */}
          {!isLoading && (
            <>
              {user && isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.email}</p>
                        <Badge variant="secondary" className="mt-1 w-fit">Admin</Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        {lang === 'es' ? 'Panel Admin' : 'Admin Panel'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      {lang === 'es' ? 'Cerrar sesión' : 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/admin/login">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9 hover:bg-accent"
                    title={lang === 'es' ? 'Administración' : 'Administration'}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-lg py-4">
          <nav className="container flex flex-col space-y-2 px-4">
            <Link 
              href={homeHref} 
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors" 
              onClick={closeMenu}
            >
              {uiStrings.home}
            </Link>
            <Link 
              href={servicesHref} 
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors" 
              onClick={closeMenu}
            >
              {uiStrings.services}
            </Link>
            <Link 
              href={faqHref} 
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors" 
              onClick={closeMenu}
            >
              {uiStrings.faq}
            </Link>
            <Link 
              href={testimonialsHref} 
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors" 
              onClick={closeMenu}
            >
              {uiStrings.testimonials}
            </Link>
            <Link 
              href={contactHref} 
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors" 
              onClick={closeMenu}
            >
              {uiStrings.contact}
            </Link>
            <Link href={appointmentsHref} onClick={closeMenu}>
              <Button size="sm" className="w-full">{uiStrings.appointments}</Button>
            </Link>
            
            {/* Admin Section for Mobile */}
            {!isLoading && (
              <div className="pt-2 border-t space-y-2">
                {user && isAdmin ? (
                  <>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        </div>
                      </div>
                    </div>
                    <Link href="/admin" onClick={closeMenu}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        {lang === 'es' ? 'Panel Admin' : 'Admin Panel'}
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-destructive" 
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {lang === 'es' ? 'Cerrar sesión' : 'Logout'}
                    </Button>
                  </>
                ) : (
                  <Link href="/admin/login" onClick={closeMenu}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      {lang === 'es' ? 'Administración' : 'Administration'}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}