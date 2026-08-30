'use client';

import { useState, type ReactNode } from 'react';
import {
  CalendarCheck,
  CalendarClock,
  Check,
  Loader2,
  Mail,
  MoreVertical,
  Phone,
  Trash2,
  X,
} from 'lucide-react';

import { deleteAppointment, setAppointmentStatus } from '@/app/(admin)/admin/_actions/appointments';
import type { AppointmentRow } from '@/app/(admin)/admin/_lib/queries';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/lib/schema';

import { ConfirmDialog } from './confirm-dialog';
import { APPOINTMENT_STATUS_META, StatusBadge, UrgentBadge } from './status';
import { useRowMutation } from './use-row-mutation';

/* ============================================================================
   THE APPOINTMENT QUEUE
   ----------------------------------------------------------------------------
   A real <table>: one row per request, headers that name their columns, and
   every control a button in reading order — so it can be worked with a keyboard
   and read aloud in the order it is laid out.

   Responsive by dropping COLUMNS, so that at 360px there is nothing to scroll
   to: the table keeps patient, status and actions, and the contact details and
   requested day move into the detail dialog, which is where someone on a phone
   would open them anyway. A table that scrolls horizontally on a phone hides
   its actions column behind a gesture nobody discovers. The wrapper still
   allows overflow — a single unbroken 60-character service name must scroll
   rather than be clipped by the rounded corner it disappears behind.

   Urgency is marked three ways at once — a badge with its own word and icon, a
   terracotta rule down the left edge of the row, and its position at the top of
   the default order. That redundancy is the point: this is the signal the old
   panel let a page limit erase.
   ========================================================================== */

const STATUS_ACTIONS: { status: AppointmentStatus; label: string; icon: typeof Check }[] = [
  { status: 'confirmed', label: 'Marcar como confirmada', icon: CalendarCheck },
  { status: 'completed', label: 'Marcar como completada', icon: Check },
  { status: 'cancelled', label: 'Marcar como cancelada', icon: X },
];

