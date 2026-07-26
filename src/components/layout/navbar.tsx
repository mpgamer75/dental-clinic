'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contactDetails, generalUiStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

export function Navbar() {
  const { lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const ui = generalUiStrings[lang];
  const homeHref = `/${lang}`;
  const appointmentsHref = `/${lang}/agendar-cita`;
  const phone = contactDetails.phone[lang];
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;

  const navLinks = [
    { href: `/${lang}#implantes`, label: lang === 'es' ? 'Implantes' : 'Implants' },
    { href: `/${lang}#servicios`, label: ui.services },
    { href: `/${lang}#el-doctor`, label: lang === 'es' ? 'El doctor' : 'The doctor' },
    { href: `/${lang}#testimonios`, label: ui.testimonials },
    { href: `/${lang}#preguntas-frecuentes`, label: ui.faq },
    { href: `/${lang}#contacto`, label: ui.contact },
  ];

  // Only the bare /{lang} route gets a persistent highlight; the hash links all
  // share that base, so highlighting on prefix would light them all at once.
  const isActive = (href: string) => !href.includes('#') && pathname === href;

  const switchLangLabel = lang === 'es' ? 'Switch to English' : 'Cambiar a Español';

  // Close the mobile panel on Escape and on any outside click, and return
  // focus to the toggle so keyboard users aren't stranded.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // Close the panel when the route changes (e.g. an anchor link was followed).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-header w-full border-b border-line/70 bg-canvas/85 backdrop-blur-lg supports-[backdrop-filter]:bg-canvas/70">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
        {/* Wordmark.

            `min-w-0` + `truncate` rather than `shrink-0`: at 320px the mark,
            the wordmark and the control cluster together exceeded the viewport
            and pushed the page into horizontal scroll. The wordmark is the
            right thing to give way, so it truncates while the controls keep
            their full 44px hit targets. */}
        <Link
          href={homeHref}
          className="group flex min-w-0 items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:gap-3"
        >
          <span className="relative h-9 w-9 shrink-0 sm:h-10 sm:w-10">
            <Image
              src="/images/logo_valerio.png"
              alt=""
              fill
              className="object-contain transition-transform duration-base ease-out-quart group-hover:scale-105 dark:brightness-0 dark:invert"
              priority
              sizes="40px"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-heading text-base font-medium text-ink sm:text-lg">
              Orthoprotesis
            </span>
            <span className="mt-0.5 hidden truncate text-[0.7rem] text-ink-faint sm:block">
              {lang === 'es' ? 'Odontología especializada' : 'Specialist dentistry'}
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label={lang === 'es' ? 'Principal' : 'Main'}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors duration-fast',
                isActive(link.href)
                  ? 'font-medium text-terracotta'
                  : 'text-ink-soft hover:bg-canvas-sunk hover:text-ink',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <a
            href={telHref}
            className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-soft transition-colors duration-fast hover:text-terracotta xl:inline-flex"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span className="tabular">{phone}</span>
          </a>

          <ThemeToggleButton />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            aria-label={switchLangLabel}
            title={switchLangLabel}
            className="text-xs font-semibold tracking-wide"
          >
            {lang === 'es' ? 'EN' : 'ES'}
          </Button>

          <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
            <Link href={appointmentsHref}>{ui.appointments}</Link>
          </Button>

          <Button
            ref={toggleRef}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={
              open
                ? lang === 'es'
                  ? 'Cerrar menú'
                  : 'Close menu'
                : lang === 'es'
                  ? 'Abrir menú'
                  : 'Open menu'
            }
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div
          ref={panelRef}
          id="mobile-nav"
          className="border-t border-line bg-canvas lg:hidden"
        >
          <nav
            className="mx-auto flex w-full max-w-7xl flex-col px-5 py-3 sm:px-8"
            aria-label={lang === 'es' ? 'Principal' : 'Main'}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3.5 text-ink transition-colors duration-fast hover:bg-canvas-sunk"
              >
                {link.label}
              </Link>
            ))}

            <a
              href={telHref}
              className="mt-1 flex items-center gap-2 rounded-md px-3 py-3.5 text-ink transition-colors duration-fast hover:bg-canvas-sunk"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span className="tabular">{phone}</span>
            </a>

            <Button asChild size="lg" className="mt-3">
              <Link href={appointmentsHref} onClick={() => setOpen(false)}>
                {ui.appointments}
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
