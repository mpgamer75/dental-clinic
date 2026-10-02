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
  Undo2,
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
import { APPOINTMENT_STATUS_META, DemoBadge, isDemoRow, StatusBadge, UrgentBadge } from './status';
import { useRowMutation } from './use-row-mutation';
import { WhatsAppIcon } from '@/components/icons/whatsapp';

/* ============================================================================
   THE APPOINTMENT QUEUE
   ----------------------------------------------------------------------------
   A real <table>: one row per request, headers that name their columns, and
   every control a button in reading order — so it can be worked with a keyboard
   and read aloud in the order it is laid out.

   Its job is ringing people back, so every row carries a one-tap CALL and
   WHATSAPP at every width. On a phone that used to take about six taps per
   patient: the number lived in a column hidden below `lg`, or in a dialog as
   plain text, and the status could not be changed from that dialog at all.

   Responsive by dropping COLUMNS, so that at 360px there is nothing to scroll
   to. Below `md` the patient's name is the button that opens the details (the
   separate "Ver" button would not fit beside the call controls) and below `sm`
   the status badge moves under the name. A table that scrolls horizontally on a
   phone hides its actions column behind a gesture nobody discovers.

   Urgency is marked three ways at once — a badge with its own word and icon, a
   destructive rule down the left edge of the row, and its position at the top
   of the default order. That redundancy is the point: this is the signal the
   old panel let a page limit erase.
   ========================================================================== */

/** Every status a request can be moved to, including back to pending — a
 *  request confirmed by mistake used to have no way back. */
/* `short` is the dialog's button label. "Cancelar" alone is not used: inside a
   dialog it reads as "close this dialog", and the click would cancel the
   patient's appointment instead. */
const STATUS_ACTIONS: { status: AppointmentStatus; label: string; short: string; icon: typeof Check }[] = [
  { status: 'confirmed', label: 'Marcar como confirmada', short: 'Confirmar', icon: CalendarCheck },
  { status: 'completed', label: 'Marcar como completada', short: 'Marcar completada', icon: Check },
  { status: 'cancelled', label: 'Marcar como cancelada', short: 'Cancelar la cita', icon: X },
  { status: 'pending', label: 'Volver a pendiente', short: 'Volver a pendiente', icon: Undo2 },
];

/** "Sin responder" fires at three whole days. Three days without an answer is
 *  the point at which a pending request stops being a queue and starts being a
 *  patient who has given up and phoned someone else. */
function overdue(row: AppointmentRow): boolean {
  return row.status === 'pending' && row.daysWaiting >= 3;
}

