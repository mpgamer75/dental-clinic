import type { Metadata } from 'next';
import { Clock, MapPin, Phone } from 'lucide-react';

import { AppointmentForm } from '@/components/appointment-form';
import { Section } from '@/components/primitives/section';
import { Reveal } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import {
  appointmentBooking,
  contactDetails,
  homeContent,
  services as allServices,
} from '@/lib/data';
import type { Language } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === 'en' || resolvedParams?.lang === 'es') ? resolvedParams.lang : 'es';

  const pageContent = contactDetails.appointmentPage[lang];
  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];

  const title = `${pageContent.title} - ${clinicName}`;
  const description = pageContent.description
    .replace('{{clinicName}}', clinicName)
    .replace('{{doctorName}}', doctorName);

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/agendar-cita`,
      languages: {
        'es-DO': '/es/agendar-cita',
        'en-US': '/en/agendar-cita',
        'x-default': '/es/agendar-cita',
      },
    },
    // Metadata is merged, not replaced, so without an explicit openGraph block
    // this page inherited the [lang] layout's — which describes the homepage.
    // Sharing the booking link on WhatsApp showed the homepage's title, blurb
    // and URL instead of the booking page's.
    openGraph: {
      title,
      description,
      url: `/${lang}/agendar-cita`,
      type: 'website',
      locale: lang === 'es' ? 'es_DO' : 'en_US',
      siteName: clinicName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Booking page.
 *
 * The previous version was one narrow centred card on a beige gradient: a
 * `max-w-2xl` column with a solid-primary header, the form stacked inside it,
 * and nothing else on the page. Everything a hesitant patient actually wants to
 * know before sending a request — what happens next, whether it commits them to
 * anything, when the clinic is open, whether they could just phone instead —
 * was absent, while roughly two thirds of a desktop viewport sat empty either
 * side of the card.
 *
 * Rebuilt on the shell grid. The form keeps a comfortable measure and the extra
 * width goes to the supporting column, which is the material that answers those
 * questions. The three bands deliberately differ in span, position and tone:
 *
 *   1. canvas, cols 1–8   — the ask
 *   2. sunk,   cols 1–12  — form (1–7) + support (8–12, sticky)
 *   3. drench, cols 5–12  — the phone-instead escape hatch, weighted right
 */
export default async function AgendarCitaPage({ params }: { params: Promise<{ lang: Language }> }) {
  const resolvedParams = await params;
  const lang: Language = resolvedParams?.lang || 'es';

  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];
  const schedule = contactDetails.schedule[lang];
  const phone = contactDetails.phone[lang];
  const address = contactDetails.address[lang];
  const pageContent = contactDetails.appointmentPage[lang];
  const t = appointmentBooking[lang];
  const steps = homeContent[lang].booking.steps;
  const reassurance = homeContent[lang].booking.reassurance;

  // Strip formatting so the dialler gets a clean number.
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  // The stored string ends in a colon ("Horario de Atención Regular:"), which
  // reads as a stray artefact once it is a heading rather than a label.
  const hoursTitle = pageContent.openingHoursTitle.replace(/\s*:\s*$/, '');

  // Get service titles for the current language
  const serviceOptionsFromData = allServices[lang].map(s => s.title);

  const generalConsultationService = pageContent.serviceOptions.generalConsultation;

  // Ensure general consultation is in the list, preferably at the beginning
  let appointmentServices = [...serviceOptionsFromData];
  if (appointmentServices.includes(generalConsultationService)) {
    appointmentServices = [generalConsultationService, ...appointmentServices.filter(s => s !== generalConsultationService)];
  } else {
    appointmentServices.unshift(generalConsultationService);
  }


  return (
    <>
      <Section tone="canvas" space="tight" grain>
        <Reveal className="lg:col-span-8">
          <p className="font-body text-small font-medium text-brass-ink">
            {pageContent.cardDescription
              .replace('{{doctorName}}', doctorName)
              .replace('{{clinicName}}', clinicName)}
          </p>
          <h1 className="mt-3 font-heading text-h1 font-medium text-ink">
            {pageContent.cardTitle}
          </h1>
          <p className="mt-5 max-w-measure text-body leading-relaxed text-ink-soft">
            {t.standfirst}
          </p>
        </Reveal>
      </Section>

      <Section tone="sunk" space="normal" shellClassName="items-start gap-y-14">
        {/* The form sits on a raised surface so the fields — which carry the
            canvas tone themselves — stay legible against it. */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-line bg-card p-5 shadow-e2 sm:p-8 lg:p-10">
            <p className="max-w-measure text-small leading-relaxed text-ink-soft">
              {pageContent.formIntro}
            </p>
            <hr className="my-8 border-0 border-t border-line" />
            <AppointmentForm serviceOptions={appointmentServices} />
          </div>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9 lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            <h2 className="font-heading text-h4 font-medium text-ink">{t.asideStepsTitle}</h2>
            <ol className="mt-5">
              {steps.map((step, index) => (
                <li key={step.title} className="relative grid grid-cols-[auto_1fr] gap-x-4 pb-7 last:pb-0">
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[1.125rem] top-10 h-[calc(100%-2.5rem)] w-px bg-line-strong"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative z-raised flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/50 bg-canvas font-heading text-base font-medium text-brass-ink tabular"
                  >
                    {index + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-base font-medium text-ink">{step.title}</h3>
                    <p className="mt-1 text-small leading-relaxed text-ink-soft">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-2 text-small font-medium text-brass-ink">{reassurance}</p>

            <hr className="my-8 border-0 border-t border-line" />

            <dl className="space-y-5">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-small font-medium text-ink">{hoursTitle}</dt>
                  {/* `schedule.split('\n')` used to sit here, splitting on a
                      LITERAL backslash-n that contactDetails.schedule does not
                      contain — so the second line could never render. Rendering
                      the string directly is the same output, honestly. */}
                  <dd className="mt-0.5 whitespace-pre-line text-small text-ink-soft">{schedule}</dd>
                  <dd className="mt-1.5 text-small leading-relaxed text-ink-soft">
                    {t.asideHoursNote}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-small font-medium text-ink">{t.asideCallTitle}</dt>
                  <dd className="mt-0.5">
                    <a
                      href={telHref}
                      className="text-small text-ink underline-offset-4 transition-colors duration-fast hover:text-terracotta hover:underline tabular"
                    >
                      {phone}
                    </a>
                  </dd>
                  <dd className="mt-1.5 text-small leading-relaxed text-ink-soft">
                    {t.asideCallBody}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-small font-medium text-ink">{t.asideAddressLabel}</dt>
                  <dd className="mt-0.5 text-small leading-relaxed text-ink-soft">{address}</dd>
                </div>
              </div>
            </dl>
          </Reveal>
        </aside>
      </Section>

      <Section tone="drench" space="tight">
        <Reveal className="lg:col-span-8 lg:col-start-5">
          <h2 className="font-heading text-h3 font-medium text-drench-on">{t.urgentTitle}</h2>
          <p className="mt-4 max-w-measure leading-relaxed text-drench-on/80">{t.urgentBody}</p>
          {/* `h-auto … flex-wrap whitespace-normal`: the Button base is
              `whitespace-nowrap inline-flex` with no wrapping, and at size="xl"
              the three unbreakable items — icon, "Llamar a la clínica", and the
              12-character number — measured 388px against a 320px viewport,
              pushing the page into horizontal scroll. Fine from 390px up, but
              320px is a supported width here. */}
          <Button
            asChild
            size="xl"
            variant="brass"
            className="mt-7 h-auto min-h-14 max-w-full flex-wrap whitespace-normal py-3"
          >
            <a href={telHref}>
              <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
              {t.urgentCta}
              <span className="tabular">{phone}</span>
            </a>
          </Button>
        </Reveal>
      </Section>
    </>
  );
}
