'use server';

/* ============================================================================
   TESTIMONIAL MODERATION
   ----------------------------------------------------------------------------
   This is the only place in the application where a testimonial can become
   public. `submitTestimonialForm` writes 'pending_approval' from a literal and
   there is no auto-approve path anywhere — the rule these actions replace
   published anything the moderator scored 85 or better, scored by a hardcoded
   blocklist, straight onto a medical practice's homepage under a patient's
   name. `moderation_score` survives only to order the review queue.

   Approval and rejection both stamp `reviewed_at` and `reviewed_by`. Without
   them a queue that has been worked is indistinguishable from one that has
   been ignored, and "who published this?" has no answer.

   Both also revalidate the public route. The homepage is ISR with a five-minute
   window (`export const revalidate = 300` in src/app/[lang]/page.tsx), so
   without this a reviewer approves a testimonial, looks at the site, does not
   see it, and approves it again.
   ========================================================================== */

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { testimonials } from '@/lib/schema';

import {
  MUTATION_MESSAGES,
  formField,
  guardAdminMutation,
  type MutationResult,
} from '../_lib/mutation';

const idSchema = z.uuid({ error: 'identificador no válido' });

/** Only the two a reviewer can choose. 'pending_approval' is the state a
 *  submission arrives in, not one a human moves it back to — and accepting it
 *  here would let a direct POST clear `reviewed_at` on a published quote. */
const decisionSchema = z.enum(['approved', 'rejected']);

const DECISION_LABELS = {
  approved: 'Testimonio aprobado y publicado en el sitio.',
  rejected: 'Testimonio rechazado. No se publicará.',
} as const;

/** The score and the workflow state, never the quote. The quote lives in
 *  `app.testimonials` where it can be deleted; the audit log cannot be. */
const auditColumns = {
  status: testimonials.status,
  moderationScore: testimonials.moderationScore,
} as const;

/** The public route that lists approved testimonials, in its dynamic form so
 *  both `/es` and `/en` are refreshed by one call. */
const PUBLIC_ROUTE = '/[lang]';

export async function reviewTestimonial(formData: FormData): Promise<MutationResult> {
  const guard = await guardAdminMutation(formData);
  if (!guard.ok) return guard.failure;

  const id = idSchema.safeParse(formField(formData, 'id'));
  const decision = decisionSchema.safeParse(formField(formData, 'decision'));
  if (!id.success || !decision.success) {
    return { ok: false, message: MUTATION_MESSAGES.invalid };
  }

  let outcome:
    | { kind: 'missing' }
    | { kind: 'ok'; before: Record<string, unknown>; after: Record<string, unknown> };

  try {
    outcome = await db.transaction(async (tx) => {
      const [before] = await tx
        .select(auditColumns)
        .from(testimonials)
        .where(eq(testimonials.id, id.data))
        .limit(1);

      if (!before) return { kind: 'missing' } as const;

      const now = new Date();
      const changed = await tx
        .update(testimonials)
        .set({
          status: decision.data,
          reviewedAt: now,
          /* The reviewer's own address, taken from the verified session and
             never from the form. A `reviewed_by` a caller can set is a
             signature anyone can forge. */
          reviewedBy: guard.actor.email,
          updatedAt: now,
        })
        .where(eq(testimonials.id, id.data))
        .returning(auditColumns);

      if (changed.length === 0) return { kind: 'missing' } as const;

      return { kind: 'ok', before, after: changed[0] } as const;
    });
  } catch (error) {
    console.error('[admin] testimonial review failed: %s', formatDatabaseFailure(error));
    return { ok: false, message: MUTATION_MESSAGES.database };
  }

  if (outcome.kind === 'missing') return { ok: false, message: MUTATION_MESSAGES.vanished };

  await recordAudit({
    action: decision.data === 'approved' ? 'testimonial.approved' : 'testimonial.rejected',
    entity: 'testimonial',
    entityId: id.data,
    before: outcome.before,
    after: outcome.after,
  });

  revalidatePath('/admin', 'layout');
  revalidatePath(PUBLIC_ROUTE, 'page');

  return { ok: true, message: DECISION_LABELS[decision.data] };
}

export async function deleteTestimonial(formData: FormData): Promise<MutationResult> {
  const guard = await guardAdminMutation(formData);
  if (!guard.ok) return guard.failure;

  const id = idSchema.safeParse(formField(formData, 'id'));
  if (!id.success) return { ok: false, message: MUTATION_MESSAGES.invalid };

  let removed: Record<string, unknown> | null;

  try {
    const rows = await db
      .delete(testimonials)
      .where(eq(testimonials.id, id.data))
      .returning(auditColumns);

    removed = rows[0] ?? null;
  } catch (error) {
    console.error('[admin] testimonial delete failed: %s', formatDatabaseFailure(error));
    return { ok: false, message: MUTATION_MESSAGES.database };
  }

  if (!removed) return { ok: false, message: MUTATION_MESSAGES.vanished };

  await recordAudit({
    action: 'testimonial.deleted',
    entity: 'testimonial',
    entityId: id.data,
    before: removed,
  });

  revalidatePath('/admin', 'layout');
  /* A deleted testimonial may have been on the homepage a moment ago. */
  revalidatePath(PUBLIC_ROUTE, 'page');

  return { ok: true, message: 'Testimonio eliminado.' };
}
