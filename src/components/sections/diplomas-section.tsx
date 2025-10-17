'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Building2, Award, BookOpen, TrendingUp } from 'lucide-react';
import { useState } from 'react';
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tri par année décroissante
  const sortedDiplomas = [...diplomasList].sort((a, b) => parseInt(b.year) - parseInt(a.year));

  return (
    <section id={id} className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header avec stats */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6 animate-fade-in shadow-lg">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Excelencia Profesional</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 animate-slide-up drop-shadow-lg">
            {title}
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {description}
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
            <div className="bg-card/80 backdrop-blur-sm border-2 border-border/60 rounded-xl p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-slide-up shadow-lg" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg shadow-inner">
                  <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground drop-shadow">{diplomasList.length}</p>
                  <p className="text-xs text-muted-foreground">Certificaciones</p>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-2 border-border/60 rounded-xl p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-slide-up shadow-lg" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg shadow-inner">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground drop-shadow">30+</p>
                  <p className="text-xs text-muted-foreground">Años de formación</p>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-2 border-border/60 rounded-xl p-4 hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-slide-up shadow-lg" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg shadow-inner">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground drop-shadow">{new Set(diplomasList.map(d => d.institution)).size}</p>
                  <p className="text-xs text-muted-foreground">Instituciones</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline SIMPLE pour desktop */}
        <div className="hidden lg:block mb-16">
          <div className="relative">
            {/* Ligne centrale verticale */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20 rounded-full shadow-lg" />

            {sortedDiplomas.map((diploma, index) => {
              const isLeft = index % 2 === 0;
              const isHovered = hoveredId === diploma.id;
              const isSelected = selectedId === diploma.id;
              
              return (
                <div 
                  key={diploma.id}
                  className={cn(
                    "relative mb-12 animate-fade-in",
                    isLeft ? "text-right pr-[55%]" : "text-left pl-[55%]"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={() => setHoveredId(diploma.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedId(isSelected ? null : diploma.id)}
                >
                  {/* Point sur la timeline */}
                  <div className={cn(
                    "absolute top-6 w-4 h-4 rounded-full bg-primary border-4 border-background transition-all duration-300 z-10 shadow-lg",
                    isLeft ? "right-[calc(45%-8px)]" : "left-[calc(45%-8px)]",
                    (isHovered || isSelected) && "scale-150 shadow-2xl shadow-primary/50 ring-4 ring-primary/20"
                  )} />

                  {/* Ligne connectrice horizontale */}
                  <div className={cn(
                    "absolute top-7 w-[5%] h-0.5 bg-primary/30 transition-all duration-300",
                    isLeft ? "right-[45%]" : "left-[45%]",
                    (isHovered || isSelected) && "bg-primary shadow-lg shadow-primary/50"
                  )} />

                  {/* Card diplôme */}
                  <Card className={cn(
                    "transition-all duration-500 cursor-pointer border-2 shadow-xl",
                    (isHovered || isSelected) 
                      ? "border-primary/70 shadow-2xl scale-105 bg-card ring-4 ring-primary/10 -translate-y-2" 
                      : "border-border/50 shadow-lg hover:border-primary/40 hover:shadow-2xl"
                  )}>
                    <CardHeader className="pb-3 relative overflow-hidden">
                      {/* Effet de brillance sur hover */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700",
                        (isHovered || isSelected) ? "translate-x-full" : "-translate-x-full"
                      )} />
                      
                      <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
                        <Badge className={cn(
                          "text-xs font-semibold px-3 py-1 transition-all duration-300 shadow-md",
                          (isHovered || isSelected)
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-primary/10 text-primary"
                        )}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {diploma.year}
                        </Badge>
                        <Award className={cn(
                          "h-5 w-5 transition-all duration-300 drop-shadow",
                          (isHovered || isSelected) ? "text-primary scale-125 rotate-12" : "text-muted-foreground"
                        )} />
                      </div>
                      <h3 className={cn(
                        "text-lg font-bold transition-colors duration-300 leading-tight relative z-10",
                        (isHovered || isSelected) ? "text-primary drop-shadow" : "text-foreground"
                      )}>
                        {diploma.title}
                      </h3>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="leading-tight">{diploma.institution}</span>
                      </div>
                      
                      {isSelected && (
                        <div className="pt-3 border-t border-border/40 animate-fade-in">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {diploma.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid View pour mobile et tablette */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedDiplomas.map((diploma, index) => {
            const isHovered = hoveredId === diploma.id;
            const isSelected = selectedId === diploma.id;
            
            return (
              <Card 
                key={diploma.id}
                className={cn(
                  "transition-all duration-300 cursor-pointer border-2 animate-slide-up shadow-lg",
                  (isHovered || isSelected)
                    ? "border-primary/70 shadow-2xl scale-105 bg-card ring-4 ring-primary/10"
                    : "border-border/50 hover:border-primary/40 hover:shadow-xl"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredId(diploma.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedId(isSelected ? null : diploma.id)}
              >
                <CardHeader className="pb-3 relative overflow-hidden">
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700",
                    (isHovered || isSelected) ? "translate-x-full" : "-translate-x-full"
                  )} />
                  
                  <div className="flex items-start justify-between gap-3 mb-2 relative z-10">
                    <Badge className={cn(
                      "text-xs font-semibold px-3 py-1 transition-all duration-300 shadow-md",
                      (isHovered || isSelected)
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-primary/10 text-primary"
                    )}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {diploma.year}
                    </Badge>
                    <Award className={cn(
                      "h-5 w-5 transition-all duration-300",
                      (isHovered || isSelected) ? "text-primary scale-110 rotate-12" : "text-muted-foreground"
                    )} />
                  </div>
                  <h3 className={cn(
                    "text-lg font-bold transition-colors duration-300 leading-tight relative z-10",
                    (isHovered || isSelected) ? "text-primary drop-shadow" : "text-foreground"
                  )}>
                    {diploma.title}
                  </h3>
                </CardHeader>
                
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="leading-tight">{diploma.institution}</span>
                  </div>
                  
                  {isSelected && (
                    <div className="pt-3 border-t border-border/40 animate-fade-in">
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {diploma.description}
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground italic">
                      {isSelected ? '✨ Toca para cerrar' : '👆 Toca para más detalles'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '1s' }}>
          <div className="inline-block bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 max-w-2xl shadow-2xl border border-border/40">
            <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 drop-shadow-lg" />
            <h3 className="text-2xl font-bold text-foreground mb-3 drop-shadow">
              Formación Continua
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Más de 30 años de aprendizaje constante y actualización profesional garantizan tratamientos de vanguardia basados en las últimas técnicas y tecnologías.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
