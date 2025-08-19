import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarCheck, MessageCircle, ShieldCheck, LogOut } from "lucide-react";
import { generalUiStrings } from "@/lib/data";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import type { Database } from "@/lib/types_db";

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
    redirect('/es');
  }

  // Vérifier si l'utilisateur est admin
  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (adminError || !adminCheck) {
    console.error('User is not admin:', session.user.id);
    await supabase.auth.signOut();
    redirect('/es');
  }

  const lang = "es";
  const adminStrings = generalUiStrings[lang];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">{adminStrings.adminPanelTitle}</h1>
            <p className="text-sm text-muted-foreground">Bienvenido, {session.user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/es" className="text-sm text-muted-foreground hover:text-primary">
              Ver sitio web
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Citas */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {adminStrings.appointmentsTitle}
              </CardTitle>
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Panel de Citas</div>
              <p className="text-xs text-muted-foreground pt-1">
                Ver y gestionar todas las solicitudes de citas.
              </p>
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">Próximamente...</span>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {adminStrings.messagesTitle}
              </CardTitle>
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Panel de Mensajes</div>
              <p className="text-xs text-muted-foreground pt-1">
                Leer y responder a los mensajes de contacto.
              </p>
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">Próximamente...</span>
              </div>
            </CardContent>
          </Card>

          {/* Témoignages */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {adminStrings.testimonialsTitle}
              </CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Panel de Testimonios</div>
              <p className="text-xs text-muted-foreground pt-1">
                Aprobar o rechazar los testimonios enviados.
              </p>
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">Próximamente...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
