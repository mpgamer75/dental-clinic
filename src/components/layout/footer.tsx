import Link from 'next/link';
import { Clock, Lock, Mail, MapPin, Phone } from 'lucide-react';

import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Button } from '@/components/ui/button';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import {
  contactDetails,
  formCommon,
  generalUiStrings,
  implantCluster,
  implantClusterPath,
  navStrings,
} from '@/lib/data';
import type { Language } from '@/lib/types';

/**
 * Site footer — a SERVER component.
 *
 * It was a client component for one reason, `useLanguage()`, and paid for it
 * twice: the whole footer hydrated on every page, and `new Date().getFullYear()`
 * ran in the browser, so every fully static page would have thrown a
 * hydration mismatch on the first of January (server HTML "2026", browser
 * "2027"). The layout knows the language from the URL; it passes it in.
 *
 * Two indexes. "En esta página" is the homepage's table of contents, in page
 * order — the only route into bands the header bar does not carry. "Guía de
 * implantes" is the second internal route into every page of the implant
 * cluster: the header links the pillar, and a topic cluster wants more than
 * one way into each leaf.
 */
export function Footer({ lang }: { lang: Language }) {
  const ui = generalUiStrings[lang];
  const nav = navStrings[lang];
  const footer = contactDetails.footer[lang];
  const cluster = implantCluster[lang];
  const links = contactLinkLabels(lang);

  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];
  const home = `/${lang}`;
  const year = new Date().getFullYear();

  const pageLinks = [
    { href: `${home}#implantes`, label: nav.links.implants },
    { href: `${home}#el-doctor`, label: nav.links.doctor },
    { href: `${home}#diplomas`, label: nav.secondary.diplomas },
    { href: `${home}#servicios`, label: ui.services },
    { href: `${home}#preguntas-frecuentes`, label: ui.faq },
    { href: `${home}#contacto`, label: contactDetails.contactSection[lang].title },
  ];

  const guideLinks = [
    { href: implantClusterPath(lang), label: cluster.pillar.shortLabel },
    ...cluster.spokes.map((spoke) => ({ href: implantClusterPath(lang, spoke.slug), label: spoke.shortLabel })),
  ];

  const headingClass = 'mb-3 font-heading text-base font-medium text-drench-on';
  /* `inline-flex min-h-11` is the tap target, not decoration: these links were
     20px tall on a phone, on the one surface that carries the clinic's address
     and telephone number. */
  const linkClass =
    'inline-flex min-h-11 items-center text-drench-on/75 underline-offset-4 transition-colors duration-fast hover:text-brass-lift hover:underline';

  return (
    <footer className="drenched-deep print:hidden">
      {/* `.shell`, so the footer's left rule is the same one every band above
          it is built on. */}
      <div className="shell gap-y-10 py-16">
        <div className="lg:col-span-4">
          <Link href={home} className="font-heading text-2xl font-medium text-drench-on underline-offset-4 hover:underline">
            {clinicName}
          </Link>
          <p className="mt-4 max-w-sm leading-relaxed text-drench-on/75">
            {footer.tagline.replace('{{doctorName}}', doctorName)}
          </p>
          <Button asChild variant="brass" size="lg" className="mt-6">
            <Link href={`${home}/agendar-cita`}>{ui.appointments}</Link>
          </Button>
        </div>

        <nav aria-labelledby="footer-page-nav" className="col-span-6 lg:col-span-2">
          <h2 id="footer-page-nav" className={headingClass}>
            {lang === 'es' ? 'En esta página' : 'On this page'}
          </h2>
          <ul>
            {pageLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-guide-nav" className="col-span-6 lg:col-span-3">
          <h2 id="footer-guide-nav" className={headingClass}>
            {footer.implantGuide}
          </h2>
          <ul>
            {guideLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sm:col-span-8 lg:col-span-3">
          <h2 className={headingClass}>{footer.quickContact}</h2>
          <ul>
            <li className="flex items-start gap-3">
              <MapPin className="mt-3.5 h-4 w-4 shrink-0 text-brass-lift" aria-hidden="true" />
              <a href={contactDetails.mapLink[lang]} target="_blank" rel="noopener noreferrer" className={`${linkClass} py-2`}>
                {contactDetails.address[lang]}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-brass-lift" aria-hidden="true" />
              <a href={TEL_HREF} aria-label={links.callAria} className={`${linkClass} tabular`}>
                {links.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <WhatsAppIcon className="h-4 w-4 shrink-0 text-brass-lift" />
              <a href={whatsappHref(lang)} aria-label={links.whatsappAria} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {links.whatsapp}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-brass-lift" aria-hidden="true" />
              <a href={`mailto:${contactDetails.email[lang]}`} className={`${linkClass} break-all`}>
                {contactDetails.email[lang]}
              </a>
            </li>
            <li className="flex items-start gap-3 pt-2 text-drench-on/75">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-brass-lift" aria-hidden="true" />
              <span>
                <span className="sr-only">{footer.scheduleTitle}: </span>
                {contactDetails.schedule[lang]}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-drench-on/15">
        <div className="shell py-5 text-small text-drench-on/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>{footer.copyright.replace('{{year}}', String(year)).replace('{{clinicName}}', clinicName)}</p>
            <div className="flex flex-wrap items-center gap-x-6">
              <Link href={`${home}/privacidad`} className={linkClass}>
                {formCommon[lang].privacyLinkLabel}
              </Link>
              {/* Staff entry point. Here rather than in the header: the panel is
                  for the clinic, not for visitors. */}
              <Link href="/admin" className={`${linkClass} gap-1.5`}>
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                {lang === 'es' ? 'Acceso personal' : 'Staff access'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
