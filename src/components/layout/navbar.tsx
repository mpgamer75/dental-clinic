'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generalUiStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useState } from 'react';

export function Navbar() {
  const { lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/98 shadow-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-3 group">
          <div className="relative">
            {/* Background effect */}
            <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Logo container */}
            <div className="relative bg-primary p-2.5 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
          
          {/* Text logo - COLOR UNIFORME */}
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary hidden sm:inline transition-colors duration-300">
              Orthoprotesis
            </span>
            <span className="text-[10px] text-muted-foreground/80 hidden lg:inline font-medium tracking-wide">
              CLÍNICA DENTAL PROFESIONAL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link 
            href={homeHref} 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive(homeHref) 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {uiStrings.home}
          </Link>
          <Link 
            href={servicesHref} 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive(servicesHref) 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {uiStrings.services}
          </Link>
          <Link 
            href={faqHref} 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive(faqHref) 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {uiStrings.faq}
          </Link>
          <Link 
            href={testimonialsHref} 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive(testimonialsHref) 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {uiStrings.testimonials}
          </Link>
          <Link 
            href={contactHref} 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive(contactHref) 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground/80 hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {uiStrings.contact}
          </Link>
          
          {/* CTA Button */}
          <Link href={appointmentsHref} className="ml-4">
            <Button 
              size="sm" 
              className="relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-xl transition-all duration-300 font-semibold px-6 py-5 hover:scale-[1.02] group"
            >
              <span className="relative z-10">{uiStrings.appointments}</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/40">
            <ThemeToggleButton />
            
            {/* Language Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleLanguage}
              className="h-8 w-8 text-xs font-bold hover:bg-accent transition-colors"
              aria-label="Toggle language"
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </Button>
          </div>
          
          {/* Admin Icon */}
          <Link href="/admin">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-primary/10 transition-all duration-200 group"
              aria-label="Admin"
            >
              <ShieldCheck className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </Button>
          </Link>
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-9 w-9 hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 transition-transform duration-200 rotate-90" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background animate-in slide-in-from-top-2 duration-200">
          <nav className="container flex flex-col gap-1 py-4 px-4">
            <Link 
              href={homeHref} 
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive(homeHref) 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {uiStrings.home}
            </Link>
            <Link 
              href={servicesHref} 
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive(servicesHref) 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {uiStrings.services}
            </Link>
            <Link 
              href={faqHref} 
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive(faqHref) 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {uiStrings.faq}
            </Link>
            <Link 
              href={testimonialsHref} 
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive(testimonialsHref) 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {uiStrings.testimonials}
            </Link>
            <Link 
              href={contactHref} 
              className={`px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive(contactHref) 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {uiStrings.contact}
            </Link>
            
            {/* Mobile Language Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                toggleLanguage();
                setIsMenuOpen(false);
              }}
              className="mt-2 w-full justify-center"
            >
              {lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            </Button>
            
            {/* Mobile CTA */}
            <Link href={appointmentsHref} onClick={() => setIsMenuOpen(false)}>
              <Button 
                size="sm" 
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md font-medium py-6"
              >
                {uiStrings.appointments}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
