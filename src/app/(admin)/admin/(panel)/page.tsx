import Link from 'next/link';
import { Suspense } from 'react';
import {
  CalendarDays,
  FlaskConical,
  Inbox,
  MessagesSquare,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';

import { AppointmentsTable } from '@/components/admin/appointments-table';
import { DashboardCharts, DashboardChartsSkeleton } from '@/components/admin/dashboard-charts';
import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { EmptyState, ErrorPanel, Panel } from '@/components/admin/states';
import { Button } from '@/components/ui/button';

import {
  getAppointmentFunnel,
  getAttentionQueue,
  getCachedDashboardCounts,
  getDemoDataPresence,
  getPendingWaitBuckets,
  getServiceDemand,
  getSubmissionTrend,
  getTimePreferenceSplit,
  getWeekdayDemand,
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
   oldest first, with the full set of actions attached so they can be dealt
   with here rather than found again on another page. The counts underneath
   come from `count(*)` over the whole table, and every card is a link into the
   filtered list it counts.

   The six analytics aggregates are behind their own <Suspense> rather than in
   the page's own `Promise.all`. They are the slowest reads on the screen and
   the least urgent thing on it: putting them in the same await as the queue
   would hold the one list somebody opened this page to work behind six GROUP
   BY-shaped scans. Streamed separately, the queue paints as soon as its index
   answers and the charts fill in underneath.
   ========================================================================== */

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [counts, queue, demo] = await Promise.all([
    getCachedDashboardCounts(),
    getAttentionQueue(),
    getDemoDataPresence(),
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

      {/* Said once, at the top, because the charts below deliberately count
          demo rows alongside real ones — hiding them there would leave the
          panel looking broken in exactly the situation the seed was run to
          fix. What the reader is owed instead is the sentence that the numbers
          they are about to read are partly invented. Only rendered when the
          seed is actually loaded, so a purged production database never shows
          it. */}
      {demo.ok && demo.data.any && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-line bg-muted px-4 py-3">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <p className="text-small text-ink-soft">
            Este panel incluye{' '}
            <span className="tabular font-semibold text-ink">
              {demo.data.appointments + demo.data.messages + demo.data.testimonials}
            </span>{' '}
            filas de demostración (<span className="tabular">{demo.data.appointments}</span> citas,{' '}
            <span className="tabular">{demo.data.messages}</span> mensajes,{' '}
            <span className="tabular">{demo.data.testimonials}</span> testimonios). Van marcadas con
            la etiqueta «Demo» en las tablas y cuentan en las cifras y las gráficas. Para retirarlas:{' '}
            <code className="tabular rounded bg-canvas-sunk px-1 py-0.5">npm run db:demo:purge</code>
            .
          </p>
        </div>
      )}

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

        <Suspense fallback={<DashboardChartsSkeleton />}>
          <DemandCharts />
        </Suspense>
      </div>
    </>
  );
}

/**
 * The six analytics aggregates, each handed to its chart as its own outcome.
 *
 * Deliberately NOT collapsed into one "did everything succeed?" guard. The
 * version before this drew a single error panel in place of the whole chart
 * area whenever any one query failed, which threw away five working charts to
 * report one broken one. Each `QueryOutcome` travels intact to the panel that
 * needs it, so a permission fault on one table costs exactly that table's
 * chart and the other five still answer.
 */
async function DemandCharts() {
  const [trend, waits, services, timeOfDay, weekdays, funnel] = await Promise.all([
    getSubmissionTrend(),
    getPendingWaitBuckets(),
    getServiceDemand(),
    getTimePreferenceSplit(),
    getWeekdayDemand(),
    getAppointmentFunnel(),
  ]);

  return (
    <DashboardCharts
      trend={trend}
      waits={waits}
      services={services}
      timeOfDay={timeOfDay}
      weekdays={weekdays}
      funnel={funnel}
    />
  );
}
