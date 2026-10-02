import type { Metadata } from 'next';
import { AlertTriangle, Clock, MapPin, Phone } from 'lucide-react';

import { AppointmentForm } from '@/components/appointment-form';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Section } from '@/components/primitives/section';
import { Button } from '@/components/ui/button';
import { TEL_HREF, contactLinkLabels, whatsappHref } from '@/lib/contact';
import { appointmentBooking, contactDetails, homeContent } from '@/lib/data';
import { serviceOptions } from '@/lib/service-catalog';
import { getPublicSiteSettings } from '@/lib/site-settings';
import type { Language } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Re-read the admin switches at least hourly.
 *
 * The page is static, and it now reads `app.site_settings` to decide between
 * the form and the "llámenos" panel. The admin save action revalidates it on
 * every change; this is the safety net for a change made while that call
 * failed. A database read is not a Dynamic API, so the route stays ● in
 * `next build`.
 */
export const revalidate = 3600;

function toLanguage(raw: string | undefined): Language {
  return raw === 'en' ? 'en' : 'es';
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = toLanguage((await params)?.lang);

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

/** Call + WhatsApp, tap-sized, as one row. Used in the intro, the aside and
 *  the closed panel, so the two channels always appear together. */
function ContactButtons({
  lang,
  size = 'sm',
  primary = false,
  className,
}: {
  lang: Language;
  size?: 'sm' | 'lg';
  /** The closed panel's call button is the page's only action, so it fills. */
  primary?: boolean;
  className?: string;
}) {
  const labels = contactLinkLabels(lang);
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button asChild size={size} variant={primary ? 'default' : 'outline'}>
        <a href={TEL_HREF} aria-label={labels.callAria}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          {/* The word drops below `sm` so both buttons fit one row at 390px;
              the icon and the number say "call" on their own, and the
              accessible name still contains the visible number (WCAG 2.5.3). */}
          <span className="hidden sm:inline">{labels.call}</span>
          <span className="tabular">{labels.phone}</span>
        </a>
      </Button>
      <Button asChild size={size} variant="outline">
        <a
          href={whatsappHref(lang)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels.whatsappAria}
        >
          <WhatsAppIcon className="h-4 w-4" />
          {labels.whatsapp}
        </a>
      </Button>
    </div>
  );
}

/** Hours and address, as a definition list. Shared by the aside and the closed
 *  panel. */
function PracticeDetails({ lang, className }: { lang: Language; className?: string }) {
  const t = appointmentBooking[lang];
  // The stored heading ends in a colon in older copy; a heading does not.
  const hoursTitle = contactDetails.appointmentPage[lang].openingHoursTitle.replace(/\s*:\s*$/, '');

  return (
    <dl className={cn('space-y-5', className)}>
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
        <div className="min-w-0">
          <dt className="text-small font-medium text-ink">{hoursTitle}</dt>
          <dd className="mt-0.5 text-small text-ink-soft">{contactDetails.schedule[lang]}</dd>
          <dd className="mt-1.5 text-small leading-relaxed text-ink-soft">{t.asideHoursNote}</dd>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brass-ink" aria-hidden="true" />
        <div className="min-w-0">
          <dt className="text-small font-medium text-ink">{t.asideAddressLabel}</dt>
          <dd className="mt-0.5 text-small leading-relaxed text-ink-soft">
            {contactDetails.address[lang]}
          </dd>
        </div>
      </div>
    </dl>
  );
}

/**
 * Booking page.
 *
 * The first field has to be on the first screen of a phone. It used to start
 * at y≈907 on a 390×844 screen: a display-size H1, a two-sentence standfirst, a
 * band of padding, a form intro that repeated the standfirst, a rule, and then
 * the form. A patient who came here from "Agendar una cita" saw a page of prose
 * and no form, and had to work out that scrolling would find one.
 *
 * Now, top to bottom on a phone: the H1 at section-heading size, one sentence
 * plus "no compromete a nada", the call/WhatsApp row (the escape hatch, not
 * buried under the form), one line for anyone in pain, a three-step strip of
 * what happens next, and the first field. On a desktop the urgent panel sits
 * beside the intro and the steps, hours and address sit beside the form.
 *
 * When the clinic has paused online requests in the admin panel, or the site is
 * in maintenance, the form is replaced by a panel that says so and offers the
 * two channels that still work. The server action refuses submissions in the
 * same state, so a tab left open before the switch cannot send one either.
 */
