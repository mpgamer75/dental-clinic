import Image from 'next/image';
import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';

import { ContactPanel } from '@/components/contact-panel';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { MapEmbed } from '@/components/map-embed';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import { clinicPhotos, contactDetails } from '@/lib/data';
import type { Language } from '@/lib/types';

interface ContactSectionProps {
  id: string;
  lang: Language;
  /** False when the clinic has switched the contact form off. */
  showForm: boolean;
}

const CHANNEL =
  'inline-flex h-11 items-center gap-2 rounded-lg border border-line-strong px-4 text-small font-medium text-ink transition-colors duration-fast ease-out-quart hover:border-primary/50 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * "Cómo llegar" — the visit band and the contact band, merged.
 *
 * They were two sections: a carousel that rotated the same glass storefront
 * three times every seven seconds, and a "Contáctanos" band in the wrong
 * register with a second form, a satellite map and the address. Now: where it
 * is, how to reach it, one photograph so the visitor recognises the door, a
 * road map on request, and the questions form folded away.
 *
 * `#la-consulta` is kept as an anchor at the top for links that still point at
 * the old visit band.
 */
export function ContactSection({ id, lang, showForm }: ContactSectionProps) {
  const copy = contactDetails.contactSection[lang];
  const links = contactLinkLabels(lang);
  const address = contactDetails.address[lang];
  const email = contactDetails.email[lang];
  const mapLink = contactDetails.mapLink[lang];
  const photo = clinicPhotos.approach;

  return (
    <Section id={id} tone="canvas" space="normal">
      <span id="la-consulta" aria-hidden="true" className="block h-0 scroll-mt-28" />

      <div className="grid items-start gap-x-[6%] gap-y-10 lg:col-span-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading title={copy.title} description={copy.description} align="left" className="mb-8 md:mb-9" />

          <dl className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-small font-medium text-ink-soft">{copy.addressLabel}</dt>
                <dd className="mt-0.5 text-ink">{address}</dd>
                <dd>
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {copy.viewMapButton}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">{lang === 'es' ? ' (se abre en una pestaña nueva)' : ' (opens in a new tab)'}</span>
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-small font-medium text-ink-soft">{copy.phoneLabel}</dt>
                <dd className="mt-2 flex flex-wrap gap-2.5">
                  <a href={TEL_HREF} aria-label={links.callAria} className={CHANNEL}>
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <span className="tabular">{links.phone}</span>
                  </a>
                  <a
                    href={whatsappHref(lang)}
                    aria-label={links.whatsappAria}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CHANNEL}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    {links.whatsapp}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-small font-medium text-ink-soft">{copy.emailLabel}</dt>
                <dd>
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex min-h-11 items-center break-all text-ink underline-offset-4 transition-colors duration-fast hover:text-primary hover:underline"
                  >
                    {email}
                  </a>
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-small font-medium text-ink-soft">{copy.scheduleLabel}</dt>
                <dd className="mt-0.5 text-ink">{contactDetails.schedule[lang]}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="space-y-6 lg:col-span-6 lg:col-start-7">
          <Reveal as="figure" className="m-0">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-e2">
              <Image
                src={photo.src}
                alt={photo.alt[lang]}
                fill
                sizes="(min-width: 1024px) 46vw, 100vw"
                quality={78}
                loading="lazy"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline gap-2 text-small text-ink-soft">
              <span aria-hidden="true" className="h-px w-6 shrink-0 bg-brass" />
              {copy.photoCaption}
            </figcaption>
          </Reveal>

          <MapEmbed
            src={contactDetails.embedMapLink[lang]}
            title={`${copy.mapTitle} — ${contactDetails.clinicName[lang]}`}
            loadLabel={copy.mapLoad}
            note={copy.mapNote}
            address={address}
          />
        </div>
      </div>

      {showForm && (
        <div className="mt-12 lg:mt-16">
          <ContactPanel title={copy.formTitle} lead={copy.formLead} toggleLabel={copy.formToggle} />
        </div>
      )}
    </Section>
  );
}
