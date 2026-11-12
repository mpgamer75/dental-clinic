/* ============================================================================
   Neon Auth — server instance
   ----------------------------------------------------------------------------
   One module-level instance, imported everywhere a session is needed: Server
   Components, Server Actions, Route Handlers, and the proxy. Creating a second
   one with a different cookie secret would silently invalidate every session
   issued by the first, so there is exactly one and it lives here.

   Sessions are held by Neon Auth over its own API. Nothing about them is
   reachable through DATABASE_URL — vd_app has no access to the `neon_auth`
   schema at all (migrations/0002_app_role.sql), so a compromised application
   credential cannot read a session token or a password hash.

   A Server Component that calls `getSession()` must opt out of static rendering
   with `export const dynamic = 'force-dynamic'`; the session lives in a cookie
   and a prerendered page has none.
   ========================================================================== */

import { createNeonAuth } from '@neondatabase/auth/next/server';

function requireAuthEnv(name: 'NEON_AUTH_BASE_URL' | 'NEON_AUTH_COOKIE_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Without it the admin panel has no authentication at all — take ` +
        'the value from the Neon console (Auth tab) into .env.local and into the Vercel ' +
        'project environment.',
    );
  }
  return value;
}

type NeonAuth = ReturnType<typeof createNeonAuth>;

let instance: NeonAuth | null = null;

/**
 * The auth client, created on first use rather than at import.
 *
 * Creating it at import made the environment check run whenever Next loaded
 * this module, and Next loads it while collecting page data for
 * /api/auth/[...path] during `next build`. A Vercel Preview whose environment
 * did not carry the Neon Auth variables therefore failed to build at all, so
 * no preview of a public-page change could be deployed.
 *
 * Deferring it keeps the guarantee that matters: nothing authenticates without
 * the variables. A call made without them still throws, which the panel's
 * session check reports as 'unavailable' and the login and auth routes answer
 * with an error, so the panel stays shut. It is never silently open.
 */
export function getAuth(): NeonAuth {
  instance ??= createNeonAuth({
    baseUrl: requireAuthEnv('NEON_AUTH_BASE_URL'),
    cookies: { secret: requireAuthEnv('NEON_AUTH_COOKIE_SECRET') },
  });
  return instance;
}

/* Production keeps failing at build time. A production deploy without these
   variables would ship a panel nobody can sign in to, and that should stop the
   deploy rather than surface as a 500 on the dentist's first login. Only
   Vercel's production environment checks eagerly; previews and local builds
   defer to the first request. */
if (process.env.VERCEL_ENV === 'production') {
  requireAuthEnv('NEON_AUTH_BASE_URL');
  requireAuthEnv('NEON_AUTH_COOKIE_SECRET');
}
