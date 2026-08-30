import { notFound } from 'next/navigation';
import {
  contactDetails,
  services as allServices,
  faqItems,
  visitUsCarouselImages,
  diplomas,
  homeContent,
} from '@/lib/data';
import { Hero } from '@/components/sections/hero';
import { ProblemSection } from '@/components/sections/problem';
import { ImplantEducation } from '@/components/sections/implant-education';
import { ServicesSection } from '@/components/sections/services-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { DoctorSection } from '@/components/sections/doctor';
import { DiplomasSection } from '@/components/sections/diplomas-section';
import { FaqSection } from '@/components/sections/faq-section';
import { BookingSection } from '@/components/sections/booking';
import { VisitUsCarousel } from '@/components/sections/visit-us-carousel';
import { ContactSection } from '@/components/sections/contact-section';
import type { Language } from '@/lib/types';
import { db } from '@/lib/db';
import { testimonials as testimonialsTable } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import {
  getDentalClinicStructuredData,
  getBreadcrumbStructuredData,
  getFAQStructuredData,
} from '@/lib/seo-config';
import { formatDatabaseFailure } from '@/lib/db-errors';

/**
 * Loads approved testimonials.
 *
 * The homepage must render whether or not the database is reachable, so every
 * genuine failure — unreachable host, missing env, a malformed row — collapses
 * to `{ testimonials: [], failed: true }` and the section shows its error
 * state. Previously an unguarded query here took the whole page down with it.
 *
 * Nothing this function calls can throw Next's control-flow errors, so it does
 * not re-throw them: it reads no cookies and no headers, and `notFound()` is
 * called by the page, outside the try. That was not true of the Supabase SSR
 * client this replaces — it read the cookie store, which meant a caught
 * DYNAMIC_SERVER_USAGE could quietly convert a bailout into a permanently empty
 * testimonial list.
 *
 * The filter and the ordering are exactly what the partial index
 * `testimonials_public_idx` covers (`ON (submitted_at DESC) WHERE status =
 * 'approved'`); changing either without changing the index gives the planner a
 * sequential scan on the one query every visitor triggers.
 */
async function loadTestimonials(): Promise<{
  testimonials: { name: string; quote: string; location?: string }[];
  failed: boolean;
}> {
  try {
    const rows = await db
      .select({
        name: testimonialsTable.name,
        quote: testimonialsTable.quote,
        location: testimonialsTable.location,
      })
      .from(testimonialsTable)
      .where(eq(testimonialsTable.status, 'approved'))
      .orderBy(desc(testimonialsTable.submittedAt));

    return {
      testimonials: rows
        .filter((row) => row.name && row.quote)
        .map((row) => ({
          name: row.name,
          quote: row.quote,
          location: row.location || undefined,
        })),
      failed: false,
    };
  } catch (error) {
    console.error('[home] testimonials unavailable: %s', formatDatabaseFailure(error));
    return { testimonials: [], failed: true };
  }
}

/**
 * Statically rendered, revalidated every five minutes.
 *
 * `force-dynamic` used to be set here, and the reason given for it was the
 * Supabase SSR client reading cookies — a cookie read makes a prerender
 * impossible, so the page was rendered per request whether or not anything on
 * it had changed. The Neon read is cookie-free by construction, so the whole
 * page can go back to being a static file served from the edge.
 *
 * Five minutes is the delay between the dentist approving a testimonial and it
 * appearing. It is also how long a build that happened to run while the
 * database was unreachable would keep serving the section's error state before
 * healing itself, which is the more important of the two numbers.
 */
