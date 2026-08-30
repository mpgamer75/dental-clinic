import {
  getBreadcrumbStructuredData,
  getDentalClinicStructuredData,
  getDoctorStructuredData,
  getFAQStructuredData,
  getImplantBreadcrumbTrail,
  getMedicalWebPageStructuredData,
} from '@/lib/seo-config';
import {
  IMPLANT_CLUSTER_SEGMENT,
  implantCluster,
  type ImplantSpokeSlug,
} from '@/lib/data';
import type { Language } from '@/lib/types';

/**
 * The structured-data graph for one page of the implant cluster.
 *
 * Five linked nodes, and each earns its place:
 *
 *   MedicalWebPage   classifies the document as health content and names the
 *                    procedure it is about. A generic WebPage says none of it.
 *   BreadcrumbList   a genuine two- or three-level trail. The homepage's old
 *                    one-item list told a crawler nothing.
 *   FAQPage          the questions are real questions with real answers on the
 *                    page — which is the condition for emitting this at all.
 *   Dentist/Clinic   the local-business entity, with `availableService` now
 *                    pointing back at these very pages.
 *   Person           Dr. Valerio, carrying the nine real diplomas as
 *                    `hasCredential`. On a medical page, that is the whole
 *                    expertise signal.
 *
 * They reference each other by `@id`, so the graph describes one clinic and one
 * clinician rather than declaring six copies across six pages.
 */
export function ClusterJsonLd({
  lang,
  spoke,
}: {
  lang: Language;
  spoke?: ImplantSpokeSlug;
}) {
  const cluster = implantCluster[lang];
  const page = spoke
    ? (cluster.spokes.find((s) => s.slug === spoke) ?? cluster.pillar)
    : cluster.pillar;

  const path = spoke ? `${IMPLANT_CLUSTER_SEGMENT}/${spoke}` : IMPLANT_CLUSTER_SEGMENT;

  const graph: unknown[] = [
    getMedicalWebPageStructuredData({
      lang,
      path,
      name: page.metaTitle,
      description: page.metaDescription,
      procedureName: page.procedureName,
    }),
    getBreadcrumbStructuredData(lang, getImplantBreadcrumbTrail(lang, spoke)),
    getDentalClinicStructuredData(lang),
    getDoctorStructuredData(lang),
  ];

  if (page.faq.length > 0) {
    graph.push(getFAQStructuredData(page.faq));
  }

  // JSON.stringify does not escape `<`, so a `</script>` sequence appearing in
  // any answer would terminate the tag early and inject markup. The content is
  // first-party today, but escaping here makes that class of bug impossible
  // rather than dependent on nobody ever pasting the wrong thing into data.ts.
  const json = JSON.stringify(graph).replace(/</g, '\\u003c');

  // A plain <script>, not next/script: in the App Router next/script with an
  // inline body rewrites the content into a `self.__next_s.push(...)` bootstrap
  // array, so the server HTML contains no `application/ld+json` element at all
  // and crawlers reading raw HTML see nothing.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
