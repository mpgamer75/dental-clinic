import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';

import { Hero } from '@/components/sections/hero';
import { ClinicSection } from '@/components/sections/clinic';
import { ProblemSection } from '@/components/sections/problem';
import { ImplantEducation } from '@/components/sections/implant-education';
import { DoctorSection } from '@/components/sections/doctor';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { ServicesSection } from '@/components/sections/services-section';
import { FaqSection } from '@/components/sections/faq-section';
import { ContactSection } from '@/components/sections/contact-section';
import { BookingSection } from '@/components/sections/booking';
import {
  contactDetails,
  diplomas,
  diplomasUi,
  getHomeFaq,
  homeContent,
  implantCluster,
  implantClusterPath,
  implantEducation,
  implantPartDetails,
  implantPartGuideHrefs,
  services,
} from '@/lib/data';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { testimonials as testimonialsTable } from '@/lib/schema';
import {
  getBreadcrumbStructuredData,
  getDentalClinicStructuredData,
  getDoctorStructuredData,
  getFAQStructuredData,
} from '@/lib/seo-config';
import { getPublicSiteSettings } from '@/lib/site-settings';
import type { Diploma, Language, Testimonial } from '@/lib/types';

const RETRY_DELAYS_MS = [250, 1000];

/**
 * Approved, real testimonials, newest first.
 *
 * Two failure modes this is built around, both observed:
 *
 *   - Neon's first connection from a fresh process can fail while the compute
 *     wakes from suspend. A single attempt turned that blip into a cached
 *     page: the catch reported success to Next, so the homepage's ISR window
 *     served "No pudimos cargar los testimonios" for five minutes. Errors with
 *     no SQLSTATE (transport, not query) are therefore retried with a short
 *     backoff before anything is decided.
 *   - When it still fails at RUNTIME (an ISR regeneration), this throws. Next
 *     then keeps serving the last good page and retries on a later request —
 *     the right answer, because the last good page has the testimonials in it.
 *     Only at BUILD time is there no previous page to keep, and there the
 *     section is simply left out rather than failing the deploy.
 *
 * `is_demo = false`: rows invented by the demo-data script must never reach
 * the public page, whatever their status — approval is refused for them in the
 * panel, and this makes it impossible here as well.
 *
 * The filter and ordering match the partial index `testimonials_public_idx`
 * (`ON (submitted_at DESC) WHERE status = 'approved'`).
 */
async function loadTestimonials(): Promise<Testimonial[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      const rows = await db
        .select({
          name: testimonialsTable.name,
          quote: testimonialsTable.quote,
          location: testimonialsTable.location,
        })
        .from(testimonialsTable)
        .where(and(eq(testimonialsTable.status, 'approved'), eq(testimonialsTable.isDemo, false)))
        .orderBy(desc(testimonialsTable.submittedAt));

      return rows
        .filter((row) => row.name && row.quote)
        .map((row) => ({ name: row.name, quote: row.quote, location: row.location || undefined }));
    } catch (error) {
      const detail = formatDatabaseFailure(error);
      const transient = !/sqlstate [0-9A-Z]{5}/i.test(detail);
      if (transient && attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      console.error('[home] testimonials unavailable: %s', detail);
      if (process.env.NEXT_PHASE === 'phase-production-build') return [];
      throw new Error('Testimonials could not be loaded; keeping the previous page.');
    }
  }
}

/**
 * Static, regenerated at most every five minutes — and on demand: approving a
 * testimonial and saving the site settings both revalidate this route, so the
 * window is only the backstop.
 */
