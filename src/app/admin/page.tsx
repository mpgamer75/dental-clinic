'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, EyeOff, Loader2, User, Lock, ArrowLeft, 
  CalendarCheck, MessageCircle, ShieldCheck, LogOut, 
  Users, Clock, Calendar, Mail, Phone, AlertCircle, CheckCircle2,
  XCircle, MoreVertical, ExternalLink, Check, X, Archive, Trash2,
  TrendingUp, BarChart3, Info, FileText
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { DashboardCharts } from '@/components/admin/dashboard-charts';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Types
interface DashboardData {
  appointmentsPendingCount: number;
  appointmentsTotalCount: number;
  messagesUnreadCount: number;
  messagesTotalCount: number;
  testimonialsPendingCount: number;
  testimonialsApprovedCount: number;
}

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

interface ContactMessage {
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

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<{ user: { id: string; email?: string } } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([]);
  const [recentTestimonials, setRecentTestimonials] = useState<Testimonial[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    table: 'appointments' | 'contact_messages' | 'testimonials';
    id: string;
    itemName: string;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      setDataLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (adminData) {
          setIsAdmin(true);
          await fetchDashboardData();
        } else {
          setIsAdmin(false);
          await supabase.auth.signOut();
          setError('Acceso denegado. No tiene permisos de administrador.');
        }
      } else {
        setIsAdmin(false);
      }
      setDataLoading(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setDashboardData(null);
        setRecentAppointments([]);
        setRecentMessages([]);
        setRecentTestimonials([]);
        router.push('/admin');
      } else if (_event === 'SIGNED_IN') {
        checkSession();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const { count: appointmentsPendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: appointmentsTotalCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      const { count: messagesUnreadCount } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');

      const { count: messagesTotalCount } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true });

      const { count: testimonialsPendingCount } = await supabase
        .from('testimonials')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');

      const { count: testimonialsApprovedCount } = await supabase
        .from('testimonials')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(10);

      const { data: messages } = await supabase
        .from('contact_messages')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(10);

      const { data: testimonials } = await supabase
        .from('testimonials')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(10);

      setDashboardData({
        appointmentsPendingCount: appointmentsPendingCount || 0,
        appointmentsTotalCount: appointmentsTotalCount || 0,
        messagesUnreadCount: messagesUnreadCount || 0,
        messagesTotalCount: messagesTotalCount || 0,
        testimonialsPendingCount: testimonialsPendingCount || 0,
        testimonialsApprovedCount: testimonialsApprovedCount || 0,
      });

