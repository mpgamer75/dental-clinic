'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, Lock } from 'lucide-react';
import { contactDetails, generalUiStrings, formCommon } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';

export function Footer() {
  const { lang } = useLanguage();
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
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: `/${lang}#implantes`, label: lang === 'es' ? 'Implantes' : 'Implants' },
    { href: `/${lang}#servicios`, label: ui.services },
    { href: `/${lang}#el-doctor`, label: lang === 'es' ? 'El doctor' : 'The doctor' },
    // The desktop bar was trimmed from six links to five and Testimonios was
    // the one dropped. It lives in the mobile overlay's secondary list, but
    // that panel is xl:hidden — so without this entry the section had no route
    // in from anywhere at >=1280px.
    { href: `/${lang}#testimonios`, label: ui.testimonials },
    { href: `/${lang}#preguntas-frecuentes`, label: ui.faq },
    { href: `/${lang}#contacto`, label: ui.contact },
  ];

  const navLabel = lang === 'es' ? 'Navegación' : 'Navigation';
  const headingClass = 'mb-4 font-heading text-base font-medium text-drench-on';
  const linkClass =
    'text-drench-on/70 underline-offset-4 transition-colors duration-fast hover:text-brass hover:underline';

  return (
    <footer className="drenched-deep print:hidden">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-x-10 gap-y-11 px-5 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-4">
          <Link
            href={homeHref}
            className="font-heading text-2xl font-medium text-drench-on underline-offset-4 hover:underline"
          >
            {clinicName}
          </Link>
          <p className="mt-4 max-w-sm leading-relaxed text-drench-on/70">
            {footer.tagline.replace('{{doctorName}}', doctorName)}
          </p>
          <Button asChild variant="brass" size="lg" className="mt-6">
            <Link href={appointmentsHref}>{ui.appointments}</Link>
          </Button>
        </div>

        {/* Navigation */}
        <nav aria-label={navLabel} className="lg:col-span-3">
          <h2 className={headingClass}>{navLabel}</h2>
          <ul className="space-y-2.5">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div className="lg:col-span-3">
          <h2 className={headingClass}>{footer.quickContact}</h2>
          <ul className="space-y-3.5">
            <li className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
              <a href={mapLink} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {address}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
              <a href={telHref} className={`${linkClass} tabular`}>
                {phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
              <a href={`mailto:${email}`} className={`${linkClass} break-all`}>
                {email}
              </a>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div className="lg:col-span-2">
          <h2 className={headingClass}>{footer.scheduleTitle}</h2>
          <p className="whitespace-pre-line leading-relaxed text-drench-on/70">{schedule}</p>
        </div>
      </div>

      <div className="border-t border-drench-on/15">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-drench-on/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            {footer.copyright
              .replace('{{year}}', String(year))
              .replace('{{clinicName}}', clinicName)}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href={`/${lang}/privacidad`} className={linkClass}>
              {formCommon[lang].privacyLinkLabel}
            </Link>
            {/* Staff entry point. Kept here rather than in the public header:
                the panel is for the clinic, not for visitors. */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-drench-on/70 transition-colors duration-fast hover:text-brass"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {lang === 'es' ? 'Acceso personal' : 'Staff access'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
