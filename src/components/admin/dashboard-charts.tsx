'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageCircle, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface DashboardChartsProps {
  appointments: Appointment[];
  messages: Message[];
  testimonials: Testimonial[];
}

const COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  cancelled: '#ef4444',
  completed: '#10b981',
  unread: '#f59e0b',
  read: '#3b82f6',
  archived: '#6b7280',
  pending_approval: '#eab308',
  approved: '#10b981',
  rejected: '#ef4444',
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      total: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value} ({((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ appointments, messages, testimonials }: DashboardChartsProps) {
  // Appointments by status
  const appointmentsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };
    appointments.forEach((apt) => {
      counts[apt.status] = (counts[apt.status] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([status, value]) => ({
      name: status === 'pending' ? 'Pendiente' : status === 'confirmed' ? 'Confirmado' : status === 'cancelled' ? 'Cancelado' : 'Completado',
      value,
      color: COLORS[status as keyof typeof COLORS],
      total,
    }));
  }, [appointments]);

  // Appointments over time (last 7 days)
  const appointmentsOverTime = useMemo(() => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const counts = last7Days.map((date) => {
      const count = appointments.filter((apt) => {
        const aptDate = new Date(apt.submitted_at).toISOString().split('T')[0];
        return aptDate === date;
      }).length;
      const dayName = new Date(date).toLocaleDateString('es-ES', { weekday: 'short' });
      return {
        date: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        citas: count,
      };
    });

    return counts;
  }, [appointments]);

  // Messages by status
  const messagesByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      unread: 0,
      read: 0,
      archived: 0,
    };
    messages.forEach((msg) => {
      counts[msg.status] = (counts[msg.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: status === 'unread' ? 'No leído' : status === 'read' ? 'Leído' : 'Archivado',
      value,
      color: COLORS[status as keyof typeof COLORS],
    }));
  }, [messages]);

  // Testimonials by status
  const testimonialsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      pending_approval: 0,
      approved: 0,
      rejected: 0,
    };
    testimonials.forEach((test) => {
      counts[test.status] = (counts[test.status] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([status, value]) => ({
      name: status === 'pending_approval' ? 'Por aprobar' : status === 'approved' ? 'Aprobado' : 'Rechazado',
      value,
      color: COLORS[status as keyof typeof COLORS],
      total,
    }));
  }, [testimonials]);

  // Service type distribution
  const serviceTypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach((apt) => {
      counts[apt.service_type] = (counts[apt.service_type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service, value], index) => ({
        name: service.length > 20 ? service.substring(0, 20) + '...' : service,
        value,
        color: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'][index],
      }));
  }, [appointments]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
      {/* Appointments by Status - Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 via-transparent to-transparent hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Citas por Estado</CardTitle>
                <CardDescription className="text-xs">Distribución de estados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appointments Over Time - Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/5 via-transparent to-transparent hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Citas (7 días)</CardTitle>
                <CardDescription className="text-xs">Tendencia semanal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={appointmentsOverTime}>
                <defs>
                  <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="citas"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorCitas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Messages by Status - Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/5 via-transparent to-transparent hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Mensajes</CardTitle>
                <CardDescription className="text-xs">Estado de mensajes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={messagesByStatus}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {messagesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Testimonials by Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/5 via-transparent to-transparent hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Testimonios</CardTitle>
                <CardDescription className="text-xs">Estado de testimonios</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={testimonialsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {testimonialsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Service Type Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="md:col-span-2"
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Top 5 Servicios Solicitados</CardTitle>
                <CardDescription className="text-xs">Servicios más populares</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={serviceTypeDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {serviceTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
