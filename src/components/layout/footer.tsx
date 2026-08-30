'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, Lock } from 'lucide-react';
import { contactDetails, generalUiStrings, formCommon, navStrings } from '@/lib/data';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { MOBILE_ACTION_BAR_HEIGHT } from '@/components/layout/mobile-action-bar';

export function Footer() {
  const { lang } = useLanguage();
  const ui = generalUiStrings[lang];
  const nav = navStrings[lang];
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

  /**
   * The homepage's bands, in the order they appear on it.
   *
   * This list is the *only* way into two of them once the mobile overlay is
   * gone. The header bar carries five links and the overlay's secondary index
   * carries three more — but that panel is `xl:hidden`, so from 1280px up
   * "Testimonios", "Diplomas" and "La consulta" had no route in from anywhere.
   * Testimonios was already fixed here; the other two were not.
   *
   * (`#diplomas` is not *completely* stranded — the doctor section ends with a
   * button pointing at it — but that is a route you have to find by scrolling
   * past it first, which is not the same as an index.)
   *
   * Ordering them by position on the page rather than by importance means the
   * list doubles as a table of contents, which is what a visitor reads it as.
   */
  const quickLinks = [
    { href: `/${lang}#implantes`, label: lang === 'es' ? 'Implantes' : 'Implants' },
    { href: `/${lang}#servicios`, label: ui.services },
    { href: `/${lang}#testimonios`, label: ui.testimonials },
    { href: `/${lang}#el-doctor`, label: lang === 'es' ? 'El doctor' : 'The doctor' },
    { href: `/${lang}#diplomas`, label: nav.secondary.diplomas },
    { href: `/${lang}#la-consulta`, label: nav.secondary.clinic },
    { href: `/${lang}#preguntas-frecuentes`, label: ui.faq },
    { href: `/${lang}#contacto`, label: ui.contact },
  ];

  const navLabel = lang === 'es' ? 'Navegación' : 'Navigation';
  const headingClass = 'mb-4 font-heading text-base font-medium text-drench-on';
  const linkClass =
    'text-drench-on/70 underline-offset-4 transition-colors duration-fast hover:text-brass hover:underline';

  return (
    <footer className="drenched-deep print:hidden">
      {/* `.shell`, not a container of its own.

          The footer used to sit in an `mx-auto max-w-7xl` box while every band
          above it used the page's 12-column breakout grid, which caps ~240px
          wider. On any display past about 1400px the footer's left rule
          therefore did not line up with the left rule the whole page is built
          on, and the closing band read as a different document pasted on the
          end. */}
      <div className="shell gap-y-11 py-16">
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
        <nav aria-label={navLabel} className="sm:col-span-6 lg:col-span-3">
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
        <div className="sm:col-span-6 lg:col-span-3">
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
        <div className="sm:col-span-6 lg:col-span-2">
          <h2 className={headingClass}>{footer.scheduleTitle}</h2>
          <p className="whitespace-pre-line leading-relaxed text-drench-on/70">{schedule}</p>
        </div>
      </div>

      <div className="border-t border-drench-on/15">
        <div className="shell py-6 text-sm text-drench-on/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>

      {/* Clearance for the fixed MobileActionBar.
          The reserve for that bar lived on `<main>` — but `<Footer>` is main's
          SIBLING, so on every phone the bar sat on top of this last row and
          the copyright, the privacy policy and the staff-access link were all
          unreachable behind it. The reserve belongs to the last thing in the
          document, which is here. Inside the `<footer>` so the drenched band
          runs continuously under the bar rather than leaving a strip of page
          background below it. */}
      <div aria-hidden="true" className="lg:hidden" style={{ height: MOBILE_ACTION_BAR_HEIGHT }} />
    </footer>
  );
}
