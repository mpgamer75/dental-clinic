/* ============================================================================
   CSRF — double-submit token for admin mutations
   ----------------------------------------------------------------------------
   Next.js already refuses a Server Action whose `Origin` does not match the
   host, and that is a good default. It is not, however, a token. It is a header
   check, and it evaporates the moment anything in front of the app touches
   headers: a reverse proxy that rewrites or drops `Origin`, a CDN rule added to
   fix an unrelated CORS complaint, or `allowedOrigins` widened in next.config to
   let a preview deployment through. None of those changes look like they are
   about CSRF, and after any of them the only thing standing between a logged-in
   dentist visiting a hostile page and that page approving a testimonial or
   deleting an appointment is nothing at all.

   The token below does not depend on any of that. The client can only echo a
   value it was able to read, and the same-origin policy is what stops a hostile
   page from reading it — that guarantee lives in the browser, not in a
   configuration file somebody may edit.

   Shape: the cookie is readable by scripts (`httpOnly: false`) because the whole
   mechanism is the client proving it can read it. That is safe precisely because
   the token authorises nothing on its own; it is not a session credential, and
   stealing it without also stealing the session cookie buys nothing.
   ========================================================================== */

import 'server-only';

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/** Hidden input name the form must post back. */
export const CSRF_FIELD_NAME = 'csrf_token';

/** 256 bits. Long enough that guessing is not a strategy. */
const TOKEN_BYTES = 32;

export class CsrfError extends Error {
  constructor(reason: string) {
    super(`CSRF check failed: ${reason}`);
    this.name = 'CsrfError';
  }
}

/**
 * `__Host-` in production, plain in development.
 *
 * The prefix is a browser-enforced promise that the cookie is Secure, path `/`
 * and has no `Domain` — which means a sibling subdomain, or anything that
 * manages to answer over plain HTTP, cannot overwrite it and hand the attacker a
 * token they know. The prefix requires `Secure`, and `npm run dev` binds
 * 0.0.0.0 for phone testing over http://<lan-ip>:9003, where a Secure cookie is
 * simply never stored — so development uses the unprefixed name rather than a
 * cookie that silently fails to exist.
 */
export function csrfCookieName(): string {
  return process.env.NODE_ENV === 'production' ? '__Host-csrf' : 'csrf';
}

/** The current token, or null if none has been issued to this browser yet. */
export async function getCsrfToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(csrfCookieName())?.value ?? null;
}

/**
 * Return the browser's token, minting and setting one if it has none.
 *
 * Must be called from a Server Action or a Route Handler: Next.js refuses cookie
 * writes during a Server Component render, and swallowing that refusal here
 * would return a token that was never stored, so every later `assertCsrf` would
 * fail with no clue why. Pass the returned value into the form as a prop and
 * render it in a hidden `csrf_token` input.
 *
 * The cookie has no `maxAge`, so it is a session cookie: the token means nothing
 * once the browser is closed, and an expiry shorter than the admin's working day
 * would break a form that had been sitting open — the failure mode being an
 * inexplicable rejection on a button that worked ten minutes earlier.
 */
export async function ensureCsrfToken(): Promise<string> {
  const store = await cookies();
  const name = csrfCookieName();

  const existing = store.get(name)?.value;
  if (existing) return existing;

  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  store.set(name, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return token;
}

/**
 * Constant-time equality for two tokens.
 *
 * `timingSafeEqual` throws — it does not return false — when the buffers differ
 * in length, so the length is compared first. That early return does leak
 * whether the submitted value was the right size, which is not a secret: the
 * token length is fixed and public. What must not leak is how many leading bytes
 * matched, and that is what the constant-time compare protects.
 */
function tokensMatch(submitted: string, expected: string): boolean {
  const submittedBytes = Buffer.from(submitted, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');

  if (submittedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(submittedBytes, expectedBytes);
}

/**
 * Throw unless the form posted back the token this browser holds in its cookie.
 *
 * Call it first in every admin mutation, before reading any other field. It
 * throws rather than returning a boolean so that forgetting to check the result
 * is not a way to skip the check.
 */
export async function assertCsrf(formData: FormData): Promise<void> {
  const submitted = formData.get(CSRF_FIELD_NAME);
  if (typeof submitted !== 'string' || submitted.length === 0) {
    throw new CsrfError(`the form did not include a "${CSRF_FIELD_NAME}" field`);
  }

  const expected = await getCsrfToken();
  if (!expected) {
    throw new CsrfError('no token cookie was present on the request');
  }

  if (!tokensMatch(submitted, expected)) {
    throw new CsrfError('the submitted token does not match the cookie');
  }
}
