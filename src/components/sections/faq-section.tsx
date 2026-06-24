import type { FAQItem } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';

interface FaqSectionProps {
  id: string;
  title: string;
  description: string;
  faqItemsList: FAQItem[];
}

export function FaqSection({ id, title, description, faqItemsList }: FaqSectionProps) {
  return (
    <section id={id} className="bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading title={title} description={description} />

        <Reveal className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqItemsList.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="overflow-hidden rounded-xl border border-border/60 bg-card px-2 shadow-sm transition-all duration-300 hover:border-primary/40 data-[state=open]:border-primary/50 data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="px-4 py-5 text-left font-heading text-base font-semibold text-foreground transition-colors hover:text-primary hover:no-underline data-[state=open]:text-primary md:text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-5 text-base leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
