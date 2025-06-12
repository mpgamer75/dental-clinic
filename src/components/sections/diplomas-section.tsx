'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  const [selectedDiploma, setSelectedDiploma] = useState<Diploma | null>(null);

  return (
    <section id={id} className="py-12 md:py-20 lg:py-24 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-6">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {diplomasList.map((diploma, index) => (
            <Card 
              key={diploma.id} 
              className="group cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/20 hover:scale-105 border-2 border-transparent hover:border-primary/30 overflow-hidden"
              onClick={() => setSelectedDiploma(diploma)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {diploma.year}
                  </Badge>
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {diploma.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="line-clamp-2">{diploma.institution}</span>
                  </div>
                  
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={diploma.image}
                      alt={`Diploma: ${diploma.title}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 hover:bg-white text-primary"
                      >
                        Ver Diploma
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {diploma.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal pour afficher le diplôme en grand */}
        <Dialog open={!!selectedDiploma} onOpenChange={() => setSelectedDiploma(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedDiploma && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary">
                    {selectedDiploma.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{selectedDiploma.institution}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{selectedDiploma.year}</span>
                    </div>
                  </div>
                  
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={selectedDiploma.image}
                      alt={`Diploma: ${selectedDiploma.title}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                    />
                  </div>
                  
                  <p className="text-base text-foreground leading-relaxed">
                    {selectedDiploma.description}
                  </p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
} 