export default async function AgendarCitaPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = toLanguage((await params)?.lang);

  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];
  const pageContent = contactDetails.appointmentPage[lang];
  const t = appointmentBooking[lang];
  const steps = homeContent[lang].booking.steps;
  const reassurance = homeContent[lang].booking.reassurance;

  const settings = await getPublicSiteSettings();
  const accepting = settings.allowAppointments && !settings.maintenanceMode;

  return (
    <>
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <Section
        tone="canvas"
        space="none"
        grain
        className="pb-5 pt-5 sm:pb-8 sm:pt-10 lg:pb-12 lg:pt-14"
        shellClassName="items-end gap-y-6"
      >
        <div className="lg:col-span-7">
          {/* Who and where. Hidden on a phone, where two lines of context cost
              the form its place on the first screen and the H1 already says
              what this page is. */}
          <p className="hidden font-body text-small font-medium text-brass-ink sm:block">
            {pageContent.cardDescription
              .replace('{{doctorName}}', doctorName)
              .replace('{{clinicName}}', clinicName)}
          </p>
          {/* `text-h2`, not the display `text-h1` the homepage hero uses: this
              is a form page, and an 88px headline above a form is the form
              pushed off the screen. */}
          <h1 className="font-heading text-h2 font-medium text-ink sm:mt-2">{pageContent.cardTitle}</h1>

          {/* Closed: the panel below says why and what to do instead, so the
              intro does not repeat it — and must not say "fill in the form". */}
          {accepting && (
            <>
              <p className="mt-3 max-w-measure text-body leading-relaxed text-ink-soft">
                {t.standfirst} <span className="font-medium text-ink">{reassurance}</span>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-small font-medium text-ink">{t.asideCallTitle}</p>
                <ContactButtons lang={lang} />
              </div>
              {/* The urgent warning in one line on a phone. The full panel
                  sits beside this intro from `lg`. */}
              <p className="mt-3 flex items-start gap-2 text-small leading-relaxed text-ink-soft lg:hidden">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                {t.urgentShort}
              </p>
            </>
          )}
        </div>

        {accepting && (
          /* Beside the intro, not after the form: someone in pain decides at
             the top of the page whether to fill anything in. It used to be a
             drenched band BELOW a ~2,000px form. Warning tokens and no
             animation — the same register as the form's own urgency toggle. */
          <aside
            aria-labelledby="urgent-title"
            className="hidden rounded-xl border border-line bg-surface p-6 shadow-e1 lg:col-span-4 lg:col-start-9 lg:block"
          >
            <h2
              id="urgent-title"
              className="flex items-center gap-2 font-heading text-h4 font-medium text-ink"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
              {t.urgentTitle}
            </h2>
            <p className="mt-2 text-small leading-relaxed text-ink-soft">{t.urgentBody}</p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <a href={TEL_HREF} aria-label={contactLinkLabels(lang).callAria}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                {t.urgentCta}
                <span className="tabular">{contactDetails.phone[lang]}</span>
              </a>
            </Button>
          </aside>
        )}
      </Section>

      {accepting ? (
        <Section
          tone="sunk"
          space="none"
          className="pb-12 pt-5 sm:pt-8 lg:py-14"
          shellClassName="items-start gap-y-6 lg:gap-y-10"
        >
          {/* What happens next, ABOVE the form on a phone — the aside that
              carries it on a desktop renders below the form here, which is too
              late for it to be reassurance. Three numbers and three titles;
              the full text is in the aside. */}
          <div className="lg:hidden">
            <p className="text-small font-medium text-ink">{t.asideStepsTitle}</p>
            <ol className="mt-2 grid grid-cols-3 gap-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-1.5 text-small leading-snug text-ink-soft">
                  <span aria-hidden="true" className="font-heading font-medium text-brass-ink tabular">
                    {index + 1}
                  </span>
                  <span>{step.title}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-7">
            {/* The form sits on a raised surface so the fields — which carry
                the canvas tone themselves — stay legible against it. The
                old "complete the form below" intro inside the card is gone:
                it repeated the standfirst between the patient and the first
                field. */}
            <div className="rounded-xl border border-line bg-card p-4 shadow-e2 sm:p-8 lg:p-10">
              <AppointmentForm serviceOptions={serviceOptions(lang)} />
            </div>
          </div>

          {/* Sticky only where the whole column fits on screen. Pinned on a
              900px-tall laptop, its bottom — the address — was cut off until
              the visitor reached the end of a ~2,000px form. 62rem is 992px:
              `rem` in a media query is the browser default 16px, NOT this
              site's 17px root, and the column is ~845px plus its 6rem offset. */}
          <aside className="lg:col-span-4 lg:col-start-9 lg:self-start [@media(min-height:62rem)]:lg:sticky [@media(min-height:62rem)]:lg:top-24">
            <div className="hidden lg:block">
              <h2 className="font-heading text-h4 font-medium text-ink">{t.asideStepsTitle}</h2>
              <ol className="mt-5">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="relative grid grid-cols-[auto_1fr] gap-x-4 pb-6 last:pb-0"
                  >
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
              <p className="mt-5 text-small leading-relaxed text-ink-soft">{t.assessmentNote}</p>
              <hr className="my-7 border-0 border-t border-line" />
            </div>

            <div className="space-y-5">
              <div>
                <h2 className="text-small font-medium text-ink">{t.asideCallTitle}</h2>
                <p className="mt-1 text-small leading-relaxed text-ink-soft">{t.asideCallBody}</p>
                <ContactButtons lang={lang} className="mt-3" />
              </div>
              <PracticeDetails lang={lang} />
            </div>
          </aside>
        </Section>
      ) : (
        <Section tone="sunk" space="normal" shellClassName="items-start">
          <div className="rounded-xl border border-line bg-card p-6 shadow-e2 sm:p-10 lg:col-span-7">
            <h2 className="font-heading text-h3 font-medium text-ink">{t.closedTitle}</h2>
            <p className="mt-3 max-w-measure leading-relaxed text-ink-soft">{t.closedBody}</p>
            <ContactButtons lang={lang} size="lg" primary className="mt-6" />
            <hr className="my-8 border-0 border-t border-line" />
            <PracticeDetails lang={lang} />
          </div>
        </Section>
      )}
    </>
  );
}
