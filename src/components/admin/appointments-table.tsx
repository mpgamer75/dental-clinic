'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar, Clock, Mail, Phone, User, AlertCircle,
  CheckCircle2, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service_type: string;
  reason: string;
  is_urgent: boolean;
  submitted_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

interface Props {
  appointments: Appointment[];
}

export function AppointmentsTable({ appointments: initialAppointments }: Props) {
  const [appointments] = useState(initialAppointments);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getStatusBadge = (status: Appointment['status']) => {
    const variants = {
      pending: 'default',
      confirmed: 'default',
      cancelled: 'destructive',
      completed: 'default',
    } as const;

    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      confirmed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      completed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    };

    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    urgent: appointments.filter(a => a.is_urgent).length,
    today: appointments.filter(a => {
      const date = new Date(a.submitted_at);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, color: 'text-blue-500' },
          { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
          { label: 'Urgentes', value: stats.urgent, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Hoy', value: stats.today, icon: CheckCircle2, color: 'text-green-500' },
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

      {/* Appointments List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Últimas Citas ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="popLayout">
            {appointments.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No hay citas registradas
              </motion.p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 10).map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer ${
                      selectedId === appointment.id ? 'border-primary bg-primary/5' : 'border-border'
                    } ${appointment.is_urgent ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                    onClick={() => setSelectedId(selectedId === appointment.id ? null : appointment.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{appointment.name}</span>
                          </div>
                          {appointment.is_urgent && (
                            <Badge variant="destructive" className="animate-pulse">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Urgente
                            </Badge>
                          )}
                          {getStatusBadge(appointment.status)}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {appointment.email}
                          </div>
                          {appointment.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {appointment.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(appointment.submitted_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-sm">
                            <span className="font-medium text-primary">Servicio:</span> {appointment.service_type}
                          </p>
                        </div>

                        {selectedId === appointment.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-3 border-t mt-3 space-y-2"
                          >
                            <p className="text-sm">
                              <span className="font-medium">Razón:</span>
                              <br />
                              <span className="text-muted-foreground">{appointment.reason}</span>
                            </p>
                          </motion.div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
