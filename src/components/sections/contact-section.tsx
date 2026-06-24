import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Language } from '@/lib/types';
import { contactDetails as allContactDetails } from '@/lib/data';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';

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
  const cardClass =
    'rounded-xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md';
  const titleClass = 'font-heading text-2xl text-primary';

  const details = [
    { icon: MapPin, label: addressLabel, value: addressText, href: mapLinkUrl, external: true },
    { icon: Phone, label: phoneLabel, value: phoneText, href: `tel:${phoneText}` },
    { icon: Mail, label: emailLabel, value: emailText, href: `mailto:${emailText}` },
  ];

  return (
    <section id={id} className="bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading title={title} description={description} />

        <div className="grid items-start gap-8 lg:grid-cols-2">
          <Reveal>
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleClass}>{formTitleText}</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1} className="space-y-8">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleClass}>{detailsTitleText}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {details.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <span className="rounded-lg bg-highlight/10 p-2 text-highlight">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.label}</h4>
                      <a
                        href={item.href}
                        {...(item.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                      >
                        {item.value}
                      </a>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-4">
                  <span className="rounded-lg bg-highlight/10 p-2 text-highlight">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-foreground">{scheduleLabel}</h4>
                    <p className="whitespace-pre-line text-muted-foreground">{scheduleText}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`overflow-hidden ${cardClass}`}>
              <CardHeader>
                <CardTitle className={titleClass}>{mapTitleText}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="group relative h-64 overflow-hidden rounded-md md:h-80">
                  <iframe
                    src={embedMapLinkUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${mapTitleText} - ${allContactDetails.clinicName[lang]}`}
                    className="h-full w-full"
                  />
                  <a
                    href={mapLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-primary/50 opacity-0 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`${viewMapButtonText} - ${allContactDetails.clinicName[lang]}`}
                  >
                    <span className="rounded-full bg-background px-5 py-2 text-sm font-semibold text-primary shadow-lg">
                      {viewMapButtonText}
                    </span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
