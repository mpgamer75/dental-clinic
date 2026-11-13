import type { Metadata } from 'next';
import { AlertTriangle, Clock, MapPin, Phone } from 'lucide-react';

import { AppointmentForm } from '@/components/appointment-form';
import { DirectoryProfileLink } from '@/components/directory-profile-link';
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
  onDrench = false,
  className,
}: {
  lang: Language;
  size?: 'sm' | 'lg';
  /** The closed panel's call button is the page's only action, so it fills. */
  primary?: boolean;
  /** On a blue band the outline variant's ink-coloured border and label sink
   *  into the ground; `onDrench` is the same control drawn in the pale tone. */
  onDrench?: boolean;
  className?: string;
}) {
  const labels = contactLinkLabels(lang);
  const quiet = onDrench ? 'onDrench' : 'outline';
  // The base Button offsets its focus ring in canvas tone, which on a blue
  // ground is a white halo around a blue ring.
  const ringOffset = onDrench ? 'focus-visible:ring-offset-drench' : undefined;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button asChild size={size} variant={primary ? 'default' : quiet} className={ringOffset}>
        <a href={TEL_HREF} aria-label={labels.callAria}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          {/* The word drops below `sm` so both buttons fit one row at 390px;
              the icon and the number say "call" on their own, and the
              accessible name still contains the visible number (WCAG 2.5.3). */}
          <span className="hidden sm:inline">{labels.call}</span>
          <span className="tabular">{labels.phone}</span>
        </a>
      </Button>
      <Button asChild size={size} variant={quiet} className={ringOffset}>
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
 * Now, top to bottom on a phone: a blue band carrying the H1 at section-heading
 * size, one sentence plus "no compromete a nada", the call/WhatsApp row (the
 * escape hatch, not buried under the form) and one line for anyone in pain;
 * then the form's own three-part progress strip and the first field. On a
 * desktop the urgent panel sits beside the intro, and what happens next, the
 * direct channels, hours, address and the directory profile sit beside the
 * form.
 *
 * The intro is a drenched band so this page opens in the same blue the
 * homepage's booking band closes on: the visitor who pressed "Agendar una
 * cita" there lands on the same ground instead of on a page that looks like a
 * different site. The form itself stays on a light card — eight controls with
 * their own borders, errors and focus rings are legible there and would each
 * need re-toning on blue.
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
        tone="drench"
        space="none"
        className="pb-6 pt-6 sm:pb-10 sm:pt-11 lg:pb-14 lg:pt-16"
        shellClassName="items-end gap-y-6"
      >
        <div className="lg:col-span-7">
          {/* Who and where. Hidden on a phone, where two lines of context cost
              the form its place on the first screen and the H1 already says
              what this page is. */}
          <p className="hidden font-body text-small font-medium text-brass-lift sm:block">
            {pageContent.cardDescription
              .replace('{{doctorName}}', doctorName)
              .replace('{{clinicName}}', clinicName)}
          </p>
          {/* `text-h2`, not the display `text-h1` the homepage hero uses: this
              is a form page, and an 88px headline above a form is the form
              pushed off the screen. */}
          <h1 className="font-heading text-h2 font-medium text-drench-on sm:mt-2">
            {pageContent.cardTitle}
          </h1>

          {/* Closed: the panel below says why and what to do instead, so the
              intro does not repeat it — and must not say "fill in the form". */}
          {accepting && (
            <>
              <p className="mt-3 max-w-measure text-body leading-relaxed text-drench-on/80">
                {t.standfirst} <span className="font-medium text-drench-on">{reassurance}</span>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-small font-medium text-drench-on">{t.asideCallTitle}</p>
                <ContactButtons lang={lang} onDrench />
              </div>
              {/* The urgent warning in one line on a phone. The full panel
                  sits beside this intro from `lg`. The glyph takes the pale
                  accent, not the warning token: amber on this blue is the one
                  pairing on the band that was never checked for contrast. */}
              <p className="mt-4 flex items-start gap-2 text-small leading-relaxed text-drench-on/80 lg:hidden">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brass-lift" aria-hidden="true" />
                {t.urgentShort}
              </p>
            </>
          )}
        </div>

        {accepting && (
          /* Beside the intro, not after the form: someone in pain decides at
             the top of the page whether to fill anything in. It used to be a
             drenched band BELOW a ~2,000px form. No animation — the same
             register as the form's own urgency toggle. The deeper blue sets it
             apart from the band without a second hue. */
          <aside
            aria-labelledby="urgent-title"
            className="hidden rounded-xl border border-drench-on/20 bg-drench-deep p-6 lg:col-span-4 lg:col-start-9 lg:block"
          >
            <h2
              id="urgent-title"
              className="flex items-center gap-2 font-heading text-h4 font-medium text-drench-on"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-brass-lift" aria-hidden="true" />
              {t.urgentTitle}
            </h2>
            <p className="mt-2 text-small leading-relaxed text-drench-on/80">{t.urgentBody}</p>
            <Button
              asChild
              size="sm"
              variant="onDrench"
              className="mt-4 focus-visible:ring-offset-drench-deep"
            >
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
          shellClassName="items-start gap-y-8 lg:gap-y-10"
        >
          <div className="lg:col-span-7">
            {/* The form sits on a raised surface so the fields — which carry
                the canvas tone themselves — stay legible against it. Nothing
                stands between the band above and this card on a phone: the
                "what happens next" strip that used to sit here was a second
                row of three numbers directly above the form's own three-part
                progress strip, and two numbered rows read as one confused
                list. The full steps are in the aside, after the form. */}
            <div className="rounded-xl border border-line bg-card p-4 shadow-e2 sm:p-8 lg:p-10">
              <AppointmentForm serviceOptions={serviceOptions(lang)} />
            </div>
          </div>

          {/* Stretched to the height of the form so the lower block can stick
              inside it. The steps scroll away; the channels do not. */}
          <aside className="lg:col-span-4 lg:col-start-9 lg:self-stretch">
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

            {/* The part that follows the visitor down a long form: the form is
                several screens tall on a desktop, and many of these patients
                would rather pick up the phone or open WhatsApp halfway through
                than finish it. Sticky only where the block fits under the
                header — pinned on a short laptop its bottom was cut off until
                the end of the form. 46rem is 736px: `rem` in a media query is
                the browser default 16px, NOT this site's 17px root, and the
                block is roughly 600px plus its 6rem offset. */}
            <div className="mt-8 space-y-6 [@media(min-height:46rem)]:lg:sticky [@media(min-height:46rem)]:lg:top-24">
              {/* One drenched card on the light band: the alternative to the
                  form is the thing in this column that must not be missed. */}
              <div className="drenched rounded-xl p-5">
                <h2 className="text-base font-medium text-drench-on">{t.asideCallTitle}</h2>
                <p className="mt-1 text-small leading-relaxed text-drench-on/80">{t.asideCallBody}</p>
                <ContactButtons lang={lang} onDrench className="mt-4" />
              </div>
              <PracticeDetails lang={lang} />
              <DirectoryProfileLink lang={lang} />
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
