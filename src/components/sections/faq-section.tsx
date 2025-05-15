
import type { FAQItem } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FaqSectionProps {
  id: string; // Added id for anchor linking
  title: string;
  description: string;
  faqItemsList: FAQItem[];
}

export function FaqSection({ id, title, description, faqItemsList }: FaqSectionProps) {
  return (
    <section id={id} className="bg-background py-12 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">{title}</h2>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItemsList.map((item) => (
              <AccordionItem 
                key={item.id} 
                value={item.id} 
                className="bg-card shadow-md rounded-lg px-2 transition-shadow duration-300 hover:shadow-xl hover:border-primary/50 border border-transparent"
              >
                <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline p-6 text-primary hover:text-primary/80">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0 text-foreground/80 text-base leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
