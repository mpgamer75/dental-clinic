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

   Two throttles guard sign-in, because there are two public ways in. This
   action counts FAILED attempts only, per account and per client (see
   `checkAdminLoginGate`): the whole clinic shares one NAT address, and the
   every-attempt limit it used to spend locked all staff out after three good
   sign-ins and two typos. /api/auth/[...path], Neon Auth's own sign-in route,
   keeps the every-attempt bucket — nobody legitimate calls it — and this
   action's gate also refuses a client that has used that bucket up, so
   alternating between the two endpoints gains an attacker nothing.
   ========================================================================== */

import { redirect } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { recordAudit } from '@/lib/audit';
import { getAuth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { staff } from '@/lib/schema';
import { CSRF_FIELD_NAME, assertCsrf, ensureCsrfToken } from '@/lib/csrf';
import { checkAdminLoginGate, recordAdminLoginFailure } from '@/lib/rate-limit';
import { getRequestContext, hashIp } from '@/lib/request-context';

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

  /* The address the person typed, echoed back on every refusal. React 19
     resets a form after its action runs, so without this a wrong password also
     erased the email and both had to be typed again — on a phone, at the front
     desk, with a patient waiting. It is the caller's own input returned to the
     caller, so nothing leaks. */
  const typedEmail =
    typeof formData.get('email') === 'string' ? String(formData.get('email')).trim() : '';

  /* Parsed BEFORE the throttle now: the throttle is keyed on the account, so
     it needs the address. A parse costs no database work, so an empty or
     malformed submit is still answered without touching the counter. */
  const parsed = credentialsSchema.safeParse({
    email: typedEmail || undefined,
    password: typeof formData.get('password') === 'string' ? formData.get('password') : undefined,
  });

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error).fieldErrors;
    const field = flattened.email ? 'email' : 'password';
    return {
      status: 'error',
      message: flattened.email?.[0] ?? flattened.password?.[0] ?? REJECTED,
      field,
      email: typedEmail,
    };
  }

  /* The account half of the throttle key: a salted digest of the address
     (the same salted SHA-256 the client address goes through — `hashIp` is the
     project's one keyed hash, whatever its name says), so rate_limits never
     holds a member of staff's email. */
  const accountKey = hashIp(`login-email:${parsed.data.email.toLowerCase()}`) ?? 'unknown';

  const gate = await checkAdminLoginGate(ipHash, accountKey);
  if (!gate.allowed) {
    const minutes = Math.max(1, Math.ceil(gate.retryAfterSeconds / 60));
    return {
      status: 'error',
      message:
        `Demasiados intentos fallidos con esta cuenta desde esta conexión. ` +
        `Vuelva a intentarlo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
      email: typedEmail,
    };
  }

  let signedInUserId: string | null = null;

  try {
    const { data, error } = await getAuth().signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data) {
      /* Only a REJECTED credential is counted — a successful sign-in costs the
         clinic nothing, which is what stops three correct logins and two typos
         locking everyone out.

         Neither the attempted address nor the upstream message is recorded.
         The address is a member of staff's personal data in an append-only
         table, and the message is upstream prose that can quote the request.
         What an investigation needs is here already: the hashed client, the
         user agent, and the fact that an attempt failed. */
      await Promise.all([
        recordAdminLoginFailure(ipHash, accountKey),
        recordAudit({ action: 'session.sign_in_failed', entity: 'session' }),
      ]);
      console.warn('[admin] sign-in rejected (status %s)', error?.status ?? 'none');
      return { status: 'error', message: REJECTED, field: 'password', email: typedEmail };
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
      email: typedEmail,
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
     attribute the row to. Handed to the audit as the verified actor so the
     sign-out costs one session lookup, not two. */
  const check = await readAdminSession();
  const actor = check.status === 'authenticated' ? check.actor : null;

  await recordAudit({
    action: 'session.signed_out',
    entity: 'session',
    entityId: actor?.id ?? null,
    verifiedActor: actor,
  });

  try {
    await getAuth().signOut();
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