export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ lang: Language }> }) {
  const resolved = await params;

  // Defence in depth: `dynamicParams = false` in the layout already 404s any
  // other segment; this keeps an unvalidated value from ever indexing content.
  if (resolved?.lang !== 'es' && resolved?.lang !== 'en') notFound();
  const lang: Language = resolved.lang;

  const doctorName = contactDetails.doctorName[lang];
  const t = homeContent[lang];
  const base = `/${lang}`;
  const appointmentHref = `${base}/agendar-cita`;
  const cluster = implantCluster[lang];

  const [testimonials, settings] = await Promise.all([loadTestimonials(), getPublicSiteSettings()]);

  const acceptsTestimonials = settings.allowTestimonials;
  const testimonialsCopy = contactDetails.testimonialsSection[lang];
  const closeLabel = lang === 'es' ? 'Cerrar' : 'Close';
  const testimonialDialog = acceptsTestimonials
    ? {
        ctaButton: testimonialsCopy.ctaButton,
        title: testimonialsCopy.dialogTitle,
        description: testimonialsCopy.dialogDescription,
        closeLabel,
      }
    : null;

  // Newest first. A year that does not parse sorts last instead of becoming NaN.
  const sortedDiplomas: Diploma[] = [...diplomas[lang]].sort((a, b) => {
    const ay = Number.parseInt(a.year, 10);
    const by = Number.parseInt(b.year, 10);
    if (Number.isNaN(ay) && Number.isNaN(by)) return 0;
    if (Number.isNaN(ay)) return 1;
    if (Number.isNaN(by)) return -1;
    return by - ay;
  });

  const faq = getHomeFaq(lang);

  const structuredData = [
    getDentalClinicStructuredData(lang),
    // The person and his credentials. This page is where the nine diplomas
    // are shown, so it is where `hasCredential` belongs; it used to be marked
    // up only on the implant guide, which shows none of them.
    getDoctorStructuredData(lang),
    getBreadcrumbStructuredData(lang, ''),
    // Only the homepage's own questions: the borrowed implant answers are
    // marked up on the guide pages they belong to, and Google asks for a
    // repeated question to be marked up once.
    getFAQStructuredData(faq.filter((item) => item.origin === 'home')),
  ];

  // JSON.stringify does not escape `<`, so a `</script>` inside any answer
  // would end the tag early and inject markup.
  const structuredDataJson = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return (
    <>
      {/* A plain <script>, not next/script: in the App Router an inline
          next/script is rewritten into a JS bootstrap array, so crawlers that
          read raw HTML saw no structured data at all. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson }} />

      {/* 1 — the claim, one action, and the implant going in. */}
      <Hero
        lang={lang}
        content={t.hero}
        appointmentHref={appointmentHref}
        implantHref={`${base}#implantes`}
        diplomaCount={diplomas[lang].length}
      />

      {/* The place, in photographs: a real door, straight after the film. */}
      <ClinicSection
        id="la-clinica"
        lang={lang}
        content={t.clinic}
        address={contactDetails.address[lang]}
        schedule={contactDetails.schedule[lang]}
        directionsHref={`${base}#contacto`}
      />

      {/* 2 — why it matters, before anything is offered. */}
      <ProblemSection id="por-que" content={t.problem} implantHref={`${base}#implantes`} />

      {/* 3 — what each part is for, and how long the treatment takes. */}
      <ImplantEducation
        id="implantes"
        content={implantEducation[lang]}
        details={implantPartDetails[lang]}
        appointmentHref={appointmentHref}
        guide={{
          allHref: implantClusterPath(lang),
          partHrefs: implantPartGuideHrefs(lang),
          links: cluster.spokes.map((spoke) => ({
            href: implantClusterPath(lang, spoke.slug),
            label: spoke.shortLabel,
            summary: spoke.cardSummary,
          })),
        }}
      />

      {/* 4 — who will treat you, with the documents directly under the claim. */}
      <DoctorSection
        id="el-doctor"
        content={t.doctor}
        qualifications={contactDetails.qualifications[lang]}
        diplomas={{
          items: sortedDiplomas,
          ui: diplomasUi[lang],
          title: contactDetails.diplomasSection[lang].title,
          description: contactDetails.diplomasSection[lang].description,
        }}
        invite={
          testimonials.length === 0 && testimonialDialog
            ? {
                dialogTitle: testimonialDialog.title,
                dialogDescription: testimonialDialog.description,
                closeLabel,
              }
            : null
        }
      />

      {/* 5 — what patients say, when there is something to show. */}
      <TestimonialsSection
        id="testimonios"
        title={t.proof.title}
        description={t.proof.description}
        testimonials={testimonials}
        dialog={testimonialDialog}
      />

      {/* 6 — everything else the practice does, weighted. */}
      <ServicesSection
        id="servicios"
        copy={contactDetails.servicesSection[lang]}
        description={contactDetails.servicesSection[lang].description.replace('{{doctorName}}', doctorName)}
        services={services[lang]}
        implantGuideHref={implantClusterPath(lang)}
        followsBlueBand={testimonials.length === 0}
      />

      {/* 7 — the questions, implant questions first. */}
      <FaqSection
        id="preguntas-frecuentes"
        copy={contactDetails.faqSection[lang]}
        items={faq}
        guideHref={implantClusterPath(lang)}
      />

      {/* 8 — where it is, and every way to reach it. */}
      <ContactSection id="contacto" lang={lang} showForm={settings.allowContactForm} />

      {/* 9 — the ask, last. */}
      <BookingSection
        id="agendar"
        lang={lang}
        content={t.booking}
        appointmentHref={appointmentHref}
        schedule={contactDetails.schedule[lang]}
      />
    </>
  );
}
