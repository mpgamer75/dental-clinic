'use client';

import type { Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { generalUiStrings } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  Users, Smile, Sparkles, ShieldCheck, HeartPulse,
  Activity, Stethoscope, type LucideProps, Scan, Syringe
} from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion, LayoutGroup } from 'framer-motion';

interface ServicesSectionProps {
  id: string; 
  title: string;
  description: string;
  servicesList: Service[];
}

// Icons dentaires professionnels TOUS DISPONIBLES dans Lucide
const IconComponents: Record<string, React.FC<LucideProps>> = {
  Users,          // Prótesis Dentales (personnes/multiple dents)
  Scan,           // Implantes (scan/technologie précise) ✅ CHANGÉ
  Smile,          // Ortodoncia (sourire)
  Sparkles,       // Limpieza Dental (brillance)
  ShieldCheck,    // Empastes/Restauraciones (protection)
  HeartPulse,     // Endodoncia (traitement canal/santé)
  Activity,       // Blanqueamiento (activité/résultat)
  Stethoscope,    // Consulta General (examen)
  Syringe,        // Backup option (injection/traitement)
  Telescope: Scan, // Fallback: Telescope n'existe pas, on utilise Scan
};

export function ServicesSection({ id, title, description, servicesList }: ServicesSectionProps) {
  const { lang } = useLanguage();
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const currentStrings = generalUiStrings[lang];

  const toggleDescription = (serviceTitle: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [serviceTitle]: !prev[serviceTitle],
    }));
  };

  const MAX_CHARS_BEFORE_TRUNCATE = 200;

  const popularServices = ['Implantes Dentales', 'Dental Implants', 'Ortodoncia', 'Orthodontics'];

  return (
    <section id={id} className="bg-gradient-to-b from-background via-secondary/5 to-background py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            {lang === 'es' ? 'Servicios Especializados' : 'Specialized Services'}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </motion.div>

        <LayoutGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {servicesList.map((service, index) => {
            // Gestion du fallback pour Telescope
            const iconName = service.iconName === 'Telescope' ? 'Scan' : service.iconName;
            const IconComponent = iconName ? IconComponents[iconName] : null;
            
            const isExpanded = expandedDescriptions[service.title] || false;
            const showReadMoreButton = service.description.length > MAX_CHARS_BEFORE_TRUNCATE;
            const isPopular = popularServices.includes(service.title);
            const isHovered = hoveredCard === service.title;

            return (
              <motion.div
                key={service.title}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  layout: { duration: 0.3 }
                }}
                onMouseEnter={() => setHoveredCard(service.title)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Card
                  className={cn(
                    "relative shadow-lg transition-all duration-500 ease-out hover:shadow-2xl flex flex-col bg-card rounded-xl overflow-hidden group border-2 h-full",
                    isHovered ? "scale-105 border-primary/50" : "border-transparent hover:border-primary/30",
                    "hover-lift tap-feedback"
                  )}
                >
                {isPopular && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="default" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                      {lang === 'es' ? 'Popular' : 'Popular'}
                    </Badge>
                  </div>
                )}
                
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
                  isHovered ? "opacity-100" : "opacity-0",
                  "from-primary/5 via-transparent to-accent/5"
                )} />
                
                <CardHeader className="relative items-center text-center pt-8 pb-4">
                  {IconComponent ? (
                    <div className={cn(
                      "mb-4 p-4 rounded-full inline-flex transition-all duration-500",
                      isHovered ? "bg-primary/20 scale-110 rotate-3" : "bg-primary/10"
                    )}>
                      <IconComponent className={cn(
                        "h-12 w-12 md:h-14 md:w-14 transition-colors duration-500 stroke-[2]",
                        isHovered ? "text-primary" : "text-primary/80"
                      )} />
                    </div>
                  ) : (
                    // Fallback si aucun icon trouvé : afficher un icon par défaut
                    <div className={cn(
                      "mb-4 p-4 rounded-full inline-flex transition-all duration-500",
                      isHovered ? "bg-primary/20 scale-110 rotate-3" : "bg-primary/10"
                    )}>
                      <ShieldCheck className={cn(
                        "h-12 w-12 md:h-14 md:w-14 transition-colors duration-500",
                        isHovered ? "text-primary" : "text-primary/80"
                      )} />
                    </div>
                  )}
                  <CardTitle className="text-xl md:text-2xl font-semibold text-primary">
                    {service.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative text-left flex-grow flex flex-col px-6 pb-8">
                  <motion.div layout="position">
                    <CardDescription
                      className={cn(
                        "text-foreground/80 text-base leading-relaxed flex-grow transition-all duration-300 ease-in-out",
                        !isExpanded && showReadMoreButton && "line-clamp-5"
                      )}
                    >
                      {service.description}
                    </CardDescription>
                  </motion.div>

                  {showReadMoreButton && (
                    <motion.div layout="position">
                      <Button
                        variant="link"
                        onClick={() => toggleDescription(service.title)}
                        className="mt-3 self-start px-0 text-primary hover:text-primary/80 font-medium group/btn"
                      >
                        <motion.span
                          initial={false}
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                          className="inline-flex items-center gap-1"
                        >
                          {isExpanded ? currentStrings.readLess : currentStrings.readMore}
                          <motion.span
                            className="inline-block ml-1"
                            animate={{ y: isExpanded ? -2 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {isExpanded ? '↑' : '→'}
                          </motion.span>
                        </motion.span>
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
          </div>
        </LayoutGroup>

        <div className="text-center mt-12">
          <Button 
            size="lg" 
            className="shadow-lg hover:shadow-xl transition-all duration-300 btn-shine"
          >
            {lang === 'es' ? 'Ver Todos los Tratamientos' : 'View All Treatments'}
          </Button>
        </div>
      </div>
    </section>
  );
}