export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ lang: Language }> }) {
  const resolved = await params;

  // Defence in depth. `dynamicParams = false` in the layout already 404s any
  // unknown segment at the router level; this guarantees the page can never
  // index a content dictionary with an unvalidated path segment even if that
  // routing config is later changed.
  if (resolved?.lang !== 'es' && resolved?.lang !== 'en') notFound();
  const lang: Language = resolved.lang;

  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];
  const t = homeContent[lang];

  const fill = (s: string) =>
    s.replace(/\{\{clinicName\}\}/g, clinicName).replace(/\{\{doctorName\}\}/g, doctorName);

  const base = `/${lang}`;
  const appointmentHref = `${base}/agendar-cita`;
  const contactHref = `${base}#contacto`;
  const implantHref = `${base}#implantes`;
  const diplomasHref = `${base}#diplomas`;

  const servicesList = allServices[lang];
  const faqItemsList = faqItems[lang];
  const diplomasList = diplomas[lang];

  const { testimonials, failed } = await loadTestimonials();

  const carouselImages = visitUsCarouselImages.map((img) => ({
    src: img.src,
    alt: lang === 'es' ? img.altEs : img.altEn,
    hint: img.hint,
  }));

  const structuredData = [
    getDentalClinicStructuredData(lang),
    getBreadcrumbStructuredData(lang, ''),
    getFAQStructuredData(faqItemsList),
  ];

  // JSON.stringify does not escape `<`, so a `</script>` sequence appearing in
  // any FAQ answer would terminate the tag early and inject markup. The content
  // is first-party today, but escaping here makes that class of bug impossible
  // rather than dependent on nobody ever pasting the wrong thing into data.ts.
  const structuredDataJson = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return (
    <>
      {/* Structured data as a plain <script>, not next/script.
          In the App Router, next/script with an inline body does not emit a
          real tag: it rewrites the content into a `self.__next_s.push(...)`
          bootstrap array, so the server HTML contained no
          `type="application/ld+json"` element at all and crawlers that read
          raw HTML saw no structured data. A plain tag is also what Next's own
          docs recommend for JSON-LD. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />

      {/* 1 — the claim, and one action. */}
      <Hero
        content={t.hero}
        trust={t.trust}
        appointmentHref={appointmentHref}
        implantHref={implantHref}
        phone={contactDetails.phone[lang]}
      />

      {/* 2 — why it matters, before anything is sold. */}
      <ProblemSection id="por-que" content={t.problem} />

      {/* 3 — the mechanism. The page's hero object. */}
      <ImplantEducation id="implantes" />

      {/* 4 — everything else the practice does, as supporting detail. */}
      <ServicesSection
        id="servicios"
        lead={t.servicesLead}
        title={contactDetails.servicesSection[lang].title}
        description={fill(contactDetails.servicesSection[lang].description)}
        servicesList={servicesList}
      />

      {/* 5 — proof from patients. */}
      <TestimonialsSection
        id="testimonios"
        title={t.proof.title}
        description={t.proof.description}
        testimonialsList={testimonials}
        loadError={failed}
        ctaButtonText={contactDetails.testimonialsSection[lang].ctaButton}
        dialogTitleText={contactDetails.testimonialsSection[lang].dialogTitle}
        dialogDescriptionText={contactDetails.testimonialsSection[lang].dialogDescription}
      />

      {/* 6 — who is actually going to treat you. */}
      <DoctorSection
        id="el-doctor"
        content={t.doctor}
        qualifications={contactDetails.qualifications[lang]}
        diplomaCount={diplomasList.length}
        diplomasHref={diplomasHref}
        imageAlt={carouselImages[1]?.alt ?? t.hero.imageAlt}
      />

      {/* 7 — the evidence behind the credentials. */}
      <DiplomasSection
        id="diplomas"
        title={fill(contactDetails.diplomasSection[lang].title)}
        description={fill(contactDetails.diplomasSection[lang].description)}
        diplomasList={diplomasList}
      />

      {/* 8 — the room. */}
      <VisitUsCarousel
        id="la-consulta"
        images={carouselImages}
        visitUsContent={contactDetails.visitUs[lang]}
        contactHref={contactHref}
      />

      {/* 9 — objections, immediately before the ask. */}
      <FaqSection
        id="preguntas-frecuentes"
        title={contactDetails.faqSection[lang].title}
        description={fill(contactDetails.faqSection[lang].description)}
        faqItemsList={faqItemsList}
      />

      {/* 10 — the ask, with what happens next spelled out. */}
      <BookingSection
        id="agendar"
        content={t.booking}
        appointmentHref={appointmentHref}
        phone={contactDetails.phone[lang]}
        schedule={contactDetails.schedule[lang]}
      />

      {/* 11 — form, details and map. */}
      <ContactSection
        id="contacto"
        lang={lang}
        title={contactDetails.contactSection[lang].title}
        description={fill(contactDetails.contactSection[lang].description)}
        formTitleText={contactDetails.contactSection[lang].formTitle}
        detailsTitleText={contactDetails.contactSection[lang].detailsTitle}
        addressText={contactDetails.address[lang]}
        phoneText={contactDetails.phone[lang]}
        emailText={contactDetails.email[lang]}
        scheduleText={contactDetails.schedule[lang]}
        mapTitleText={contactDetails.contactSection[lang].mapTitle}
        mapLinkUrl={contactDetails.mapLink[lang]}
        embedMapLinkUrl={contactDetails.embedMapLink[lang]}
        addressLabel={contactDetails.contactSection[lang].addressLabel}
        phoneLabel={contactDetails.contactSection[lang].phoneLabel}
        emailLabel={contactDetails.contactSection[lang].emailLabel}
        scheduleLabel={contactDetails.contactSection[lang].scheduleLabel}
        viewMapButtonText={contactDetails.contactSection[lang].viewMapButton}
      />
    </>
  );
}
