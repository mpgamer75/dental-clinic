'use server';

/* ============================================================================
   SIGN IN, SIGN OUT, AND THE CSRF TOKEN
   ----------------------------------------------------------------------------
   The login this replaces authenticated in the browser and then asked the
   browser whether the person was an administrator, in React state, with
   src/proxy.ts skipping /admin entirely. Nothing about that decision reached a
   server. It also called `.single()` on the admin lookup and threw the error
   away, so a database blip logged the dentist out with "Acceso denegado" — a
   check that failed presented as a check that denied.

   Two throttles guard this endpoint, and they are not redundant. This action
   counts against `checkAdminLoginLimit` because it is a public HTTP endpoint
   that a script can call directly; /api/auth/[...path] counts against the same
   bucket because Neon Auth's own sign-in route is public too and would
   otherwise be the unmetered way in. One bucket, so five attempts means five
   attempts however they arrive.
   ========================================================================== */

import { redirect } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { staff } from '@/lib/schema';
import { CSRF_FIELD_NAME, assertCsrf, ensureCsrfToken } from '@/lib/csrf';
import { checkAdminLoginLimit } from '@/lib/rate-limit';
import { getRequestContext } from '@/lib/request-context';

import type { CsrfSeal } from '../_lib/csrf-seal';
import type { LoginState } from '../_lib/form-contracts';
import { MUTATION_MESSAGES, type MutationResult } from '../_lib/mutation';
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH, readAdminSession } from '../_lib/session';

/* ============================================================================
   CSRF
   ========================================================================== */

/**
 * Mint the token if this browser has none, and return it.
 *
 * `ensureCsrfToken` writes a cookie, which Next allows only from a Server
 * Action or a Route Handler — a Server Component render that tried it would
 * throw. That is why the admin pages read the token with `getCsrfToken()` and
 * this action exists to fill the gap when the read comes back empty, which
 * happens routinely: the token is a session cookie and the session token
 * outlives the browser being closed.
 *
 * Deliberately callable without a session. The token authorises nothing on its
 * own — it only proves the caller could read a same-origin cookie — so gating
 * it behind a session would buy nothing and would leave a freshly reopened
 * browser holding a panel whose every button fails.
 */
export async function issueCsrfToken(): Promise<CsrfSeal> {
  return { field: CSRF_FIELD_NAME, token: await ensureCsrfToken() };
}

/* ============================================================================
   Sign in
   ========================================================================== */

const credentialsSchema = z.object({
  email: z
    .email({ error: 'Escriba un correo electrónico válido.' })
    .max(255, { error: 'El correo electrónico es demasiado largo.' }),
  /* A minimum, not a policy. It exists so an empty submit is answered by the
     form instead of by a round trip to the auth service — which would also
     spend one of the five attempts. */
  password: z
    .string({ error: 'Escriba su contraseña.' })
    .min(1, { error: 'Escriba su contraseña.' })
    .max(200, { error: 'La contraseña es demasiado larga.' }),
});

/**
 * One message for every rejected credential.
 *
 * "Ese correo no existe" and "contraseña incorrecta" are two different answers
 * to the same question, and the difference tells an attacker which addresses
 * are worth attacking. The clinic has a handful of accounts; the distinction
 * helps nobody who belongs here.
 */
const REJECTED = 'Correo electrónico o contraseña incorrectos.';

