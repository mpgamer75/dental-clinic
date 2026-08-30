import Link from 'next/link';
import { ArrowLeft, ArrowRight, Phone } from 'lucide-react';

import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';
import { Button } from '@/components/ui/button';
import {
  contactDetails,
  generalUiStrings,
  implantCluster,
  IMPLANT_CONTENT_REVISED,
  type ImplantPageContent,
  type ImplantSection,
} from '@/lib/data';
import type { Language } from '@/lib/types';

export interface ArticleCrumb {
  name: string;
  href: string;
  /** The page you are on. Rendered as text, not a link. */
  current?: boolean;
}

export interface RelatedCard {
  key: string;
  href: string;
  label: string;
  summary: string;
}

interface ImplantArticleProps {
  lang: Language;
  page: ImplantPageContent;
  /** Crumbs after "Inicio", in order. */
  crumbs: ArticleCrumb[];
  related: RelatedCard[];
  /** Present on a spoke: the route back up to the pillar. */
  backLink?: { href: string; label: string };
}

/**
 * The one renderer behind the implant pillar and all five of its spokes.
 *
 * These six documents are the same object — an argued clinical article with a
 * contents list, ruled sub-points, an FAQ and one terminal call to action —
 * differing only in their copy, which lives in `data.ts` like everything else
 * on this site. Six page files would have been six places for the schema, the
 * breadcrumb and the disclaimer to drift apart.
 *
 * Composition rather than a template: the bands vary their tone and rhythm, and
 * a `section` renders as prose, a ruled definition list, a numbered sequence or
 * any combination, because the shape follows the argument rather than a slot
 * layout. The alternative — ten identical heading-plus-paragraph blocks — is
 * what long-form SEO pages usually look like, and it reads like one.
 *
 * Nothing here animates anything but transform and opacity: every entrance
 * comes from `Reveal`, which is IntersectionObserver + a CSS transition and is
 * visible by default under `prefers-reduced-motion`.
 */
