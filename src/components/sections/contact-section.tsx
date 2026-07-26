import { Mail, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';
import type { Language } from '@/lib/types';
import { contactDetails as allContactDetails } from '@/lib/data';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { Button } from '@/components/ui/button';

interface ContactSectionProps {
  id: string;
  lang: Language;
  title: string;
  description: string;
  formTitleText: string;
  detailsTitleText: string;
  addressText: string;
  phoneText: string;
  emailText: string;
  scheduleText: string;
  mapTitleText: string;
  mapLinkUrl: string;
  embedMapLinkUrl: string;
  addressLabel: string;
  phoneLabel: string;
  emailLabel: string;
  scheduleLabel: string;
  viewMapButtonText: string;
}

export function ContactSection({
  id,
  lang,
  title,
  description,
  formTitleText,
  detailsTitleText,
  addressText,
  phoneText,
  emailText,
  scheduleText,
  mapTitleText,
  mapLinkUrl,
  embedMapLinkUrl,
  addressLabel,
  phoneLabel,
  emailLabel,
  scheduleLabel,
  viewMapButtonText,
}: ContactSectionProps) {
  const clinicName = allContactDetails.clinicName[lang];
  // Strip formatting so the dialler gets a clean number.
  const telHref = `tel:${phoneText.replace(/[^\d+]/g, '')}`;

  const details = [
    {
      icon: MapPin,
      label: addressLabel,
      value: addressText,
      href: mapLinkUrl,
      external: true,
    },
    { icon: Phone, label: phoneLabel, value: phoneText, href: telHref, external: false },
    { icon: Mail, label: emailLabel, value: emailText, href: `mailto:${emailText}`, external: false },
  ];

  return (
    <Section id={id} tone="sunk" space="normal">
      <SectionHeading
        title={title}
        description={description}
        align="left"
        className="lg:col-span-6"
      />

      <div className="grid items-start gap-x-[6%] gap-y-12 lg:col-span-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <h3 className="font-heading text-h4 font-medium text-ink">{formTitleText}</h3>
          <div className="mt-6">
            <ContactForm />
          </div>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5 lg:col-start-8">
          <h3 className="font-heading text-h4 font-medium text-ink">{detailsTitleText}</h3>

          <dl className="mt-6 space-y-5">
            {details.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <item.icon
                  className="mt-1 h-5 w-5 shrink-0 text-brass-ink"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="text-sm font-medium text-ink-soft">{item.label}</dt>
                  <dd>
                    <a
                      href={item.href}
                      {...(item.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="-my-2.5 inline-block break-words py-2.5 text-ink underline-offset-4 transition-colors duration-fast hover:text-terracotta hover:underline"
                    >
                      {item.value}
                    </a>
                  </dd>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-4">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
              <div>
                <dt className="text-sm font-medium text-ink-soft">{scheduleLabel}</dt>
                <dd className="whitespace-pre-line text-ink">{scheduleText}</dd>
              </div>
            </div>
          </dl>

          {/* Map.

              The previous build laid a full-bleed <a> over this iframe, which
              swallowed every pointer event — the embedded map could not be
              panned or zoomed at all, and any click bounced the visitor out to
              Google Maps. The link is now a sibling control below the map, so
              the embed stays usable. */}
          <div className="mt-9">
            <h3 className="font-heading text-h4 font-medium text-ink">{mapTitleText}</h3>
            <div className="mt-4 overflow-hidden rounded-xl border border-line shadow-e1">
              <iframe
                src={embedMapLinkUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${mapTitleText} — ${clinicName}`}
                className="block h-64 w-full md:h-72"
              />
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <a href={mapLinkUrl} target="_blank" rel="noopener noreferrer">
                {viewMapButtonText}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">
                  {lang === 'es' ? '(se abre en una pestaña nueva)' : '(opens in a new tab)'}
                </span>
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