export async function signInAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const { ipHash } = await getRequestContext();

  /* Before parsing, so a script pays one indexed upsert per attempt rather
     than a Zod parse and a round trip to Neon Auth. */
  const limit = await checkAdminLoginLimit(ipHash);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return {
      status: 'error',
      message:
        `Demasiados intentos fallidos desde esta conexión. ` +
        `Vuelva a intentarlo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
    };
  }

  const parsed = credentialsSchema.safeParse({
    email: typeof formData.get('email') === 'string' ? String(formData.get('email')).trim() : undefined,
    password: typeof formData.get('password') === 'string' ? formData.get('password') : undefined,
  });

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error).fieldErrors;
    const field = flattened.email ? 'email' : 'password';
    return {
      status: 'error',
      message: flattened.email?.[0] ?? flattened.password?.[0] ?? REJECTED,
      field,
    };
  }

  let signedInUserId: string | null = null;

  try {
    const { data, error } = await auth.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data) {
      /* Neither the attempted address nor the upstream message is recorded.
         The address is a member of staff's personal data in an append-only
         table, and the message is upstream prose that can quote the request.
         What an investigation needs is here already: the hashed client, the
         user agent, and the fact that an attempt failed. */
      await recordAudit({ action: 'session.sign_in_failed', entity: 'session' });
      console.warn('[admin] sign-in rejected (status %s)', error?.status ?? 'none');
      return { status: 'error', message: REJECTED, field: 'password' };
    }

    signedInUserId = data.user?.id ?? null;
  } catch (cause) {
    /* Name only: a thrown fetch error's message can carry the URL it called. */
    console.error(
      '[admin] sign-in could not reach the auth service: %s',
      cause instanceof Error ? cause.name : 'unknown failure',
    );
    return {
      status: 'error',
      message:
        'No se pudo contactar con el servicio de autenticación. Inténtelo de nuevo en unos momentos.',
    };
  }

  /* Mint the token now, while a cookie write is still legal, so the first
     admin page the browser renders already has one to hand to its forms. */
  await ensureCsrfToken();

  /* The session cookie was written to the RESPONSE; the request headers this
     invocation is reading have not changed, so `recordAudit` cannot resolve the
     actor from the session yet and would file this under nobody. The user id
     goes in `entityId` instead, which is where the "who" of a session event
     belongs anyway. */
  await recordAudit({
    action: 'session.signed_in',
    entity: 'session',
    entityId: signedInUserId,
  });

  /* Bind the auth account to the staff row, once.
   *
   * `app.staff.user_id` is documented as "recorded the first time this person
   * signs in", and until this ran nothing wrote it — so the column was always
   * null and `npm run admin:list` reported "never signed in" for people who had
   * signed in that minute. A column whose comment describes behaviour the code
   * does not have is worse than no column.
   *
   * Here rather than in `readAdminSession`, because this is a mutation context:
   * the session lookup runs on every admin request and every admin action, and
   * writing from it would put a needless UPDATE on the hot path.
   *
   * `is null` in the predicate makes it a one-time write rather than a write on
   * every sign-in, and means a changed id is NOT silently accepted — if the
   * address is ever re-registered against a different account, the row keeps the
   * original binding and the mismatch stays visible. Failure is swallowed for
   * the same reason `recordAudit` swallows: bookkeeping must not cost the
   * dentist a login. */
  if (signedInUserId) {
    try {
      await db
        .update(staff)
        .set({ userId: signedInUserId })
        .where(and(eq(staff.email, parsed.data.email), isNull(staff.userId)));
    } catch (cause) {
      console.warn('[admin] could not bind staff row to account: %s', formatDatabaseFailure(cause));
    }
  }

  redirect(ADMIN_HOME_PATH);
}

/* ============================================================================
   Sign out
   ========================================================================== */

/**
 * End the session.
 *
 * CSRF-checked like every other mutation. A forged sign-out is only a nuisance
 * rather than a breach, but it is a nuisance a hostile page can inflict on a
 * dentist mid-consultation, and the token is already in the form.
 */
export async function signOutAction(formData: FormData): Promise<MutationResult> {
  try {
    await assertCsrf(formData);
  } catch {
    return { ok: false, message: MUTATION_MESSAGES.csrf };
  }

  /* Read before the session is destroyed: afterwards there is nobody to
     attribute the row to. */
  const check = await readAdminSession();

  await recordAudit({
    action: 'session.signed_out',
    entity: 'session',
    entityId: check.status === 'authenticated' ? check.actor.id : null,
  });

  try {
    await auth.signOut();
  } catch (cause) {
    console.error(
      '[admin] sign-out could not reach the auth service: %s',
      cause instanceof Error ? cause.name : 'unknown failure',
    );
    /* The redirect below still happens. The local session cookie is what the
       browser presents on the next request, and leaving someone parked in the
       panel because a remote revocation failed is the worse outcome. */
  }

  redirect(ADMIN_LOGIN_PATH);
}
