import type { FAQItem } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Section } from '@/components/primitives/section';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';

interface FaqSectionProps {
  id: string;
  title: string;
  description: string;
  faqItemsList: FAQItem[];
}

/**
 * Objection handling, placed last: by this point the visitor has the claim,
 * the mechanism and the proof, so what's left is the specific thing stopping
 * them booking.
 */
export function FaqSection({ id, title, description, faqItemsList }: FaqSectionProps) {
  return (
    <Section id={id} tone="canvas" space="normal">
      <div className="grid gap-x-[6%] gap-y-8 lg:col-span-12 lg:grid-cols-12">
        {/* Sticky: the question list is long, and the heading should stay with
            it rather than scrolling away at the top. */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
          <SectionHeading title={title} description={description} align="left" className="mb-0" />
        </div>

        <Reveal className="lg:col-span-7 lg:col-start-6">
          <Accordion type="single" collapsible className="w-full">
            {faqItemsList.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-b border-line last:border-b-0"
              >
                <AccordionTrigger className="py-6 text-left font-heading text-h4 font-medium text-ink hover:no-underline data-[state=open]:text-terracotta">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-measure pb-6 text-base leading-relaxed text-ink-soft">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
