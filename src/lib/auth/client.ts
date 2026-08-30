'use client';

/* ============================================================================
   Neon Auth — browser instance
   ----------------------------------------------------------------------------
   Deliberately separate from src/lib/auth/server.ts: that module reads the
   cookie secret from the environment, and importing it from a client component
   would either fail the build or, worse, bundle the secret. This one takes no
   configuration — it talks to the app's own /api/auth/[...path] route, which
   holds the credentials on the server side.
   ========================================================================== */

import { createAuthClient } from '@neondatabase/auth/next';

export const authClient = createAuthClient();