export function AppointmentsTable({ rows }: { rows: AppointmentRow[] }) {
  const { pendingId, run } = useRowMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const detail = rows.find((row) => row.id === detailId) ?? null;
  const pendingDelete = rows.find((row) => row.id === deleteId) ?? null;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Solicitudes de cita. Las urgentes aparecen primero, después las que llevan más tiempo
            esperando.
          </caption>
          <thead>
            <tr className="border-b border-line bg-canvas-sunk">
              <th scope="col" className="px-4 py-3 text-small font-semibold text-ink-soft">
                Paciente
              </th>
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft lg:table-cell">
                Contacto
              </th>
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft xl:table-cell">
                Prefiere
              </th>
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft md:table-cell">
                Recibida
              </th>
              <th scope="col" className="px-4 py-3 text-small font-semibold text-ink-soft">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 text-right text-small font-semibold text-ink-soft">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const busy = pendingId === row.id;
              const meta = APPOINTMENT_STATUS_META[row.status];

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'align-top transition-colors duration-fast ease-out-quart hover:bg-canvas-sunk/60',
                    busy && 'opacity-60',
                  )}
                >
                  <th scope="row" className="max-w-0 px-4 py-3 font-normal">
                    <div className="flex items-start gap-2.5">
                      {/* Not decoration: the rule is the only urgency cue that
                          survives being glanced at from across a room. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-1 h-9 w-[3px] shrink-0 rounded-full',
                          row.isUrgent ? 'bg-destructive' : 'bg-transparent',
                        )}
                      />
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-ink">{row.name}</span>
                        <span className="block truncate text-small text-ink-soft">
                          {row.serviceType}
                        </span>
                        {row.isUrgent && <UrgentBadge className="mt-1.5" />}
                        <span className="mt-1 block text-small text-ink-faint md:hidden">
                          {row.waitedLabel}
                        </span>
                      </div>
                    </div>
                  </th>

                  <td className="hidden max-w-0 px-4 py-3 lg:table-cell">
                    <a
                      href={`mailto:${row.email}`}
                      className="flex items-center gap-1.5 truncate text-small text-ink-soft underline-offset-4 hover:text-terracotta hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{row.email}</span>
                    </a>
                    {row.phone && (
                      <a
                        href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
                        className="tabular mt-1 flex items-center gap-1.5 text-small text-ink-soft underline-offset-4 hover:text-terracotta hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {row.phone}
                      </a>
                    )}
                  </td>

                  <td className="hidden px-4 py-3 text-small text-ink-soft xl:table-cell">
                    {row.preferredDateLabel ? (
                      <>
                        <span className="block">{row.preferredDateLabel}</span>
                        {row.timePreferenceLabel && (
                          <span className="block text-ink-faint">{row.timePreferenceLabel}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-ink-faint">Sin preferencia</span>
                    )}
                  </td>

                  <td className="hidden whitespace-nowrap px-4 py-3 text-small text-ink-soft md:table-cell">
                    <time dateTime={row.submittedAtIso} title={row.submittedAtLabel}>
                      {row.waitedLabel}
                    </time>
                    {/* Three days without an answer is the point at which a
                        pending request stops being a queue and starts being a
                        patient who has given up and phoned someone else. */}
                    {row.status === 'pending' && row.daysWaiting >= 3 && (
                      <span className="mt-1 block text-small font-medium text-destructive">
                        Sin responder
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge meta={meta} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2.5"
                        onClick={() => setDetailId(row.id)}
                      >
                        Ver
                        <span className="sr-only"> los detalles de la cita de {row.name}</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={busy}
                            aria-label={`Acciones para la cita de ${row.name}`}
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <MoreVertical className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          {STATUS_ACTIONS.filter((action) => action.status !== row.status).map(
                            (action) => {
                              const Icon = action.icon;
                              return (
                                <DropdownMenuItem
                                  key={action.status}
                                  onSelect={() =>
                                    run(row.id, setAppointmentStatus, { status: action.status })
                                  }
                                >
                                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                                  {action.label}
                                </DropdownMenuItem>
                              );
                            },
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteId(row.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Eliminar la cita
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-line bg-surface sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-h4 text-ink">{detail.name}</DialogTitle>
                <DialogDescription className="text-ink-soft">
                  Solicitud recibida el {detail.submittedAtLabel} ({detail.waitedLabel}).
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge meta={APPOINTMENT_STATUS_META[detail.status]} />
                {detail.isUrgent && <UrgentBadge />}
              </div>

              <dl className="mt-2 space-y-3 text-body">
                <DetailRow label="Servicio" value={detail.serviceType} />
                <DetailRow
                  label="Correo electrónico"
                  value={
                    <a
                      href={`mailto:${detail.email}`}
                      className="text-terracotta underline-offset-4 hover:underline"
                    >
                      {detail.email}
                    </a>
                  }
                />
                <DetailRow
                  label="Teléfono"
                  value={
                    detail.phone ? (
                      <a
                        href={`tel:${detail.phone.replace(/[^\d+]/g, '')}`}
                        className="tabular text-terracotta underline-offset-4 hover:underline"
                      >
                        {detail.phone}
                      </a>
                    ) : (
                      <span className="text-ink-faint">No facilitado</span>
                    )
                  }
                />
                <DetailRow
                  label="Preferencia de cita"
                  value={
                    detail.preferredDateLabel ? (
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                        {detail.preferredDateLabel}
                        {detail.timePreferenceLabel ? `, ${detail.timePreferenceLabel}` : ''}
                      </span>
                    ) : (
                      <span className="text-ink-faint">Sin preferencia</span>
                    )
                  }
                />
                <div>
                  <dt className="text-small font-medium text-ink-faint">Motivo de la consulta</dt>
                  <dd className="mt-1 whitespace-pre-line rounded-lg bg-canvas-sunk p-3 text-body text-ink">
                    {detail.reason}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar esta cita?"
        description={
          pendingDelete
            ? `Se eliminará definitivamente la solicitud de ${pendingDelete.name} (${pendingDelete.serviceType}). ` +
              'Los datos del paciente no se podrán recuperar; quedará constancia de quién la eliminó.'
            : ''
        }
        confirmLabel="Eliminar la cita"
        onConfirm={() => {
          if (pendingDelete) run(pendingDelete.id, deleteAppointment);
          setDeleteId(null);
        }}
      />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-small font-medium text-ink-faint">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{value}</dd>
    </div>
  );
}