export function AppointmentsTable({ rows }: { rows: AppointmentRow[] }) {
  const { pendingId, run } = useRowMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const detail = rows.find((row) => row.id === detailId) ?? null;
  const pendingDelete = rows.find((row) => row.id === deleteId) ?? null;

  const changeStatus = (id: string, status: AppointmentStatus) =>
    run(id, setAppointmentStatus, { status });

  return (
    <>
      {/* `relative` is load-bearing, not cosmetic.
          Tailwind's `sr-only` is `position: absolute`, so without a positioned
          ancestor the "Acciones" column header resolved against <body> instead
          of this scroller. At 360px it landed at x=381 — past the 348px
          viewport — and dragged the document's scroll width with it, giving the
          whole admin panel a horizontal scrollbar on phones. One invisible
          screen-reader label, one page-wide layout bug. */}
      <div className="relative overflow-x-auto rounded-xl border border-line bg-surface">
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
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft sm:table-cell">
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
                        <span className="flex min-w-0 items-center gap-1.5">
                          {/* The name opens the details. Below `md` it is the
                              only way to, so it is a real button with a real
                              accessible name, not a clickable row. */}
                          <button
                            type="button"
                            onClick={() => setDetailId(row.id)}
                            className="-my-1 truncate rounded-sm py-1 text-left font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {row.name}
                            <span className="sr-only"> — ver los detalles de la cita</span>
                          </button>
                          {/* Beside the name, because the name is what someone
                              is about to dial. */}
                          {isDemoRow(row) && <DemoBadge />}
                        </span>
                        <span className="block truncate text-small text-ink-soft">
                          {row.serviceType}
                        </span>
                        {row.isUrgent && <UrgentBadge className="mt-1.5" />}
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden">
                          <StatusBadge meta={meta} className="sm:hidden" />
                          <span className="text-small text-ink-faint">{row.waitedLabel}</span>
                          {overdue(row) && (
                            <span className="text-small font-medium text-destructive">
                              Sin responder
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </th>

                  <td className="hidden max-w-0 px-4 py-3 lg:table-cell">
                    {row.email ? (
                      <a
                        href={`mailto:${row.email}`}
                        className="flex items-center gap-1.5 truncate text-small text-ink-soft underline-offset-4 hover:text-primary hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{row.email}</span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-small text-ink-faint">
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Sin correo
                      </span>
                    )}
                    {row.phone && (
                      <a
                        href={row.phoneHref ?? undefined}
                        className="tabular mt-1 flex items-center gap-1.5 text-small text-ink-soft underline-offset-4 hover:text-primary hover:underline"
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
                    {overdue(row) && (
                      <span className="mt-1 block text-small font-medium text-destructive">
                        Sin responder
                      </span>
                    )}
                  </td>

                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StatusBadge meta={meta} />
                  </td>

                  <td className="px-2 py-2 sm:px-4 sm:py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <ContactButtons row={row} />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="hidden px-2.5 md:inline-flex"
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
                                  onSelect={() => changeStatus(row.id, action.status)}
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
              <DialogHeader className="pr-8">
                <DialogTitle className="font-heading text-h4 text-ink">{detail.name}</DialogTitle>
                <DialogDescription className="text-ink-soft">
                  Solicitud recibida el {detail.submittedAtLabel} ({detail.waitedLabel}).
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge meta={APPOINTMENT_STATUS_META[detail.status]} />
                {detail.isUrgent && <UrgentBadge />}
                {/* Repeated in the dialog: this is the view someone opens
                    immediately before tapping a number. */}
                {isDemoRow(detail) && <DemoBadge />}
              </div>

              {/* The reason this dialog is opened, first: reach the patient. */}
              <div className="flex flex-wrap gap-2">
                {detail.phoneHref && (
                  <Button asChild size="sm">
                    <a href={detail.phoneHref} className="tabular">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Llamar al {detail.phone}
                    </a>
                  </Button>
                )}
                {detail.whatsappHref && (
                  <Button asChild variant="outline" size="sm">
                    <a href={detail.whatsappHref} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="h-4 w-4" />
                      WhatsApp
                      <span className="sr-only"> (se abre WhatsApp)</span>
                    </a>
                  </Button>
                )}
                {detail.email && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${detail.email}`}>
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Correo
                    </a>
                  </Button>
                )}
              </div>

              <dl className="mt-1 space-y-3 text-body">
                <DetailRow label="Servicio" value={detail.serviceType} />
                <DetailRow
                  label="Teléfono"
                  value={
                    detail.phone ? (
                      <span className="tabular">{detail.phone}</span>
                    ) : (
                      <span className="text-ink-faint">No facilitado</span>
                    )
                  }
                />
                <DetailRow
                  label="Correo electrónico"
                  value={
                    detail.email ? (
                      <a
                        href={`mailto:${detail.email}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {detail.email}
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

              {/* The status, changeable where the decision is made. It used to
                  live only in the row's menu, so the person who had just read
                  the request and called the patient had to close the dialog
                  and find the row again to record the outcome. */}
              <div className="border-t border-line pt-4">
                <p className="text-small font-medium text-ink-soft">Cambiar el estado</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUS_ACTIONS.filter((action) => action.status !== detail.status).map(
                    (action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.status}
                          type="button"
                          variant={action.status === 'confirmed' ? 'default' : 'outline'}
                          size="sm"
                          disabled={pendingId === detail.id}
                          onClick={() => {
                            changeStatus(detail.id, action.status);
                            setDetailId(null);
                          }}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {action.short}
                        </Button>
                      );
                    },
                  )}
                </div>
              </div>
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

/**
 * One tap to call, one to WhatsApp — the two things the queue is for.
 *
 * Icon-only to fit beside the menu at 360px, so each carries a full accessible
 * name with the patient's name in it ("Llamar a María González"): a screen
 * reader moving down a column of identical "Llamar" buttons cannot tell whose
 * number each one dials.
 */
function ContactButtons({ row }: { row: AppointmentRow }) {
  return (
    <>
      {row.phoneHref && (
        <Button asChild variant="ghost" size="icon" className="text-primary">
          <a href={row.phoneHref} aria-label={`Llamar a ${row.name}`} title={`Llamar al ${row.phone}`}>
            <Phone className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
          </a>
        </Button>
      )}
      {row.whatsappHref && (
        <Button asChild variant="ghost" size="icon" className="text-primary">
          <a
            href={row.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Escribir por WhatsApp a ${row.name}`}
            title="WhatsApp"
          >
            <WhatsAppIcon className="h-[1.1rem] w-[1.1rem]" />
          </a>
        </Button>
      )}
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
