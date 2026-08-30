'use server';

/* ============================================================================
   CONTACT MESSAGE MUTATIONS
   ----------------------------------------------------------------------------
   Same contract as the appointment actions: the token and the session are
   re-established here rather than assumed from the page, every write reports
   its affected-row count, and the audit trail records workflow state without
   copying the patient's words into a table that cannot be deleted from.
   ========================================================================== */

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { CONTACT_MESSAGE_STATUSES, contactMessages } from '@/lib/schema';

import {
  MUTATION_MESSAGES,
  formField,
  guardAdminMutation,
  type MutationResult,
} from '../_lib/mutation';

const idSchema = z.uuid({ error: 'identificador no válido' });
const statusSchema = z.enum(CONTACT_MESSAGE_STATUSES);

const STATUS_LABELS = {
  unread: 'No leído',
  read: 'Leído',
  archived: 'Archivado',
} as const;

/** Workflow state only — the message body stays in `app.contact_messages`,
 *  which the clinic can delete on request; `audit.audit_log` cannot. */
const auditColumns = { status: contactMessages.status } as const;

export async function setMessageStatus(formData: FormData): Promise<MutationResult> {
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
        .from(contactMessages)
        .where(eq(contactMessages.id, id.data))
        .limit(1);

      if (!before) return { kind: 'missing' } as const;

      const changed = await tx
        .update(contactMessages)
        .set({ status: status.data, updatedAt: new Date() })
        .where(eq(contactMessages.id, id.data))
        .returning(auditColumns);

      if (changed.length === 0) return { kind: 'missing' } as const;

      return { kind: 'ok', before, after: changed[0] } as const;
    });
  } catch (error) {
    console.error('[admin] message status update failed: %s', formatDatabaseFailure(error));
    return { ok: false, message: MUTATION_MESSAGES.database };
  }

  if (outcome.kind === 'missing') return { ok: false, message: MUTATION_MESSAGES.vanished };

  await recordAudit({
    action: 'contact_message.status_changed',
    entity: 'contact_message',
    entityId: id.data,
    before: outcome.before,
    after: outcome.after,
  });

  revalidatePath('/admin', 'layout');

  return { ok: true, message: `Mensaje marcado como «${STATUS_LABELS[status.data]}».` };
}

export async function deleteMessage(formData: FormData): Promise<MutationResult> {
  const guard = await guardAdminMutation(formData);
  if (!guard.ok) return guard.failure;

  const id = idSchema.safeParse(formField(formData, 'id'));
  if (!id.success) return { ok: false, message: MUTATION_MESSAGES.invalid };

  let removed: Record<string, unknown> | null;

  try {
    const rows = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id.data))
      .returning(auditColumns);

    removed = rows[0] ?? null;
  } catch (error) {
    console.error('[admin] message delete failed: %s', formatDatabaseFailure(error));
    return { ok: false, message: MUTATION_MESSAGES.database };
  }

  if (!removed) return { ok: false, message: MUTATION_MESSAGES.vanished };

  await recordAudit({
    action: 'contact_message.deleted',
    entity: 'contact_message',
    entityId: id.data,
    before: removed,
  });

  revalidatePath('/admin', 'layout');

  return { ok: true, message: 'Mensaje eliminado.' };
}
