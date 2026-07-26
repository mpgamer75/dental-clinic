'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LogOut, Calendar, MessageCircle, Quote, LayoutDashboard,
  Clock, ArrowRight, Sparkles, AlertTriangle
} from 'lucide-react';
import { AppointmentsTable } from './appointments-table';
import { MessagesTable } from './messages-table';
import { TestimonialsTable } from './testimonials-table';
import { Card, CardContent } from '@/components/ui/card';

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

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  submitted_at: string;
  status: 'unread' | 'read' | 'archived';
}

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  location: string | null;
  submitted_at: string;
  status: 'pending_approval' | 'approved' | 'rejected';
}

interface Props {
  userEmail: string;
  appointments: Appointment[];
  messages: Message[];
  testimonials: Testimonial[];
  /** Names of datasets that failed to load, so an empty table isn't mistaken
      for a quiet day at the clinic. */
  loadErrors?: string[];
  signOutAction: () => Promise<void>;
}

export function AdminDashboardClient({
  userEmail,
  appointments,
  messages,
  testimonials,
  loadErrors = [],
  signOutAction
}: Props) {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    appointments: {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      urgent: appointments.filter(a => a.is_urgent).length,
    },
    messages: {
      total: messages.length,
      unread: messages.filter(m => m.status === 'unread').length,
    },
    testimonials: {
      total: testimonials.length,
      pending: testimonials.filter(t => t.status === 'pending_approval').length,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header con glassmorphism */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b backdrop-blur-xl bg-background/80 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Solid colour, not background-clip gradient text. Gradient
                  text renders invisible wherever the clip is unsupported or
                  the -webkit- prefix is missing, which for a page heading is
                  a total loss for no gain. */}
              <h1 className="flex items-center gap-2 font-heading text-3xl font-medium text-ink">
                <Sparkles className="h-7 w-7 text-brass-ink" aria-hidden="true" />
                Panel de Administración
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenido, <span className="font-medium text-foreground">{userEmail}</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <Link href="/es">
                <Button variant="outline" size="sm" className="gap-2">
                  Ver sitio web
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="destructive" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* A failed query must never look like an empty inbox. Without this,
            an unreachable database rendered a calm dashboard of zeros and the
            clinic would assume nobody had written in. */}
        {loadErrors.length > 0 && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <p className="font-medium text-ink">
                No se pudieron cargar algunos datos: {loadErrors.join(', ')}.
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Las cifras mostradas están incompletas. Recargue la página; si el problema
                persiste, hay un fallo de conexión con la base de datos.
              </p>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TabsList className="grid w-full grid-cols-4 h-14 p-1 bg-background/50 backdrop-blur-sm border-2">
              <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Vista General</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Citas</span>
                {stats.appointments.pending > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {stats.appointments.pending}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Mensajes</span>
                {stats.messages.unread > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {stats.messages.unread}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="testimonials" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Quote className="h-4 w-4" />
                <span className="hidden sm:inline">Testimonios</span>
                {stats.testimonials.pending > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                    {stats.testimonials.pending}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {/* Card Citas */}
              <Card className="border-2 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-500/10 to-blue-600/5 cursor-pointer"
                onClick={() => setActiveTab('appointments')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-12 w-12 text-blue-500" />
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Total Citas</p>
                      <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.appointments.total}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pendientes</span>
                      <span className="font-semibold text-yellow-600">{stats.appointments.pending}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Urgentes</span>
                      <span className="font-semibold text-red-600">{stats.appointments.urgent}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Mensajes */}
              <Card className="border-2 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-500/10 to-green-600/5 cursor-pointer"
                onClick={() => setActiveTab('messages')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <MessageCircle className="h-12 w-12 text-green-500" />
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Total Mensajes</p>
                      <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.messages.total}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">No leídos</span>
                      <span className="font-semibold text-blue-600">{stats.messages.unread}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Testimonios */}
              <Card className="border-2 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-500/10 to-purple-600/5 cursor-pointer"
                onClick={() => setActiveTab('testimonials')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Quote className="h-12 w-12 text-purple-500" />
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Total Testimonios</p>
                      <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.testimonials.total}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pendientes</span>
                      <span className="font-semibold text-yellow-600">{stats.testimonials.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actividad Reciente */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Actividad Reciente
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Última Cita</p>
                    {appointments[0] ? (
                      <p className="text-xs text-muted-foreground">
                        {appointments[0].name} - {appointments[0].service_type}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin citas</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Último Mensaje</p>
                    {messages[0] ? (
                      <p className="text-xs text-muted-foreground">
                        {messages[0].name} - {messages[0].email}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin mensajes</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Último Testimonio</p>
                    {testimonials[0] ? (
                      <p className="text-xs text-muted-foreground">
                        {testimonials[0].name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin testimonios</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <AppointmentsTable appointments={appointments} />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessagesTable messages={messages} />
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
            <TestimonialsTable testimonials={testimonials} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
