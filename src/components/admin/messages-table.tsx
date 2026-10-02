'use client';

import { useState } from 'react';
import { Archive, Inbox, Loader2, MailOpen, MoreVertical, Phone, Reply, Trash2 } from 'lucide-react';

import { deleteMessage, setMessageStatus } from '@/app/(admin)/admin/_actions/messages';
import type { MessageRow } from '@/app/(admin)/admin/_lib/queries';
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
import type { ContactMessageStatus } from '@/lib/schema';

import { ConfirmDialog } from './confirm-dialog';
import { DemoBadge, isDemoRow, MESSAGE_STATUS_META, StatusBadge } from './status';
import { useRowMutation } from './use-row-mutation';
import { WhatsAppIcon } from '@/components/icons/whatsapp';

/* ============================================================================
   CONTACT MESSAGES
   ----------------------------------------------------------------------------
   Same shape as the appointments table and for the same reasons — a real table,
   columns that drop rather than scroll, one dialog and one confirmation shared
   across every row.

   The preview in the list is truncated by CSS (`line-clamp`), not by slicing
   the string. A `.slice(0, 80)` cuts mid-word at a fixed count regardless of
   how wide the column actually is, and it puts an ellipsis in the middle of a
   sentence that had room to finish.
   ========================================================================== */

const STATUS_ACTIONS: { status: ContactMessageStatus; label: string; icon: typeof Inbox }[] = [
  { status: 'read', label: 'Marcar como leído', icon: MailOpen },
  { status: 'unread', label: 'Marcar como sin leer', icon: Inbox },
  { status: 'archived', label: 'Archivar', icon: Archive },
];

export function MessagesTable({ rows }: { rows: MessageRow[] }) {
  const { pendingId, run } = useRowMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const detail = rows.find((row) => row.id === detailId) ?? null;
  const pendingDelete = rows.find((row) => row.id === deleteId) ?? null;

  /* Reading a message marks it read, the way every inbox does. It used to take
     a separate menu action per message, so "Mensajes sin leer" in the sidebar
     only went down if someone remembered to clear each one by hand — and a
     counter that stays at 7 after all seven were read stops being looked at.

     Through the same audited, row-counted action as the menu, quietly: a toast
     on every open would be noise, but a failure still toasts (see
     use-row-mutation). The badge in the dialog updates when the refreshed row
     arrives, so what it shows is the server's answer, not a guess. */
  const open = (row: MessageRow) => {
    setDetailId(row.id);
    if (row.status === 'unread') {
      run(row.id, setMessageStatus, { status: 'read' }, { quietOnSuccess: true });
    }
  };

  return (
    <>
      <div className="relative overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Mensajes recibidos desde el formulario de contacto.</caption>
          <thead>
            <tr className="border-b border-line bg-canvas-sunk">
              <th scope="col" className="px-4 py-3 text-small font-semibold text-ink-soft">
                Remitente
              </th>
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft md:table-cell">
                Mensaje
              </th>
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft lg:table-cell">
                Recibido
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

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'align-top transition-colors duration-fast ease-out-quart hover:bg-canvas-sunk/60',
                    busy && 'opacity-60',
                  )}
                >
                  <th scope="row" className="max-w-0 px-4 py-3 font-normal">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'truncate text-ink',
                          /* Unread is heavier, the way an inbox is. Weight is a
                             second channel beside the badge's colour and word. */
                          row.status === 'unread' ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {row.name}
                      </span>
                      {isDemoRow(row) && <DemoBadge />}
                    </span>
                    <span className="block truncate text-small text-ink-soft">{row.email}</span>
                    <span className="mt-1 block line-clamp-2 text-small text-ink-faint md:hidden">
                      {row.message}
                    </span>
                  </th>

                  <td className="hidden max-w-0 px-4 py-3 md:table-cell">
                    <p className="line-clamp-2 text-small text-ink-soft">{row.message}</p>
                  </td>

                  <td className="hidden whitespace-nowrap px-4 py-3 text-small text-ink-soft lg:table-cell">
                    <time dateTime={row.submittedAtIso} title={row.submittedAtLabel}>
                      {row.waitedLabel}
                    </time>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge meta={MESSAGE_STATUS_META[row.status]} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2.5"
                        onClick={() => open(row)}
                      >
                        Leer
                        <span className="sr-only"> el mensaje completo de {row.name}</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={busy}
                            aria-label={`Acciones para el mensaje de ${row.name}`}
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <MoreVertical className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {STATUS_ACTIONS.filter((action) => action.status !== row.status).map(
                            (action) => {
                              const Icon = action.icon;
                              return (
                                <DropdownMenuItem
                                  key={action.status}
                                  onSelect={() =>
                                    run(row.id, setMessageStatus, { status: action.status })
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
                            Eliminar el mensaje
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
                  Recibido el {detail.submittedAtLabel} ({detail.waitedLabel}).
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge meta={MESSAGE_STATUS_META[detail.status]} />
                {isDemoRow(detail) && <DemoBadge />}
              </div>

              <p className="whitespace-pre-line rounded-lg bg-canvas-sunk p-4 text-body text-ink">
                {detail.message}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  {/* The subject is prefilled so a reply lands in the patient's
                      inbox looking like an answer rather than a cold email. */}
                  <a
                    href={`mailto:${detail.email}?subject=${encodeURIComponent(
                      'Respuesta a su consulta — Orthoprotesis',
                    )}`}
                  >
                    <Reply className="h-4 w-4" aria-hidden="true" />
                    Responder por correo
                  </a>
                </Button>
                {detail.phoneHref && (
                  <Button asChild variant="outline" size="sm">
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
              </div>

              {/* Filing it away, from where it was read. Archivar used to live
                  only in the row's menu, behind a close and a second tap. */}
              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                {detail.status !== 'archived' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pendingId === detail.id}
                    onClick={() => {
                      run(detail.id, setMessageStatus, { status: 'archived' });
                      setDetailId(null);
                    }}
                  >
                    <Archive className="h-4 w-4" aria-hidden="true" />
                    Archivar
                  </Button>
                )}
                {detail.status !== 'unread' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === detail.id}
                    onClick={() => {
                      run(detail.id, setMessageStatus, { status: 'unread' });
                      setDetailId(null);
                    }}
                  >
                    <Inbox className="h-4 w-4" aria-hidden="true" />
                    Marcar como sin leer
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este mensaje?"
        description={
          pendingDelete
            ? `Se eliminará definitivamente el mensaje de ${pendingDelete.name}. Si aún no le han ` +
              'respondido, archívelo en lugar de eliminarlo.'
            : ''
        }
        confirmLabel="Eliminar el mensaje"
        onConfirm={() => {
          if (pendingDelete) run(pendingDelete.id, deleteMessage);
          setDeleteId(null);
        }}
      />
    </>
  );
}
