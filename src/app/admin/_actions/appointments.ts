'use server';

/* ============================================================================
   APPOINTMENT MUTATIONS
   ----------------------------------------------------------------------------
   The defect these functions exist to end: the old panel issued an UPDATE from
   the browser, and when row-level security refused it Supabase returned zero
   rows and NO error. The client saw no error, toasted "Cita actualizada", and
   the receptionist went on believing appointments were confirmed that had never
   been touched. A write that changes nothing is a failed write, and the only
   way to know is to count what came back — so every statement below uses
   RETURNING and treats an empty result as the failure it is.

   The read of the previous row and the write share a transaction. Not for the
   audit trail's convenience: without it, two people working the queue from two
   phones can interleave, and the row logged as `before` is a row that was
   already gone.
   ========================================================================== */

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { APPOINTMENT_STATUSES, appointments } from '@/lib/schema';

import {
  MUTATION_MESSAGES,
  formField,
  guardAdminMutation,
  type MutationResult,
} from '../_lib/mutation';

const idSchema = z.uuid({ error: 'identificador no válido' });
const statusSchema = z.enum(APPOINTMENT_STATUSES);

/** Spanish names for the four states, for the confirmation toast. */
const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
} as const;

/** Everything the audit trail is allowed to remember about an appointment.
 *
 *  Workflow state and triage facts, never the patient. `audit.audit_log` is
 *  append-only by grant — vd_app holds INSERT and SELECT and nothing else — so
 *  a name or a reason for visiting copied here could not be removed later on
 *  request, while the appointment row itself could. */
const auditColumns = {
  status: appointments.status,
  isUrgent: appointments.isUrgent,
  serviceType: appointments.serviceType,
} as const;

export async function setAppointmentStatus(formData: FormData): Promise<MutationResult> {
  const guard = await guardAdminMutation(formData);
  if (!guard.ok) return guard.failure;

  const id = idSchema.safeParse(formField(formData, 'id'));
  const status = statusSchema.safeParse(formField(formData, 'status'));
  if (!id.success || !status.success) {
    return { ok: false, message: MUTATION_MESSAGES.invalid };
  }

  let outcome:
    | { kind: 'missing' }
    | { kind: 'ok'; before: Record<string, unknown>; after: Record<string, unknown> };

  try {
    outcome = await db.transaction(async (tx) => {
      const [before] = await tx
        .select(auditColumns)
        .from(appointments)
        .where(eq(appointments.id, id.data))
        .limit(1);

      if (!before) return { kind: 'missing' } as const;

      const changed = await tx
        .update(appointments)
        .set({ status: status.data, updatedAt: new Date() })
        .where(eq(appointments.id, id.data))
        .returning(auditColumns);

      /* Zero rows here means the appointment was deleted between the SELECT
         and the UPDATE inside this transaction. Rare, and reported honestly
         rather than announced as a success. */
      if (changed.length === 0) return { kind: 'missing' } as const;

      return { kind: 'ok', before, after: changed[0] } as const;
    });
  } catch (error) {
    console.error('[admin] appointment status update failed: %s', formatDatabaseFailure(error));
    return { ok: false, message: MUTATION_MESSAGES.database };
  }

  if (outcome.kind === 'missing') {
    return { ok: false, message: MUTATION_MESSAGES.vanished };
  }

  await recordAudit({
    action: 'appointment.status_changed',
    entity: 'appointment',
    entityId: id.data,
    before: outcome.before,
    after: outcome.after,
  });

  revalidatePath('/admin', 'layout');

  return {
    ok: true,
    message: `Cita marcada como «${STATUS_LABELS[status.data]}».`,
  };
}

export async function deleteAppointment(formData: FormData): Promise<MutationResult> {
  const guard = await guardAdminMutation(formData);
  if (!guard.ok) return guard.failure;

  const id = idSchema.safeParse(formField(formData, 'id'));
  if (!id.success) return { ok: false, message: MUTATION_MESSAGES.invalid };

  let removed: Record<string, unknown> | null;

  try {
    /* RETURNING doubles as the affected-row count. `.delete()` alone reports
       success whether it removed a row or nothing at all. */
    const rows = await db
      .delete(appointments)
      .where(eq(appointments.id, id.data))
      .returning(auditColumns);

    removed = rows[0] ?? null;
  } catch (error) {
    console.error('[admin] appointment delete failed: %s', formatDatabaseFailure(error));
    return { ok: false, message: MUTATION_MESSAGES.database };
  }

  if (!removed) return { ok: false, message: MUTATION_MESSAGES.vanished };

  /* `before` and no `after`: the row is gone, and this is now the only record
     that it ever existed or who removed it. */
  await recordAudit({
    action: 'appointment.deleted',
    entity: 'appointment',
    entityId: id.data,
    before: removed,
  });

  revalidatePath('/admin', 'layout');

  return { ok: true, message: 'Cita eliminada.' };
}
