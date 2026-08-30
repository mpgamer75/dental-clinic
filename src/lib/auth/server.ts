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

export const auth = createNeonAuth({
  baseUrl: requireAuthEnv('NEON_AUTH_BASE_URL'),
  cookies: { secret: requireAuthEnv('NEON_AUTH_COOKIE_SECRET') },
});
