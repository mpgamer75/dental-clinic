// app/admin/page.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { generalUiStrings } from "@/lib/data";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export default async function AdminDashboardPage() {
  // ✅ Récupération sécurisée du cookie store
  const cookieStore = cookies();

  // ✅ Initialisation Supabase server client
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  // ✅ Récupération de la session
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user || session.user.user_metadata?.role !== "admin_role") {
    redirect("/");
  }

  const lang = "es";
  const adminStrings = generalUiStrings[lang];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">{adminStrings.adminPanelTitle}</h1>
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
            <Link href="/admin/appointments" className="text-sm text-primary hover:underline pt-2 block">
              Ir a Citas &rarr;
            </Link>
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
            <Link href="/admin/messages" className="text-sm text-primary hover:underline pt-2 block">
              Ir a Mensajes &rarr;
            </Link>
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
            <Link href="/admin/testimonials" className="text-sm text-primary hover:underline pt-2 block">
              Ir a Testimonios &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
