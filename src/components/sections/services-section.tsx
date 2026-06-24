'use client';

import type { Service } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { generalUiStrings } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  Users, Smile, Sparkles, ShieldCheck, HeartPulse,
  Activity, Stethoscope, type LucideProps, Scan, Syringe, ArrowRight,
} from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';

interface ServicesSectionProps {
  id: string;
  title: string;
  description: string;
  servicesList: Service[];
}

// Professional dental icons — all available in Lucide.
const IconComponents: Record<string, React.FC<LucideProps>> = {
  Users,
  Scan,
  Smile,
  Sparkles,
  ShieldCheck,
  HeartPulse,
  Activity,
  Stethoscope,
  Syringe,
  Telescope: Scan, // Fallback: Telescope doesn't exist in Lucide.
};

export function ServicesSection({ id, title, description, servicesList }: ServicesSectionProps) {
  const { lang } = useLanguage();
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const currentStrings = generalUiStrings[lang];

  const toggleDescription = (serviceTitle: string) =>
    setExpandedDescriptions((prev) => ({ ...prev, [serviceTitle]: !prev[serviceTitle] }));

  const MAX_CHARS_BEFORE_TRUNCATE = 200;
  const popularServices = ['Implantes Dentales', 'Dental Implants', 'Ortodoncia', 'Orthodontics'];
  const appointmentsHref = `/${lang}/agendar-cita`;

  return (
    <section id={id} className="bg-gradient-to-b from-background via-secondary/5 to-background">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading
          eyebrow={lang === 'es' ? 'Servicios Especializados' : 'Specialized Services'}
          title={title}
          description={description}
        />

        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((service) => {
            const iconName = service.iconName === 'Telescope' ? 'Scan' : service.iconName;
            const IconComponent = (iconName && IconComponents[iconName]) || ShieldCheck;
            const isExpanded = expandedDescriptions[service.title] || false;
            const showReadMoreButton = service.description.length > MAX_CHARS_BEFORE_TRUNCATE;
            const isPopular = popularServices.includes(service.title);

            return (
              <RevealItem key={service.title} className="h-full">
                <Card className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl">
                  {isPopular && (
                    <div className="absolute right-3 top-3 z-10">
                      <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                        {lang === 'es' ? 'Popular' : 'Popular'}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="items-center pb-4 pt-8 text-center">
                    <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-4 transition-colors duration-300 group-hover:bg-primary/15">
                      <IconComponent
                        className="h-11 w-11 text-primary transition-transform duration-300 group-hover:scale-105"
                        strokeWidth={1.75}
                      />
                    </div>
                    <CardTitle className="font-heading text-xl font-semibold text-primary">
                      {service.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-grow flex-col px-6 pb-8 text-left">
                    <CardDescription
                      className={cn(
                        'flex-grow text-base leading-relaxed text-foreground/75',
                        !isExpanded && showReadMoreButton && 'line-clamp-5',
                      )}
                    >
                      {service.description}
                    </CardDescription>

                    {showReadMoreButton && (
                      <Button
                        variant="link"
                        onClick={() => toggleDescription(service.title)}
                        aria-expanded={isExpanded}
                        className="mt-3 h-auto self-start p-0 font-medium text-primary hover:text-primary/80"
                      >
                        {isExpanded ? currentStrings.readLess : currentStrings.readMore}
                        <span aria-hidden="true" className="ml-1">
                          {isExpanded ? '↑' : '→'}
                        </span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal className="mt-12 text-center">
          <Link href={appointmentsHref}>
            <Button
              size="lg"
              className="btn-shine shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {currentStrings.appointments}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