      setRecentAppointments(appointments || []);
      setRecentMessages(messages || []);
      setRecentTestimonials(testimonials || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Correo electrónico o contraseña incorrectos."
            : "Error al iniciar sesión. Por favor, intente de nuevo."
        );
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('No se pudo autenticar el usuario.');
        setIsLoading(false);
        return;
      }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!adminData) {
        await supabase.auth.signOut();
        setError('Acceso denegado. No tiene permisos de administrador.');
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        window.location.href = '/admin';
      }, 100);

    } catch {
      setError('Error inesperado. Por favor, intente de nuevo.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
    router.push('/admin');
  };

  // CRUD Operations avec feedback amélioré
  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    setUpdatingId(id);
    try {
      console.log('Updating appointment:', { id, status });

      const updateData: Partial<Appointment> = { status };
      const { data, error } = await supabase
        .from('appointments')
        .update(updateData as never)
        .eq('id', id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Error desconocido');
      }

      toast({
        title: "Cita actualizada",
        description: `Estado cambiado a: ${getStatusLabel(status)}`,
        variant: "success",
      });

      await fetchDashboardData();
    } catch (err) {
      console.error('Error updating appointment:', err);
      const errorMessage = err instanceof Error ? err.message : "No se pudo actualizar la cita. Verifica los permisos de la base de datos.";
      toast({
        title: "Error al actualizar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const updateMessageStatus = async (id: string, status: ContactMessage['status']) => {
    setUpdatingId(id);
    try {
      const updateData: Partial<ContactMessage> = { status };
      const { error } = await supabase
        .from('contact_messages')
        .update(updateData as never)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Mensaje actualizado",
        description: `Estado: ${getStatusLabel(status)}`,
        variant: "success",
      });

      await fetchDashboardData();
    } catch (err) {
      console.error('Error updating message:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el mensaje",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const updateTestimonialStatus = async (id: string, status: Testimonial['status']) => {
    setUpdatingId(id);
    try {
      const updateData: Partial<Testimonial> = { status };
      const { error } = await supabase
        .from('testimonials')
        .update(updateData as never)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Testimonio actualizado",
        description: `Estado: ${getStatusLabel(status)}`,
        variant: "success",
      });

      await fetchDashboardData();
    } catch (err) {
      console.error('Error updating testimonial:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el testimonio",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Performs the deletion. Confirmation is handled by an accessible AlertDialog
  // (see <AlertDialog> at the end of the dashboard) instead of window.confirm().
  const performDelete = async (
    table: 'appointments' | 'contact_messages' | 'testimonials',
    id: string,
    itemName: string,
  ) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Eliminado',
        description: `${itemName} eliminado correctamente`,
        variant: 'success',
      });

      await fetchDashboardData();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast({
        title: 'Error',
        description: `No se pudo eliminar el ${itemName}`,
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
      completed: 'Completado',
      unread: 'No leído',
      read: 'Leído',
      archived: 'Archivado',
      pending_approval: 'Por aprobar',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variants: Record<string, { color: string; label: string; icon?: any }> = {
      pending: { color: 'bg-warning/10 text-warning border-warning/25', label: 'Pendiente', icon: Clock },
      confirmed: { color: 'bg-primary/10 text-primary border-primary/25', label: 'Confirmado', icon: CheckCircle2 },
      cancelled: { color: 'bg-destructive/10 text-destructive border-destructive/25', label: 'Cancelado', icon: XCircle },
      completed: { color: 'bg-success/10 text-success border-success/25', label: 'Completado', icon: CheckCircle2 },
      unread: { color: 'bg-warning/10 text-warning border-warning/25', label: 'No leído', icon: AlertCircle },
      read: { color: 'bg-primary/10 text-primary border-primary/25', label: 'Leído', icon: CheckCircle2 },
      archived: { color: 'bg-muted text-muted-foreground border-border', label: 'Archivado', icon: Archive },
      pending_approval: { color: 'bg-warning/10 text-warning border-warning/25', label: 'Por aprobar', icon: Clock },
      approved: { color: 'bg-success/10 text-success border-success/25', label: 'Aprobado', icon: CheckCircle2 },
      rejected: { color: 'bg-destructive/10 text-destructive border-destructive/25', label: 'Rechazado', icon: XCircle },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge variant="outline" className={cn(variant.color, 'flex w-fit items-center gap-1.5 font-medium')}>
        {Icon && <Icon className="h-3 w-3" />}
        {variant.label}
      </Badge>
    );
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
        <div className="w-full max-w-md mb-6">
          <Link
            href="/es"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-all duration-200 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver al sitio web
          </Link>
        </div>

        <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden backdrop-blur-sm animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

          <CardHeader className="relative space-y-1 pb-6 pt-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 backdrop-blur ring-4 ring-primary/5 animate-pulse-soft">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl font-bold text-primary">
              Panel de Administración
            </CardTitle>
            <CardDescription className="text-center text-base">
              Acceso restringido solo para administradores
            </CardDescription>
          </CardHeader>

          <CardContent className="relative pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-describedby={error ? 'login-error' : undefined}
                    className="pl-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-describedby={error ? 'login-error' : undefined}
                    className="pl-10 pr-10 bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 hover:bg-accent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div aria-live="polite">
                {error && (
                  <Alert variant="destructive" className="animate-fade-in border-destructive/20 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription id="login-error">{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all relative overflow-hidden group ripple"
                disabled={isLoading}
              >
                <span className="relative z-10">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          © 2025 Orthoprotesis Dental Clinic. Todos los derechos reservados.
        </p>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-2 ring-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">
                  Panel de Administración
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bienvenido, <span className="font-medium text-foreground">{session.user.email}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <Link href="/es">
                <Button variant="outline" size="sm" className="hover:bg-accent group">
                  <ExternalLink className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Ver sitio web</span>
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 group">
                <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="admin-content" className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-3 animate-fade-in">
          <Card className="border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-sm transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Citas Pendientes
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold">{dashboardData?.appointmentsPendingCount || 0}</CardTitle>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarCheck className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>de {dashboardData?.appointmentsTotalCount || 0} totales</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-gradient-to-br from-highlight/10 via-highlight/5 to-transparent shadow-sm transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Mensajes Sin Leer
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold">{dashboardData?.messagesUnreadCount || 0}</CardTitle>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-highlight/10">
                  <MessageCircle className="h-7 w-7 text-highlight" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>de {dashboardData?.messagesTotalCount || 0} totales</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-gradient-to-br from-warning/10 via-warning/5 to-transparent shadow-sm transition-shadow duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Testimonios Pendientes
                  </CardDescription>
                  <CardTitle className="text-4xl font-bold">{dashboardData?.testimonialsPendingCount || 0}</CardTitle>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-warning/10">
                  <Users className="h-7 w-7 text-warning" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{dashboardData?.testimonialsApprovedCount || 0} aprobados</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Charts */}
        <DashboardCharts
          appointments={recentAppointments}
          messages={recentMessages}
          testimonials={recentTestimonials}
        />

        {/* Data Sections */}
        <div className="grid gap-6 lg:grid-cols-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Appointments avec Dialog détails */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="border-b bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Citas Recientes</CardTitle>
                    <CardDescription className="text-xs">Últimas 10 citas registradas</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[550px]">
                {recentAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Calendar className="h-16 w-16 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No hay citas recientes</p>
                    <p className="text-xs text-center mt-1 max-w-xs">
                      Las nuevas citas aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {recentAppointments.map((apt, idx) => (
                      <div 
                        key={apt.id} 
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-all hover:scale-[1.01] animate-fade-in group relative"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-base">{apt.name}</p>
                              {apt.is_urgent && (
                                <Badge variant="destructive" className="animate-pulse">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Urgente
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">{apt.service_type}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="hover:bg-accent"
                                  aria-label="Ver detalles"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <CalendarCheck className="h-5 w-5 text-primary" />
                                    Detalles de la Cita
                                  </DialogTitle>
                                  <DialogDescription>
                                    Información completa del paciente
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Paciente</p>
                                        <p className="font-semibold">{apt.name}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Correo electrónico</p>
                                        <p className="font-medium text-sm">{apt.email}</p>
                                      </div>
                                    </div>

                                    {apt.phone && (
                                      <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                                          <p className="font-medium text-sm">{apt.phone}</p>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Tipo de servicio</p>
                                        <p className="font-medium text-sm">{apt.service_type}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Motivo / Detalles</p>
                                        <p className="text-sm leading-relaxed">{apt.reason}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Fecha de solicitud</p>
                                        <p className="font-medium text-sm">{formatDate(apt.submitted_at)}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Estado actual</p>
                                        {getStatusBadge(apt.status)}
                                      </div>
                                    </div>

                                    {apt.is_urgent && (
                                      <div className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/10 p-3">
                                        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                                        <div className="flex-1">
                                          <p className="mb-1 text-xs text-destructive">Prioridad</p>
                                          <p className="text-sm font-semibold text-destructive">URGENTE — Requiere atención prioritaria</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="hover:bg-accent"
                                  disabled={updatingId === apt.id}
                                  aria-label="Más opciones"
                                >
                                  {updatingId === apt.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                  Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppointmentStatus(apt.id, 'completed')}>
                                  <Check className="mr-2 h-4 w-4 text-success" />
                                  Completar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                                  <X className="mr-2 h-4 w-4 text-destructive" />
                                  Cancelar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setPendingDelete({ table: 'appointments', id: apt.id, itemName: 'cita' })}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{apt.email}</span>
                          </div>
                          {apt.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{apt.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDate(apt.submitted_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages avec Dialog détails */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="border-b bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-highlight/10">
                    <MessageCircle className="h-5 w-5 text-highlight" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Mensajes Recientes</CardTitle>
                    <CardDescription className="text-xs">Últimos 10 mensajes recibidos</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[550px]">
                {recentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No hay mensajes recientes</p>
                    <p className="text-xs text-center mt-1 max-w-xs">
                      Los nuevos mensajes aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {recentMessages.map((msg, idx) => (
                      <div 
                        key={msg.id} 
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-all hover:scale-[1.01] animate-fade-in group relative"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-base mb-1">{msg.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{msg.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="hover:bg-accent"
                                  aria-label="Ver detalles"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5 text-primary" />
                                    Detalles del Mensaje
                                  </DialogTitle>
                                  <DialogDescription>
                                    Información completa del contacto
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                                        <p className="font-semibold">{msg.name}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Correo electrónico</p>
                                        <p className="font-medium text-sm">{msg.email}</p>
                                      </div>
                                    </div>

                                    {msg.phone && (
                                      <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                                          <p className="font-medium text-sm">{msg.phone}</p>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Mensaje completo</p>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Fecha de envío</p>
                                        <p className="font-medium text-sm">{formatDate(msg.submitted_at)}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
                                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Estado actual</p>
                                        {getStatusBadge(msg.status)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="hover:bg-accent"
                                  disabled={updatingId === msg.id}
                                  aria-label="Más opciones"
                                >
                                  {updatingId === msg.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => updateMessageStatus(msg.id, 'read')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                  Marcar leído
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateMessageStatus(msg.id, 'archived')}>
                                  <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Archivar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setPendingDelete({ table: 'contact_messages', id: msg.id, itemName: 'mensaje' })}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <p className="text-sm mb-3 line-clamp-2 leading-relaxed">{msg.message}</p>

                        <div className="flex items-center justify-between pt-2 border-t">
                          {getStatusBadge(msg.status)}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDate(msg.submitted_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow mt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="border-b bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Testimonios Recientes</CardTitle>
                  <CardDescription className="text-xs">Últimos 10 testimonios recibidos</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {recentTestimonials.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Users className="h-16 w-16 mb-3 opacity-20" />
                <p className="text-sm font-medium">No hay testimonios recientes</p>
                <p className="text-xs text-center mt-1 max-w-xs">
                  Los nuevos testimonios aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentTestimonials.map((test, idx) => (
                  <div 
                    key={test.id} 
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-all hover:scale-[1.02] animate-fade-in group relative"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="icon"
                            className="hover:bg-accent"
                            disabled={updatingId === test.id}
                            aria-label="Más opciones"
                          >
                            {updatingId === test.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MoreVertical className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => updateTestimonialStatus(test.id, 'approved')}>
                            <Check className="mr-2 h-4 w-4 text-success" />
                            Aprobar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTestimonialStatus(test.id, 'rejected')}>
                            <X className="mr-2 h-4 w-4 text-destructive" />
                            Rechazar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setPendingDelete({ table: 'testimonials', id: test.id, itemName: 'testimonio' })}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mb-3 pr-8">
                      <p className="font-semibold text-base mb-0.5">{test.name}</p>
                      {test.location && (
                        <p className="text-xs text-muted-foreground">{test.location}</p>
                      )}
                    </div>

                    <p className="text-sm mb-3 line-clamp-3 italic leading-relaxed">&ldquo;{test.quote}&rdquo;</p>

                    <div className="flex items-center justify-between pt-2 border-t">
                      {getStatusBadge(test.status)}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(test.submitted_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Accessible delete confirmation (replaces window.confirm) */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {pendingDelete?.itemName ?? 'elemento'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  performDelete(pendingDelete.table, pendingDelete.id, pendingDelete.itemName);
                }
                setPendingDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
