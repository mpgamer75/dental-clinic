'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generalUiStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useState } from 'react';

export function Navbar() {
  const { lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const uiStrings = generalUiStrings[lang];
  const homeHref = `/${lang}`;
  const appointmentsHref = `/${lang}/agendar-cita`;
  const servicesHref = `/${lang}/servicios`;
  const faqHref = `/${lang}/preguntas-frecuentes`;
  const testimonialsHref = `/${lang}/testimonios`;
  const contactHref = `/${lang}/contacto`;

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={homeHref} className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M6.3 5.2A9 9 0 0 1 12 3a9 9 0 0 1 5.7 2.2" />
              <path d="M10.2 17.1a9 9 0 0 1-3.9-12" />
              <path d="M13.8 7a9 9 0 0 1 3.9 12" />
              <path d="M17.7 18.8A9 9 0 0 1 12 21a9 9 0 0 1-5.7-2.2" />
              <path d="M12 12h.01" />
            </svg>
            <span className="text-lg font-semibold hidden sm:inline">Orthoprotesis</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          <Link href={homeHref} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(homeHref) ? 'text-primary' : ''}`}>
            {uiStrings.home}
          </Link>
          <Link href={servicesHref} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(servicesHref) ? 'text-primary' : ''}`}>
            {uiStrings.services}
          </Link>
          <Link href={faqHref} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(faqHref) ? 'text-primary' : ''}`}>
            {uiStrings.faq}
          </Link>
          <Link href={testimonialsHref} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(testimonialsHref) ? 'text-primary' : ''}`}>
            {uiStrings.testimonials}
          </Link>
          <Link href={contactHref} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(contactHref) ? 'text-primary' : ''}`}>
            {uiStrings.contact}
          </Link>
          <Link href={appointmentsHref} className="text-sm">
            <Button size="sm">{uiStrings.appointments}</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <Button variant="outline" size="icon" onClick={toggleLanguage} className="h-8 w-8">
            {lang === 'es' ? 'EN' : 'ES'}
          </Button>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background py-4">
          <nav className="container flex flex-col space-y-4 px-4">
            <Link href={homeHref} className="text-sm font-medium" onClick={closeMenu}>
              {uiStrings.home}
            </Link>
            <Link href={servicesHref} className="text-sm font-medium" onClick={closeMenu}>
              {uiStrings.services}
            </Link>
            <Link href={faqHref} className="text-sm font-medium" onClick={closeMenu}>
              {uiStrings.faq}
            </Link>
            <Link href={testimonialsHref} className="text-sm font-medium" onClick={closeMenu}>
              {uiStrings.testimonials}
            </Link>
            <Link href={contactHref} className="text-sm font-medium" onClick={closeMenu}>
              {uiStrings.contact}
            </Link>
            <Link href={appointmentsHref} className="text-sm" onClick={closeMenu}>
              <Button size="sm" className="w-full">{uiStrings.appointments}</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
} 