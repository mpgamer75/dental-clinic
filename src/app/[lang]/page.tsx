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
import type { Language, TestimonialSupabase } from '@/lib/types';
import { createServerClient } from '@/lib/supabase-server';
import {
  getDentalClinicStructuredData,
  getBreadcrumbStructuredData,
  getFAQStructuredData,
} from '@/lib/seo-config';

/**
 * Next.js signals control flow by THROWING: `notFound()`, `redirect()`, and the
 * dynamic-rendering bailout all surface as errors carrying a `digest`. A
 * catch-all in a Server Component must re-throw these or it silently breaks the
 * framework — swallowing DYNAMIC_SERVER_USAGE in particular made this route
 * look statically renderable, so an empty testimonial list risked being baked
 * into the prerendered HTML.
 */
function isNextControlFlow(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest;
  return (
    typeof digest === 'string' &&
    (digest === 'DYNAMIC_SERVER_USAGE' ||
      digest === 'NEXT_NOT_FOUND' ||
      digest.startsWith('NEXT_REDIRECT'))
  );
}

/**
 * Loads approved testimonials.
 *
 * The homepage must render whether or not the database is reachable, so every
 * genuine failure — unreachable host, missing env, RLS rejection, malformed
 * row — collapses to `{ testimonials: [], failed: true }` and the section shows
 * its error state. Previously an unguarded query here took the whole page down
 * with it.
 */
async function loadTestimonials(): Promise<{
  testimonials: { name: string; quote: string; location?: string }[];
  failed: boolean;
}> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[home] testimonials query failed:', error.message);
      return { testimonials: [], failed: true };
    }

    const rows = (data ?? []) as TestimonialSupabase[];
    return {
      testimonials: rows
        .filter((t) => t?.name && t?.quote)
        .map((t) => ({
          name: t.name,
          quote: t.quote,
          location: t.location || undefined,
        })),
      failed: false,
    };
  } catch (err) {
    if (isNextControlFlow(err)) throw err;
    console.error('[home] testimonials unavailable:', err);
    return { testimonials: [], failed: true };
  }
}

/**
 * This page reads cookies (Supabase SSR client) and live testimonial data, so
 * it is dynamic by nature. Declaring it explicitly stops Next attempting a
 * prerender that can only ever bail out.
 */
export const dynamic = 'force-dynamic';

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
