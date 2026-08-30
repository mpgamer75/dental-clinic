/* ============================================================================
   /api/auth/[...path] — Neon Auth proxy
   ----------------------------------------------------------------------------
   Every sign-in, sign-out and session refresh from the browser lands here and is
   forwarded to Neon Auth with the cookie secret attached server-side. The client
   never holds a credential and never talks to the auth host directly, which is
   what lets the session cookie stay first-party and HttpOnly.

   Note for src/proxy.ts: this path must be excluded from any redirect or locale
   rewrite. A sign-in POST that gets rewritten to /es/api/auth/... arrives as a
   404 and the admin can no longer log in.
   ========================================================================== */

import { auth } from '@/lib/auth/server';

export const { GET, POST } = auth.handler();
