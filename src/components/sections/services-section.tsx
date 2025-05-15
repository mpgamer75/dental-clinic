
'use client';

import type { Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { generalUiStrings } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Users, Anchor, Smile, Sparkles, ShieldCheck, HeartPulse, Bone, type LucideProps } from 'lucide-react';
// import { ToothIcon } from '@/components/icons/tooth-icon'; // Custom icon removed
import type React from 'react';

interface ServicesSectionProps {
  id: string; 
  title: string;
  description: string;
  servicesList: Service[];
}

const IconComponents: Record<string, React.FC<LucideProps> | React.FC<React.SVGProps<SVGSVGElement>>> = {
  Users,
  Anchor,
  Smile,
  // ToothIcon, // Removed as the icon file is deleted
  Sparkles,
  ShieldCheck,
  HeartPulse,
  Bone,
};


export function ServicesSection({ id, title, description, servicesList }: ServicesSectionProps) {
  const { lang } = useLanguage();
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const currentStrings = generalUiStrings[lang];

  const toggleDescription = (serviceTitle: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [serviceTitle]: !prev[serviceTitle],
    }));
  };

  // Determine a sensible max length before "Read More" is shown.
  const MAX_CHARS_BEFORE_TRUNCATE = 200; 


  return (
    <section id={id} className="bg-background py-12 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">{title}</h2>
          <p className="text-lg md:text-xl text-muted-foreground mt-3 md:mt-4 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service) => {
            const IconComponent = service.iconName ? IconComponents[service.iconName] : null;
            const isExpanded = expandedDescriptions[service.title] || false;
            const showReadMoreButton = service.description.length > MAX_CHARS_BEFORE_TRUNCATE;

            return (
              <Card 
                key={service.title} 
                className="shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/30 hover:scale-105 flex flex-col bg-card rounded-xl overflow-hidden group hover:border-primary border border-transparent"
              >
                <CardHeader className="items-center text-center pt-8 pb-4">
                  {IconComponent && (
                     <div className="mb-4 p-4 bg-primary/10 rounded-full inline-flex text-primary group-hover:bg-primary/20 transition-colors duration-300">
                        <IconComponent className="h-12 w-12 md:h-14 md:w-14" />
                     </div>
                  )}
                  <CardTitle className="text-xl md:text-2xl font-semibold text-primary">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-left flex-grow flex flex-col px-6 pb-8">
                  <CardDescription 
                    className={cn(
                      "text-foreground/80 text-base leading-relaxed flex-grow transition-all duration-300 ease-in-out",
                      !isExpanded && showReadMoreButton && "line-clamp-5" // Show more lines before truncating
                    )}
                  >
                    {service.description}
                  </CardDescription>
                  {showReadMoreButton && (
                    <Button 
                      variant="link" 
                      onClick={() => toggleDescription(service.title)} 
                      className="mt-2 self-start px-0 text-primary hover:text-primary/80"
                    >
                      {isExpanded ? currentStrings.readLess : currentStrings.readMore}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
