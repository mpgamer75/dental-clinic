'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { contactDetails, generalUiStrings, formCommon } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';

export function Footer() {
  const { lang } = useLanguage();
  const currentYear = new Date().getFullYear();
  const ui = generalUiStrings[lang];
  const footer = contactDetails.footer[lang];

  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];
  const address = contactDetails.address[lang];
  const phone = contactDetails.phone[lang];
  const email = contactDetails.email[lang];
  const schedule = contactDetails.schedule[lang];
  const mapLink = contactDetails.mapLink[lang];

  const homeHref = `/${lang}`;
  const appointmentsHref = `/${lang}/agendar-cita`;

  const quickLinks = [
    { href: homeHref, label: ui.home },
    { href: `/${lang}#servicios`, label: ui.services },
    { href: `/${lang}#preguntas-frecuentes`, label: ui.faq },
    { href: `/${lang}#testimonios`, label: ui.testimonials },
    { href: `/${lang}#contacto`, label: ui.contact },
  ];

  const navLabel = lang === 'es' ? 'Navegación' : 'Navigation';
  const headingClass =
    'mb-4 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60';

  return (
    <footer className="relative bg-secondary text-secondary-foreground print:hidden">
      {/* Brand accent rule */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-highlight to-primary" aria-hidden="true" />

      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-12">
        {/* Brand + CTA */}
        <div className="lg:col-span-4">
          <Link href={homeHref} className="mb-4 inline-flex items-center gap-2">
            <span className="font-heading text-2xl font-bold text-primary">{clinicName}</span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-secondary-foreground/80">
            {footer.tagline.replace('{{doctorName}}', doctorName)}
          </p>
          <Link href={appointmentsHref} className="mt-5 inline-block">
            <Button
              size="sm"
              className="btn-shine bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {ui.appointments}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Quick links */}
        <nav aria-label={navLabel} className="lg:col-span-2">
          <h3 className={headingClass}>{navLabel}</h3>
          <ul className="space-y-2.5 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-secondary-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div className="lg:col-span-3">
          <h3 className={headingClass}>{footer.quickContact}</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-highlight" />
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {address}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-highlight" />
              <a
                href={`tel:${phone}`}
                className="text-secondary-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-highlight" />
              <a
                href={`mailto:${email}`}
                className="break-all text-secondary-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {email}
              </a>
            </li>
          </ul>
        </div>

        {/* Schedule */}
        <div className="lg:col-span-3">
          <h3 className={headingClass}>{footer.scheduleTitle}</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-secondary-foreground/80">
            {schedule}
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60">
        <div className="container mx-auto flex flex-col items-center gap-1 px-4 py-6 text-center text-xs text-secondary-foreground/70 md:px-6">
          <p>
            {footer.copyright
              .replace('{{year}}', currentYear.toString())
              .replace('{{clinicName}}', clinicName)}
          </p>
          <p>{footer.doctorAttribution.replace('{{doctorName}}', doctorName)}</p>
          <p>
            <Link
              href={`/${lang}/privacidad`}
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {formCommon[lang].privacyLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