export function ImplantArticle({
  lang,
  page,
  crumbs,
  related,
  backLink,
}: ImplantArticleProps) {
  const ui = implantCluster[lang].ui;
  const readMore = generalUiStrings[lang].readMore;
  const phone = contactDetails.phone[lang];
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;
  const appointmentHref = `/${lang}/agendar-cita`;
  const homeHref = `/${lang}`;

  // Rendered in the reader's own locale rather than as a raw ISO string, which
  // is what `dateModified` carries in the structured data. A patient reading
  // "2026-08-30" learns less than one reading "30 de agosto de 2026".
  const revised = new Intl.DateTimeFormat(lang === 'es' ? 'es-DO' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${IMPLANT_CONTENT_REVISED}T00:00:00Z`));

  return (
    <>
      {/* ── Masthead: where you are, what this is, and what is in it ─────── */}
      <Section tone="canvas" grain space="tight" shellClassName="gap-y-10">
        <nav aria-label={ui.breadcrumbLabel} className="col-feature">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-faint">
            <li>
              <Link
                href={homeHref}
                className="transition-colors duration-fast hover:text-terracotta"
              >
                {ui.home}
              </Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                {crumb.current ? (
                  <span className="text-ink-soft" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="transition-colors duration-fast hover:text-terracotta"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <Reveal className="col-feature">
          <h1 className="font-heading text-h1 font-medium text-ink">{page.h1}</h1>
          {/* Wider than `.measure` on purpose: a standfirst is set larger than
              body copy, so at the same character cap it looks like a stray
              paragraph rather than an opening. */}
          <p className="mt-6 max-w-[52ch] text-h4 leading-relaxed text-ink-soft">
            {page.standfirst}
          </p>
        </Reveal>
      </Section>

      {/* ── The article, with its contents list alongside ─────────────────── */}
      <Section tone="surface" space="normal">
        <div className="grid gap-x-[6%] gap-y-12 lg:col-span-12 lg:grid-cols-12">
          {/* Sticky at lg and above, where there is a gutter for it to live in.
              Below that it is simply the first block on the page — a ten-part
              article that opens with no map of itself asks the reader to scroll
              blind. `position: sticky` needs no scroll handler and no JS. */}
          <aside className="lg:col-span-3 lg:col-start-1">
            <nav
              aria-label={ui.contentsTitle}
              className="rounded-xl border border-line bg-canvas p-5 lg:sticky lg:top-24 lg:border-0 lg:bg-transparent lg:p-0"
            >
              <p className="text-eyebrow uppercase text-ink-faint">{ui.contentsTitle}</p>
              <ol className="mt-4 space-y-2.5">
                {page.sections.map((section, index) => (
                  <li key={section.id} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-px shrink-0 font-heading text-small text-brass-ink tabular"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <a
                      href={`#${section.id}`}
                      className="text-small leading-snug text-ink-soft transition-colors duration-fast hover:text-terracotta"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="lg:col-span-8 lg:col-start-5">
            {page.sections.map((section, index) => (
              <ArticleSection
                key={section.id}
                section={section}
                first={index === 0}
                noteLabel={ui.noteLabel}
              />
            ))}

            <Reveal className="mt-14 border-t border-line pt-6">
              <p className="text-small leading-relaxed text-ink-faint">
                {ui.medicalDisclaimer}
              </p>
              <p className="mt-3 text-small text-ink-faint">
                {ui.revisedLabel}:{' '}
                <time dateTime={IMPLANT_CONTENT_REVISED}>{revised}</time>
              </p>
            </Reveal>
          </article>
        </div>
      </Section>

      {/* ── The questions people actually type ───────────────────────────── */}
      {page.faq.length > 0 && (
        <Section tone="sunk" space="normal">
          <div className="grid gap-x-[6%] gap-y-8 lg:col-span-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading title={ui.faqTitle} align="left" className="mb-0" />
            </div>
            <RevealGroup as="dl" stagger={0.05} className="lg:col-span-7 lg:col-start-6">
              {page.faq.map((item) => (
                <RevealItem key={item.question} className="border-t border-line py-6">
                  <dt className="font-heading text-h4 font-medium text-ink">
                    {item.question}
                  </dt>
                  <dd className="mt-3 max-w-measure leading-relaxed text-ink-soft">
                    {item.answer}
                  </dd>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Section>
      )}

      {/* ── The rest of the cluster ──────────────────────────────────────── */}
      {related.length > 0 && (
        <Section tone="canvas" space="normal">
          <SectionHeading
            title={ui.relatedTitle}
            description={ui.relatedLead}
            align="left"
          />
          <RevealGroup
            stagger={0.06}
            className="grid gap-5 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3"
          >
            {related.map((item) => (
              <RevealItem key={item.key} as="article" className="h-full">
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-xl border border-line bg-surface p-6 transition-colors duration-base ease-out-quart hover:border-terracotta/50 hover:bg-terracotta-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <h3 className="font-heading text-h4 font-medium text-ink">{item.label}</h3>
                  <p className="mt-3 text-small leading-relaxed text-ink-soft">
                    {item.summary}
                  </p>
                  {/* aria-hidden: the link's accessible name is already the
                      heading plus the summary, and "Leer Más" repeated six
                      times down a card grid is noise in a screen reader's link
                      list. It is here for sighted readers as an affordance. */}
                  <span
                    aria-hidden="true"
                    className="mt-auto inline-flex items-center gap-1.5 pt-6 text-small text-terracotta"
                  >
                    {readMore}
                    <ArrowRight className="h-4 w-4 transition-transform duration-base ease-out-quart group-hover:translate-x-1" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>

          {backLink && (
            <Reveal className="mt-10 lg:col-span-12">
              <Link
                href={backLink.href}
                className="inline-flex items-center gap-2 text-small text-ink-soft transition-colors duration-fast hover:text-terracotta"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {backLink.label}
              </Link>
            </Reveal>
          )}
        </Section>
      )}

      {/* ── One action, and an honest description of what it is ──────────── */}
      <Section tone="drench" space="normal">
        <Reveal className="col-popout">
          <h2 className="font-heading text-h2 font-medium text-drench-on">{ui.ctaTitle}</h2>
          <p className="mt-5 max-w-measure text-body leading-relaxed text-drench-on/80">
            {ui.ctaBody}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" variant="brass">
              <Link href={appointmentHref}>{ui.ctaPrimary}</Link>
            </Button>
            <Button asChild size="xl" variant="onDrench">
              <a href={telHref}>
                <Phone className="h-5 w-5" aria-hidden="true" />
                {ui.ctaCall}
              </a>
            </Button>
          </div>
          <p className="mt-5 text-sm text-drench-on/65">{ui.ctaReassurance}</p>
          <p className="mt-2 text-sm text-drench-on/65">{contactDetails.schedule[lang]}</p>
        </Reveal>
      </Section>
    </>
  );
}

/**
 * One band of the article.
 *
 * The rule between sections is drawn by the section itself rather than by a
 * gap, so the article reads as a continuous document. The first one suppresses
 * it, because a rule directly under the masthead reads as a stray divider.
 */
function ArticleSection({
  section,
  first,
  noteLabel,
}: {
  section: ImplantSection;
  first: boolean;
  noteLabel: string;
}) {
  return (
    <section
      id={section.id}
      className={first ? '' : 'mt-14 border-t border-line pt-12'}
    >
      <Reveal>
        <h2 className="font-heading text-h3 font-medium text-ink">{section.heading}</h2>
        {section.body.map((paragraph, index) => (
          <p
            key={`${section.id}-p${index}`}
            className="mt-5 max-w-measure text-body leading-relaxed text-ink-soft"
          >
            {paragraph}
          </p>
        ))}
      </Reveal>

      {section.points && (
        <RevealGroup as="dl" stagger={0.05} className="mt-9">
          {section.points.map((point) => (
            <RevealItem key={point.term} className="border-t border-line py-5">
              <dt className="font-heading text-h4 font-medium text-ink">{point.term}</dt>
              <dd className="mt-2 max-w-measure leading-relaxed text-ink-soft">
                {point.detail}
              </dd>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      {section.steps && (
        <RevealGroup as="ol" stagger={0.06} className="mt-9">
          {section.steps.map((step, index) => (
            <RevealItem
              key={step.title}
              as="li"
              className="grid grid-cols-[auto_1fr] gap-x-5 pb-8 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/45 font-heading text-small font-medium text-brass-ink tabular"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-heading text-h4 font-medium text-ink">{step.title}</h3>
                <p className="mt-2 max-w-measure leading-relaxed text-ink-soft">
                  {step.desc}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      {section.note && (
        <Reveal className="mt-9">
          {/* The caveats are the most valuable sentences on a page like this —
              the ones a patient repeats back in the chair — so they are set
              apart in brass rather than buried at the end of a paragraph. */}
          <aside className="rounded-xl border border-brass/35 bg-brass-soft/60 p-5">
            <p className="text-eyebrow uppercase text-brass-ink">{noteLabel}</p>
            <p className="mt-2.5 max-w-measure leading-relaxed text-ink">{section.note}</p>
          </aside>
        </Reveal>
      )}
    </section>
  );
}
