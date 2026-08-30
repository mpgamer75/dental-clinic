/* ============================================================================
   WHO IS ASKING — the panel's only answer to that question
   ----------------------------------------------------------------------------
   Every admin page and every admin mutation resolves the caller through this
   module. It exists because the panel it replaces answered the question in
   React state: `useState(false)` for `isAdmin`, decided in a `useEffect`, with
   `src/proxy.ts` skipping /admin entirely. There was no server-side guard of
   any kind — the dashboard markup, the patient rows inside it and the database
   credential that fetched them were all shipped to whoever asked for the URL.

   The distinction this module is built around is the one the old code got
   wrong. It ran the admin lookup, discarded the error, and treated a null
   result as "you are not an admin" — so a timeout, a dropped connection or a
   momentary outage signed the dentist out with "Acceso denegado". A check that
   FAILED is not a check that DENIED, and conflating the two turns every blip in
   the auth service into an accusation. `SessionCheck` therefore has FOUR
   states, not two, and callers must handle all of them: the guard redirects
   only on 'anonymous', shows a retry panel on 'unavailable', and refuses
   without redirecting on 'forbidden'.

   'forbidden' is the authorization half, and it is separate on purpose. Neon
   Auth answers who someone is; it has no opinion on whether they may read a
   patient book. A row in `app.staff` is what answers that, and until this
   module asked for one, every account in the auth project was an
   administrator.
   ========================================================================== */

import 'server-only';

import { redirect } from 'next/navigation';

import { and, eq, isNull } from 'drizzle-orm';

import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import { staff } from '@/lib/schema';

/** The signed-in member of staff, reduced to what the panel actually renders. */
export interface AdminActor {
  id: string;
  email: string;
  /** Neon Auth always sends a name; it can still be the empty string. */
  name: string | null;
}

export type SessionCheck =
  | { status: 'authenticated'; actor: AdminActor }
  | { status: 'anonymous' }
  /** Signed in, and not staff. A real person with a real account who has no
   *  business here — distinct from 'anonymous', because sending them to a login
   *  form they have already passed is a loop, not an answer. */
  | { status: 'forbidden'; email: string }
  /** The auth service could not be reached or answered with an error. Nobody
   *  has been denied anything — the question simply has no answer right now. */
  | { status: 'unavailable'; detail: string };

/** Where an unauthenticated visitor is sent. Must match `loginUrl` in
 *  src/proxy.ts, or the middleware and the layout would disagree about where
 *  the login form lives and bounce the visitor between them. */
export const ADMIN_LOGIN_PATH = '/admin/login';

/** The panel's home, and where a successful sign-in lands. */
export const ADMIN_HOME_PATH = '/admin';

/**
 * A short, non-identifying description of an auth failure.
 *
 * Same discipline as `formatDatabaseFailure` in @/lib/db-errors: status and
 * code only. `message` is upstream prose that may quote the request, and it has
 * no business in a platform log this project does not own.
 */
function describeAuthFailure(error: {
  status?: number;
  statusText?: string;
  code?: string;
}): string {
  const status = typeof error.status === 'number' ? error.status : 0;
  const code = error.code ?? 'none';
  return `auth service returned ${status || 'no status'} (code ${code})`;
}

/**
 * Resolve the current session.
 *
 * Both failure shapes are covered: Better Auth reports an upstream error by
 * RESOLVING with `{ data: null, error }` rather than throwing, and a transport
 * failure below it throws. Only one of the two was handled in an early draft of
 * this rewrite, which reintroduced the original bug through the other door.
 */
export async function readAdminSession(): Promise<SessionCheck> {
  try {
    const { data, error } = await auth.getSession();

    if (error) {
      const detail = describeAuthFailure(error);
      console.error('[admin] session lookup failed: %s', detail);
      return { status: 'unavailable', detail };
    }

    const user = data?.user;
    if (!user) return { status: 'anonymous' };

    /* THE AUTHORIZATION STEP. Everything above this line establishes WHO is
       asking; only this establishes whether they may be here.

       Leaving it out is what the Supabase panel's `admin_users` lookup used to
       do and what the first cut of this rewrite dropped — at which point every
       account in the Neon Auth project was an administrator of the patient
       book, and every other control in the panel was guarding a door that had
       no lock. */
    let rows: Array<{ email: string; name: string | null }>;
    try {
      rows = await db
        .select({ email: staff.email, name: staff.name })
        .from(staff)
        .where(and(eq(staff.email, user.email), isNull(staff.disabledAt)))
        .limit(1);
    } catch (cause) {
      /* Its own catch, because the outer one blames the auth service and this
         is the database. More importantly it must resolve to 'unavailable' and
         never to 'forbidden': the same conflation of "the check failed" with
         "the check said no" that this module was written to fix would, here,
         lock the dentist out of the patient book whenever Neon was waking from
         suspend. */
      const detail = `staff lookup failed: ${formatDatabaseFailure(cause)}`;
      console.error('[admin] %s', detail);
      return { status: 'unavailable', detail };
    }

    if (rows.length === 0) {
      /* Logged, because a signed-in non-member reaching /admin is either a
         misconfiguration or someone probing, and both are worth seeing. The
         address is a member of staff's or an attacker's — either way it is
         personal data, so only the domain is recorded. */
      const domain = user.email.slice(user.email.lastIndexOf('@'));
      console.warn('[admin] refused a signed-in non-member (%s)', domain);
      return { status: 'forbidden', email: user.email };
    }

    return {
      status: 'authenticated',
      actor: {
        id: user.id,
        email: user.email,
        /* The staff row's name wins when it has one: it is what the clinic
           chose to call this person, rather than whatever they typed into the
           auth service. */
        name: rows[0].name ?? (user.name && user.name.length > 0 ? user.name : null),
      },
    };
  } catch (cause) {
    /* Name only — a thrown fetch error's message can carry the URL it was
       calling, query string included. */
    const detail =
      cause instanceof Error ? `${cause.name} while contacting the auth service` : 'unknown failure';
    console.error('[admin] session lookup threw: %s', detail);
    return { status: 'unavailable', detail };
  }
}

/**
 * The page guard. Returns the actor, or does not return at all.
 *
 * `redirect` throws, so an 'unavailable' result cannot fall through to the
 * caller as an implicit "no session": it is handed back to the layout, which
 * renders an explanation and a retry instead of the panel. Redirecting there
 * would be the old bug wearing a server component's clothes — the dentist would
 * arrive at a login form having never been signed out.
 */
export async function requireAdminPage(): Promise<
  | { ok: true; actor: AdminActor }
  | { ok: false; detail: string; forbidden?: boolean }
> {
  const check = await readAdminSession();

  if (check.status === 'anonymous') redirect(ADMIN_LOGIN_PATH);
  if (check.status === 'unavailable') return { ok: false, detail: check.detail };

  /* Deliberately NOT a redirect to the login form. This person has a valid
     session; bouncing them to a form they have already passed would loop, and
     would also be a worse answer than the truth — they are signed in, and this
     is not for them. `forbidden` is returned like `unavailable` so the layout
     renders a refusal without a byte of the panel. */
  if (check.status === 'forbidden') {
    return {
      ok: false,
      forbidden: true,
      detail:
        'Su cuenta no tiene acceso al panel. Solicite acceso al administrador de la clínica.',
    };
  }

  return { ok: true, actor: check.actor };
}
