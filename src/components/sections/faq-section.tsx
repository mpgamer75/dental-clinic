import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';

import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import type { HomeFaqItem, contactDetails } from '@/lib/data';

type FaqCopy = (typeof contactDetails.faqSection)['es'];

interface FaqSectionProps {
  id: string;
  copy: FaqCopy;
  items: HomeFaqItem[];
  /** The implant guide, for "Más preguntas sobre implantes". */
  guideHref: string;
}

/**
 * The questions people ask before the first visit — implant questions first.
 *
 * Native exclusive disclosures (`<details name>`), not the Radix accordion this
 * replaces: no JavaScript, the browser opens the one you search for with
 * Ctrl+F, and the previous accordion animated `height`, a layout property, on
 * every open and close. `name` keeps one answer open at a time where supported
 * and degrades to independent disclosures where not.
 *
 * Answers borrowed from the implant guide link back to the page they come
 * from, where the rest of that topic is.
 */
export function FaqSection({ id, copy, items, guideHref }: FaqSectionProps) {
  return (
    <Section id={id} tone="tint" space="normal">
      <div className="grid gap-x-[6%] gap-y-8 lg:col-span-12 lg:grid-cols-12">
        {/* Sticky: the list is long and the heading should stay with it. */}
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <SectionHeading title={copy.title} description={copy.description} align="left" className="mb-0 md:mb-0" />
          <Link
            href={guideHref}
            className="mt-6 inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            {copy.moreLink}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {items.map((item) => (
            <details key={item.id} name="faq" className="disclosure border-b border-line first:border-t first:border-t-line-strong lg:first:border-t-0">
              <summary className="flex items-start justify-between gap-6 rounded-sm py-6 font-heading text-h4 font-medium text-ink transition-colors duration-fast hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [[open]>&]:text-primary">
                {item.question}
                <ChevronDown className="disclosure-chevron mt-1 h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
              </summary>
              <div className="disclosure-body max-w-measure pb-7 leading-relaxed text-ink-soft">
                <p>{item.answer}</p>
                {item.origin === 'guide' && item.href && (
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {copy.guideAnswerLink}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
