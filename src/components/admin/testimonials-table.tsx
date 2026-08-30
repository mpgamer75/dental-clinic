'use client';

import { useState } from 'react';
import { Check, Loader2, MapPin, MoreVertical, Trash2, X } from 'lucide-react';

import { deleteTestimonial, reviewTestimonial } from '@/app/admin/_actions/testimonials';
import type { TestimonialRow } from '@/app/admin/_lib/queries';
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

import { ConfirmDialog } from './confirm-dialog';
import { ModerationScore, StatusBadge, TESTIMONIAL_STATUS_META } from './status';
import { useRowMutation } from './use-row-mutation';

/* ============================================================================
   THE MODERATION QUEUE
   ----------------------------------------------------------------------------
   Approving here is the only way a testimonial reaches the public homepage.
   There is no automatic path and there must not be one: the rule this replaces
   published anything a hardcoded blocklist scored 85 or better, under a
   patient's name, on a medical practice's front page.

   So the two decisions are the row's primary controls rather than entries in a
   menu — a queue whose main action is three taps deep is a queue that does not
   get worked — and the quote is shown in full in the dialog before either is
   pressed.

   `moderation_score` is displayed because it is useful for triage and captioned
   as what it is: an ordering hint. It grants nothing. A reviewer who sees 96
   and a reviewer who sees 41 are both being asked the same question.
   ========================================================================== */

export function TestimonialsTable({ rows }: { rows: TestimonialRow[] }) {
  const { pendingId, run } = useRowMutation();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const detail = rows.find((row) => row.id === detailId) ?? null;
  const pendingDelete = rows.find((row) => row.id === deleteId) ?? null;

  const decide = (id: string, decision: 'approved' | 'rejected') =>
    run(id, reviewTestimonial, { decision });

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Testimonios enviados por pacientes. Los que peor puntuación de moderación han obtenido
            aparecen primero.
          </caption>
          <thead>
            <tr className="border-b border-line bg-canvas-sunk">
              <th scope="col" className="px-4 py-3 text-small font-semibold text-ink-soft">
                Autor
              </th>
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft md:table-cell">
                Testimonio
              </th>
              <th scope="col" className="hidden px-4 py-3 text-small font-semibold text-ink-soft lg:table-cell">
                Moderación
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
              const awaiting = row.status === 'pending_approval';

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'align-top transition-colors duration-fast ease-out-quart hover:bg-canvas-sunk/60',
                    busy && 'opacity-60',
                  )}
                >
                  <th scope="row" className="max-w-0 px-4 py-3 font-normal">
                    <span className="block truncate font-medium text-ink">{row.name}</span>
                    {row.location && (
                      <span className="flex items-center gap-1 truncate text-small text-ink-soft">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {row.location}
                      </span>
                    )}
                    <time
                      dateTime={row.submittedAtIso}
                      title={row.submittedAtLabel}
                      className="mt-1 block text-small text-ink-faint"
                    >
                      {row.waitedLabel}
                    </time>
                    <span className="mt-2 block line-clamp-2 text-small text-ink-soft md:hidden">
                      {row.quote}
                    </span>
                    <span className="mt-2 block lg:hidden">
                      <ModerationScore score={row.moderationScore} />
                    </span>
                  </th>

                  <td className="hidden max-w-0 px-4 py-3 md:table-cell">
                    <p className="line-clamp-3 text-small italic text-ink-soft">“{row.quote}”</p>
                  </td>

                  <td className="hidden px-4 py-3 lg:table-cell">
                    <ModerationScore score={row.moderationScore} />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge meta={TESTIMONIAL_STATUS_META[row.status]} />
                    {row.reviewedAtLabel && (
                      <span className="mt-1 block text-small text-ink-faint">
                        {row.reviewedBy ?? 'Revisado'}
                      </span>
                    )}
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
                        Leer
                        <span className="sr-only"> el testimonio completo de {row.name}</span>
                      </Button>

                      {awaiting && (
                        <Button
                          type="button"
                          size="sm"
                          className="hidden px-3 sm:inline-flex"
                          disabled={busy}
                          onClick={() => decide(row.id, 'approved')}
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Aprobar
                          <span className="sr-only"> el testimonio de {row.name}</span>
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={busy}
                            aria-label={`Acciones para el testimonio de ${row.name}`}
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <MoreVertical className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          {row.status !== 'approved' && (
                            <DropdownMenuItem onSelect={() => decide(row.id, 'approved')}>
                              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                              Aprobar y publicar en el sitio
                            </DropdownMenuItem>
                          )}
                          {row.status !== 'rejected' && (
                            <DropdownMenuItem onSelect={() => decide(row.id, 'rejected')}>
                              <X className="mr-2 h-4 w-4" aria-hidden="true" />
                              {row.status === 'approved'
                                ? 'Retirar del sitio y rechazar'
                                : 'Rechazar'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteId(row.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            Eliminar el testimonio
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
                  {detail.location ? `${detail.location} · ` : ''}
                  Enviado el {detail.submittedAtLabel}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge meta={TESTIMONIAL_STATUS_META[detail.status]} />
                <ModerationScore score={detail.moderationScore} />
              </div>

              {/* The public site sets a quote as a rule above and below it in
                  the heading face (see sections/testimonials-section.tsx). The
                  reviewer should be reading it in something close to the shape
                  it will take once published, not in a styled box that exists
                  only here. */}
              <figure className="border-y border-line py-5">
                <blockquote className="font-heading text-[1.15rem] font-normal italic leading-relaxed text-ink">
                  <p>&ldquo;{detail.quote}&rdquo;</p>
                </blockquote>
              </figure>

              {detail.reviewedAtLabel && (
                <p className="text-small text-ink-faint">
                  Revisado el {detail.reviewedAtLabel}
                  {detail.reviewedBy ? ` por ${detail.reviewedBy}` : ''}.
                </p>
              )}

              <p className="text-small text-ink-soft">
                Al aprobarlo se publica en la página pública con el nombre y la localidad que se ven
                arriba.
              </p>

              <div className="flex flex-wrap gap-2">
                {detail.status !== 'approved' && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={pendingId === detail.id}
                    onClick={() => {
                      decide(detail.id, 'approved');
                      setDetailId(null);
                    }}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Aprobar y publicar
                  </Button>
                )}
                {detail.status !== 'rejected' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pendingId === detail.id}
                    onClick={() => {
                      decide(detail.id, 'rejected');
                      setDetailId(null);
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Rechazar
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
        title="¿Eliminar este testimonio?"
        description={
          pendingDelete
            ? `Se eliminará definitivamente el testimonio de ${pendingDelete.name}. Para dejar de ` +
              'mostrarlo en el sitio sin borrarlo, use «Rechazar».'
            : ''
        }
        confirmLabel="Eliminar el testimonio"
        onConfirm={() => {
          if (pendingDelete) run(pendingDelete.id, deleteTestimonial);
          setDeleteId(null);
        }}
      />
    </>
  );
}
