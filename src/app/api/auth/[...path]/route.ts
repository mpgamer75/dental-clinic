/* ============================================================================
   /api/auth/[...path] — Neon Auth proxy, allowlisted and throttled
   ----------------------------------------------------------------------------
   Every sign-in, sign-out and session refresh from the browser lands here and is
   forwarded to Neon Auth with the cookie secret attached server-side. The client
   never holds a credential and never talks to the auth host directly, which is
   what lets the session cookie stay first-party and HttpOnly.

   This route is also the application's most attackable endpoint: it accepts a
   password and answers whether it was right, from anywhere, as fast as the
   network allows.

   TWO THINGS THIS FILE GOT WRONG, BOTH FOUND BY REVIEW, BOTH FIXED HERE:

   1. It forwarded EVERY path to the auth service. `auth.handler()` has no path
      allowlist of its own, so `sign-up/email` — a real Better Auth endpoint —
      was reachable by anyone who guessed the URL. Combined with the panel's
      authorization check having been dropped, that was three curl commands from
      anonymous to the whole patient book: register, receive a first-party
      session cookie, walk in. Sign-up is now refused here, and membership is
      checked separately against app.staff.

   2. Only `sign-in/*` was throttled, and the limiter was reasoned about purely
      as a password-guessing defence. But `sign-up/email` and `forget-password`
      also answer "does this address exist?" — differently for a known address
      than an unknown one — and `forget-password` sends mail to a real person.
      Unmetered, that is free account enumeration and a mail cannon pointed at
      the clinic's own inbox. The throttle now covers every path that acts on an
      address.

   The allowlist is the primary control and the throttle is the secondary one.
   An allowlist fails safe when Better Auth adds an endpoint in a future
   release; a blocklist would have silently started forwarding it.

   Note for src/proxy.ts: this path must be excluded from any redirect or locale
   rewrite. A sign-in POST that gets rewritten to /es/api/auth/... arrives as a
   404 and the admin can no longer log in.
   ========================================================================== */

import { auth } from '@/lib/auth/server';
import { checkAdminLoginLimit } from '@/lib/rate-limit';
import { getRequestContext } from '@/lib/request-context';

const handlers = auth.handler();

/**
 * The only auth endpoints this application uses.
 *
 * Everything else Better Auth exposes — sign-up, password reset, email
 * verification, OAuth callbacks, account linking, passkeys — is refused. The
 * clinic has a fixed, tiny set of staff: accounts are created deliberately in
 * the Neon console and then granted access in app.staff. There is no
 * self-service flow to support, so exposing one is all risk and no feature.
 *
 * If a flow is genuinely wanted later (a password reset the dentist can run
 * without a console) it gets added HERE, on purpose, with its own throttle —
 * not inherited silently from a dependency's route table.
 */
const ALLOWED_POST_PATHS = new Set(['sign-in/email', 'sign-out', 'get-session']);

/** GET is only ever a session read. Same reasoning as above. */
const ALLOWED_GET_PATHS = new Set(['get-session']);

/**
 * Paths that act on an email address, and therefore leak whether one exists or
 * send mail to whoever owns it.
 *
 * Wider than the allowlist on purpose. These two sets are maintained
 * independently so that adding a path to `ALLOWED_POST_PATHS` does not quietly
 * add an unmetered one: if a future reset flow is allowed, it is already
 * throttled by the prefix match below.
 *
 * `sign-out` and `get-session` are deliberately absent. Throttling sign-out
 * would let an attacker who cannot get in still trap a legitimate admin inside
 * a session they cannot end, and `get-session` runs on every admin request
 * through the proxy — metering it would rate-limit the panel itself.
 */
function actsOnAnAddress(path: string): boolean {
  return (
    path === 'sign-in' ||
    path.startsWith('sign-in/') ||
    path.startsWith('sign-up') ||
    path.startsWith('forget-password') ||
    path.startsWith('reset-password') ||
    path.startsWith('email-otp') ||
    path.startsWith('magic-link') ||
    path.startsWith('verify-email')
  );
}

/**
 * A refused path answers exactly as a route that does not exist.
 *
 * Not 403: a 403 confirms the endpoint is there and merely closed, which tells
 * someone mapping the surface which flows exist and are worth attacking from
 * another angle. 404 says nothing.
 */
function notFound(): Response {
  return Response.json(
    { error: 'not_found' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  );
}

function tooManyRequests(retryAfterSeconds: number): Response {
  /* 429 with `Retry-After` in seconds, which is what an HTTP client — the auth
     SDK included — knows how to read. The body carries no hint about whether
     the address exists or the password was close. */
  return Response.json(
    { error: 'too_many_requests', message: 'Demasiados intentos. Inténtelo más tarde.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        /* Nothing about a throttled attempt should be cached or shared. */
        'Cache-Control': 'no-store',
      },
    },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const path = (await context.params).path.join('/');
  if (!ALLOWED_GET_PATHS.has(path)) return notFound();
  return handlers.GET(request, context);
}

/**
 * `checkAdminLoginLimit` fails CLOSED when the counter is unreadable — see the
 * policy note in @/lib/rate-limit. That is the right trade here even though it
 * means a database outage locks the clinic out of the panel: the alternative is
 * that the outage silently converts this endpoint into an unmetered guessing
 * oracle, and being locked out for an hour is recoverable in a way a guessed
 * password is not.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  /* `params` is awaited here and then again inside the delegated handler. It is
     a resolved promise by then, so the second await costs nothing — reading it
     once and reconstructing the context object would mean rebuilding a shape
     the SDK owns. */
  const path = (await context.params).path.join('/');

  /* Allowlist BEFORE the throttle, so a refused path costs one set lookup
     rather than a request-context read and a database write. Otherwise the
     limiter itself becomes the cheapest way to make the clinic's database do
     work on demand. */
  if (!ALLOWED_POST_PATHS.has(path)) return notFound();

  if (actsOnAnAddress(path)) {
    const { ipHash } = await getRequestContext();
    const limit = await checkAdminLoginLimit(ipHash);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);
  }

  return handlers.POST(request, context);
}
