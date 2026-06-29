'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Building2, Award, BookOpen, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { SectionHeading } from '@/components/section-heading';
import { Reveal, RevealGroup, RevealItem } from '@/components/reveal';
import { CountUp } from '@/components/count-up';
import { cn } from '@/lib/utils';

interface Diploma {
  id: string;
  title: string;
  institution: string;
  year: string;
  image: string;
  description: string;
}

interface DiplomasSectionProps {
  id: string;
  title: string;
  description: string;
  diplomasList: Diploma[];
}

export function DiplomasSection({ id, title, description, diplomasList }: DiplomasSectionProps) {
  const { lang } = useLanguage();

  const t =
    lang === 'es'
      ? {
          eyebrow: 'Excelencia Profesional',
          certs: 'Certificaciones',
          years: 'Años de formación',
          institutions: 'Instituciones',
          ctaTitle: 'Formación Continua',
          ctaText:
            'Más de 30 años de aprendizaje constante y actualización profesional garantizan tratamientos de vanguardia basados en las últimas técnicas y tecnologías.',
        }
      : {
          eyebrow: 'Professional Excellence',
          certs: 'Certifications',
          years: 'Years of training',
          institutions: 'Institutions',
          ctaTitle: 'Continuing Education',
          ctaText:
            'Over 30 years of constant learning and professional development ensure cutting-edge treatments based on the latest techniques and technologies.',
        };

  // Sort by descending year.
  const sortedDiplomas = [...diplomasList].sort((a, b) => parseInt(b.year) - parseInt(a.year));
  const institutionsCount = new Set(diplomasList.map((d) => d.institution)).size;

  const stats = [
    { icon: GraduationCap, value: String(diplomasList.length), label: t.certs },
    { icon: TrendingUp, value: '30+', label: t.years },
    { icon: BookOpen, value: String(institutionsCount), label: t.institutions },
  ];

  const DiplomaCard = ({ diploma }: { diploma: Diploma }) => (
    <Card className="group h-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <Badge className="bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Calendar className="mr-1 h-3 w-3" />
            {diploma.year}
          </Badge>
          <Award className="h-5 w-5 shrink-0 text-highlight" aria-hidden="true" />
        </div>
        <h3 className="font-heading text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {diploma.title}
        </h3>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="leading-tight">{diploma.institution}</span>
        </div>
        <p className="border-t border-border/40 pt-3 text-sm leading-relaxed text-foreground/75">
          {diploma.description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <section id={id} className="relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Subtle ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-highlight/5 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <SectionHeading eyebrow={t.eyebrow} title={title} description={description} />

        {/* Stats */}
        <RevealGroup className="mx-auto mb-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <RevealItem key={stat.label}>
              <div className="flex items-center justify-center gap-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <p className="font-heading text-2xl font-bold text-foreground">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Desktop timeline */}
        <Reveal className="mb-16 hidden lg:block">
          <div className="relative">
            <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/10 via-primary/40 to-primary/10" />
            {sortedDiplomas.map((diploma, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div
                  key={diploma.id}
                  className={cn('relative mb-10', isLeft ? 'pr-[55%] text-right' : 'pl-[55%] text-left')}
                >
                  <div
                    className={cn(
                      'absolute top-6 z-10 h-3.5 w-3.5 rounded-full border-4 border-background bg-primary',
                      isLeft ? 'right-[calc(45%-7px)]' : 'left-[calc(45%-7px)]',
                    )}
                    aria-hidden="true"
                  />
                  <div className="text-left">
                    <DiplomaCard diploma={diploma} />
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Mobile / tablet grid */}
        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:hidden">
          {sortedDiplomas.map((diploma) => (
            <RevealItem key={diploma.id} className="h-full">
              <DiplomaCard diploma={diploma} />
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Closing note */}
        <Reveal className="mt-16 text-center">
          <div className="mx-auto inline-block max-w-2xl rounded-2xl border border-border/50 bg-gradient-to-r from-primary/5 via-highlight/5 to-primary/5 p-8 shadow-sm">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-primary" aria-hidden="true" />
            <h3 className="mb-3 font-heading text-2xl font-bold text-foreground">{t.ctaTitle}</h3>
            <p className="leading-relaxed text-muted-foreground">{t.ctaText}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
