import Link from 'next/link';
import { CalendarDays, Inbox, MessagesSquare, ShieldAlert, TriangleAlert } from 'lucide-react';

import { AppointmentsTable } from '@/components/admin/appointments-table';
import { DashboardCharts } from '@/components/admin/dashboard-charts';
import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { EmptyState, ErrorPanel, Panel } from '@/components/admin/states';
import { Button } from '@/components/ui/button';

import {
  getAttentionQueue,
  getCachedDashboardCounts,
  getServiceDemand,
  getSubmissionTrend,
} from '../_lib/queries';

/* ============================================================================
   /admin — the triage screen
   ----------------------------------------------------------------------------
   The dashboard this replaces led with ten rows ordered by `submitted_at`,
   captioned "de 45 totales", above five charts computed from those same ten
   rows. Its most likely reader was someone opening the panel on a Monday to
   find out what could not wait — and it answered by showing them whatever had
   arrived most recently.

   This one leads with what is waiting: pending requests, urgent ones first,
   oldest first, with the full set of actions attached so they can be dealt with
   here rather than found again on another page. The counts underneath come from
   `count(*)` over the whole table, and every card is a link into the filtered
   list it counts.
   ========================================================================== */

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [counts, queue, trend, services] = await Promise.all([
    getCachedDashboardCounts(),
    getAttentionQueue(),
    getSubmissionTrend(),
    getServiceDemand(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Resumen"
        title="Qué necesita atención hoy"
        description="Solicitudes pendientes, mensajes sin leer y testimonios en espera de revisión."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/appointments">Ver todas las citas</Link>
          </Button>
        }
      />

      {counts.ok ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Citas pendientes"
            value={counts.data.appointmentsPending}
            caption={`De ${counts.data.appointmentsTotal} solicitudes recibidas en total.`}
            icon={CalendarDays}
            tone={counts.data.appointmentsPending > 0 ? 'attention' : 'neutral'}
            href="/admin/appointments?estado=pending"
            linkLabel="Ver las pendientes"
          />
          <StatCard
            label="Urgentes sin atender"
            value={counts.data.appointmentsUrgentPending}
            caption={
              counts.data.appointmentsUrgentPending > 0
                ? 'Marcadas como urgentes por el propio paciente y todavía sin confirmar.'
                : 'No hay solicitudes urgentes pendientes.'
            }
            icon={TriangleAlert}
            tone={counts.data.appointmentsUrgentPending > 0 ? 'alert' : 'neutral'}
            href="/admin/appointments?estado=pending&orden=cola"
            linkLabel="Ver la cola"
          />
          <StatCard
            label="Mensajes sin leer"
            value={counts.data.messagesUnread}
            caption={`De ${counts.data.messagesTotal} mensajes recibidos en total.`}
            icon={Inbox}
            tone={counts.data.messagesUnread > 0 ? 'attention' : 'neutral'}
            href="/admin/messages?estado=unread"
            linkLabel="Leer los mensajes"
          />
          <StatCard
            label="Testimonios por revisar"
            value={counts.data.testimonialsPending}
            caption={`${counts.data.testimonialsApproved} publicados actualmente en el sitio.`}
            icon={MessagesSquare}
            tone={counts.data.testimonialsPending > 0 ? 'attention' : 'neutral'}
            href="/admin/testimonials?estado=pending_approval"
            linkLabel="Revisar la cola"
          />
        </div>
      ) : (
        /* No cards at all rather than cards full of zeros. A dashboard of
           confident noughts is what the old panel showed whenever the database
           was unreachable, and "no hay citas pendientes" is the one lie this
           screen must never tell. */
        <ErrorPanel title="No se pudieron leer las cifras del panel" detail={counts.detail} />
      )}

      <div className="mt-6 space-y-6">
        <Panel
          title="Requieren su atención"
          description="Solicitudes pendientes: primero las urgentes, después las que llevan más tiempo esperando."
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/appointments?estado=pending&orden=cola">Ver la lista completa</Link>
            </Button>
          }
        >
          <div className="p-4">
            {!queue.ok ? (
              <ErrorPanel title="No se pudo leer la cola de citas" detail={queue.detail} />
            ) : queue.data.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="Nada pendiente"
                description="Todas las solicitudes de cita recibidas están confirmadas, completadas o canceladas."
              />
            ) : (
              <AppointmentsTable rows={queue.data} />
            )}
          </div>
        </Panel>

        {trend.ok && services.ok ? (
          <DashboardCharts trend={trend.data} services={services.data} />
        ) : (
          <ErrorPanel
            title="No se pudieron calcular las gráficas"
            detail={trend.ok ? services.ok ? undefined : services.detail : trend.detail}
          />
        )}
      </div>
    </>
  );
}
