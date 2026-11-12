/* ============================================================================
   Audit trail
   ----------------------------------------------------------------------------
   Every privileged change gets a row: who, what, on which record, and what the
   record looked like on either side of the change. The old admin panel kept none
   of this — an appointment that vanished left no trace that it had ever existed,
   let alone who removed it, which in a clinic is the difference between a
   mistake and an unanswerable accusation.

   The actor comes from a VERIFIED session, never from request data. Two ways
   to supply that, and only two:

     - `verifiedActor` — an admin mutation passes `guard.actor`, the identity
       `guardAdminMutation` resolved from the session cookie and checked against
       app.staff moments earlier in the same request. Asking the auth service
       again here was a second network round trip on every write in the panel,
       to re-learn something already known.
     - omitted — the session is read here. Public form submissions (nobody
       signed in) and session events take this path.

   Never build a `verifiedActor` from form fields or the URL. An actor taken
   from the request records whoever the request CLAIMS is acting, which is
   exactly the field someone forging a request would set.
   ========================================================================== */

import 'server-only';

import { getAuth } from './auth/server';
import { db } from './db';
import { getRequestContext } from './request-context';
import { auditLog, type AuditSnapshot } from './schema';
import { formatDatabaseFailure } from '@/lib/db-errors';

/** The kinds of record this application audits. */
export type AuditEntity =
  | 'appointment'
  | 'contact_message'
  | 'testimonial'
  | 'site_settings'
  | 'session';

/**
 * Convention is `entity.verb`, past tense. The union documents the actions that
 * exist today; `(string & {})` keeps it open so adding one never means editing
 * two files, while autocomplete still offers the established names first.
 */
export type AuditAction =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.status_changed'
  | 'appointment.deleted'
  | 'contact_message.created'
  | 'contact_message.status_changed'
  | 'contact_message.deleted'
  | 'testimonial.created'
  | 'testimonial.approved'
  | 'testimonial.rejected'
  | 'testimonial.deleted'
  | 'site_settings.updated'
  | 'session.signed_in'
  | 'session.sign_in_failed'
  | 'session.signed_out'
  | (string & {});

export interface AuditEntryInput {
  action: AuditAction;
  entity: AuditEntity;
  /** Primary key of the affected row, as text. Omit for actions with no row. */
  entityId?: string | null;
  /** The row before the change. Omit on a create. */
  before?: AuditSnapshot | null;
  /** The row after the change. Omit on a delete. */
  after?: AuditSnapshot | null;
  /** The identity an admin guard already verified for this request — see the
   *  note at the top of this file. Omit to resolve it from the session. */
  verifiedActor?: { id: string; email: string } | null;
}

/**
 * Write one audit row. Resolves the actor and the request context itself.
 *
 * This function never throws. Every failure — an unreachable database, a session
 * lookup that times out, a snapshot that will not serialise — is logged and
 * dropped, because the alternative is worse in both directions the trade-off
 * runs. On a public path, letting an audit failure escape would reject a
 * patient's appointment because a logging table was unavailable. On an admin
 * path, it would abort a change that has already been committed, telling the
 * dentist their edit failed when it did not.
 *
 * Losing an audit row is a real cost and it is why the failure is logged loudly
 * rather than ignored. It is simply the smaller cost.
 */
export async function recordAudit({
  action,
  entity,
  entityId = null,
  before = null,
  after = null,
  verifiedActor,
}: AuditEntryInput): Promise<void> {
  try {
    const [actor, { ipHash, userAgent }] = await Promise.all([
      verifiedActor
        ? Promise.resolve(verifiedActor)
        : getAuth().getSession().then(({ data }) => data?.user ?? null),
      getRequestContext(),
    ]);


    await db.insert(auditLog).values({
      /* Null actor is meaningful, not missing data: it is how a public form
         submission — nobody signed in — is distinguished from an admin action. */
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      action,
      entity,
      entityId,
      before,
      after,
      ipHash,
      userAgent,
    });
  } catch (error) {
    console.error(
      '[audit] failed to record %s on %s (%s): %s',
      action,
      entity,
      entityId,
      formatDatabaseFailure(error),
    );
  }
}
