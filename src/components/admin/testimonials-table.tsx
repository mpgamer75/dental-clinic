'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
import { Quote, MapPin, User, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  location: string | null;
  submitted_at: string;
  status: 'pending_approval' | 'approved' | 'rejected';
}

interface Props {
  testimonials: Testimonial[];
}

export function TestimonialsTable({ testimonials: initialTestimonials }: Props) {
  const [testimonials] = useState(initialTestimonials);

  const getStatusBadge = (status: Testimonial['status']) => {
    const colors = {
      pending_approval: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      approved: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    };

    const labels = {
      pending_approval: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };

    const icons = {
      pending_approval: AlertCircle,
      approved: CheckCircle2,
      rejected: XCircle,
    };

    const Icon = icons[status];

    return (
      <Badge className={`${colors[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {labels[status]}
      </Badge>
    );
  };

  const stats = {
    total: testimonials.length,
    pending: testimonials.filter(t => t.status === 'pending_approval').length,
    approved: testimonials.filter(t => t.status === 'approved').length,
    rejected: testimonials.filter(t => t.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Quote, color: 'text-blue-500' },
          { label: 'Pendientes', value: stats.pending, icon: AlertCircle, color: 'text-yellow-500' },
          { label: 'Aprobados', value: stats.approved, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Rechazados', value: stats.rejected, icon: XCircle, color: 'text-red-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-10 w-10 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Testimonials List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Quote className="h-5 w-5" />
            Últimos Testimonios ({testimonials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="popLayout">
            {testimonials.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No hay testimonios
              </motion.p>
            ) : (
              <div className="space-y-3">
                {testimonials.slice(0, 10).map((testimonial, index) => (
                  <motion.div
                    key={testimonial.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border-2 hover:border-primary/50 transition-all duration-300 ${
                      testimonial.status === 'pending_approval'
                        ? 'bg-yellow-50/30 dark:bg-yellow-950/10 border-yellow-500/30'
                        : 'border-border'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{testimonial.name}</span>
                          </div>
                          {testimonial.location && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {testimonial.location}
                            </div>
                          )}
                        </div>
                        {getStatusBadge(testimonial.status)}
                      </div>

                      <div className="pl-6 border-l-4 border-primary/30">
                        <p className="text-sm italic text-muted-foreground">
                          &ldquo;{testimonial.quote}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(testimonial.submitted_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
