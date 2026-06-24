'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generalUiStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function Navbar() {
  const { lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const uiStrings = generalUiStrings[lang];
  const homeHref = `/${lang}`;
  const appointmentsHref = `/${lang}/agendar-cita`;

  const navLinks = [
    { href: homeHref, label: uiStrings.home },
    { href: `/${lang}#servicios`, label: uiStrings.services },
    { href: `/${lang}#preguntas-frecuentes`, label: uiStrings.faq },
    { href: `/${lang}#testimonios`, label: uiStrings.testimonials },
    { href: `/${lang}#contacto`, label: uiStrings.contact },
  ];

  // Only the bare /{lang} home route gets a persistent highlight; the hash
  // links all share that base, so they should not all light up at once.
  const isActive = (href: string) => !href.includes('#') && pathname === href;

  const switchLangLabel = lang === 'es' ? 'Switch to English' : 'Cambiar a Español';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-background/65">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href={homeHref} className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl bg-primary/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative overflow-hidden rounded-xl shadow-sm ring-1 ring-primary/10 transition-all duration-300 group-hover:shadow-md group-hover:ring-primary/25">
              <div className="relative h-12 w-12">
                <Image
                  src="/images/logo_valerio.png"
                  alt="Orthoprotesis Dental Clinic"
                  fill
                  className="object-contain p-1 dark:brightness-110"
                  priority
                  sizes="48px"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="hidden font-heading text-xl font-bold text-primary sm:inline">
              Orthoprotesis
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:inline">
              Clínica Dental
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label={uiStrings.home}>
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm transition-colors duration-200',
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'font-medium text-foreground/75 hover:bg-accent hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <Link href={appointmentsHref} className="ml-3">
            <Button
              size="sm"
              className="btn-shine bg-primary px-6 py-5 font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-primary/90 hover:shadow-md"
            >
              {uiStrings.appointments}
            </Button>
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
            <ThemeToggleButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="h-8 w-8 text-xs font-bold hover:bg-accent"
              aria-label={switchLangLabel}
              title={switchLangLabel}
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </Button>
          </div>

          <Link href="/admin" className="hidden sm:inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="group h-9 w-9 hover:bg-primary/10"
              aria-label="Admin"
            >
              <ShieldCheck className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-accent md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-lg duration-200 animate-in slide-in-from-top-2 md:hidden">
          <nav className="container flex flex-col gap-1 px-4 py-4" aria-label={uiStrings.home}>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'hover:bg-accent',
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toggleLanguage();
                setIsMenuOpen(false);
              }}
              className="mt-2 w-full justify-center"
            >
              {switchLangLabel}
            </Button>

            <Link href={appointmentsHref} onClick={() => setIsMenuOpen(false)}>
              <Button
                size="sm"
                className="mt-2 w-full bg-primary py-6 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
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
