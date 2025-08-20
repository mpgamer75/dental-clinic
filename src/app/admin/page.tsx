import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { CalendarCheck, MessageCircle, ShieldCheck, LogOut, Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { generalUiStrings } from "@/lib/data";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import type { Database } from "@/lib/types_db";
import { Badge } from '@/components/ui/badge';

async function signOut() {
  'use server';
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );
  
  await supabase.auth.signOut();
  redirect('/es');
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Vérifier l'authentification
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    redirect('/admin/login');
  }

  // Vérifier si l'utilisateur est admin
  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (adminError || !adminCheck) {
    await supabase.auth.signOut();
    redirect('/es');
  }

  // Récupérer les statistiques
  const { count: appointmentsCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: messagesCount } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread');

  const { count: testimonialsCount } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval');

  const lang = "es";
  const adminStrings = generalUiStrings[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header amélioré */}
      <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {adminStrings.adminPanelTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenido, <span className="font-medium text-foreground">{session.user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/es">
              <Button variant="outline" size="sm" className="hover:bg-accent">
                Ver sitio web
              </Button>
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/10 to-green-600/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mensajes Nuevos</CardTitle>
                <MessageCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messagesCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Sin leer</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Testimonios</CardTitle>
                <ShieldCheck className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testimonialsCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Por aprobar</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Pacientes</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Paneles principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Citas */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">
                {adminStrings.appointmentsTitle}
              </CardTitle>
              <CalendarCheck className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Ver y gestionar todas las solicitudes de citas
              </CardDescription>
              <div className="mt-4 space-y-2">
                {appointmentsCount && appointmentsCount > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pendientes:</span>
                    <Badge variant="secondary">{appointmentsCount}</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay citas pendientes</p>
                )}
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">
                Ver todas las citas
              </Button>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">
                {adminStrings.messagesTitle}
              </CardTitle>
              <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Leer y responder a los mensajes de contacto
              </CardDescription>
              <div className="mt-4 space-y-2">
                {messagesCount && messagesCount > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">No leídos:</span>
                    <Badge variant="secondary">{messagesCount}</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay mensajes nuevos</p>
                )}
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">
                Ver todos los mensajes
              </Button>
            </CardContent>
          </Card>

          {/* Testimonios */}
          <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">
                {adminStrings.testimonialsTitle}
              </CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Aprobar o rechazar los testimonios enviados
              </CardDescription>
              <div className="mt-4 space-y-2">
                {testimonialsCount && testimonialsCount > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Por revisar:</span>
                    <Badge variant="secondary">{testimonialsCount}</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay testimonios pendientes</p>
                )}
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">
                Ver todos los testimonios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Actividad reciente */}
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Actividad Reciente</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nueva cita solicitada</p>
                  <p className="text-xs text-muted-foreground">Juan Pérez - Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo mensaje de contacto</p>
                  <p className="text-xs text-muted-foreground">María González - Hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Testimonio aprobado</p>
                  <p className="text-xs text-muted-foreground">Carlos Rodríguez - Ayer</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}