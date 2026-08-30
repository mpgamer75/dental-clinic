/* ============================================================================
   Postgres client
   ----------------------------------------------------------------------------
   `server-only` is the first import deliberately. DATABASE_URL is a live
   credential, and a stray `import { db } from '@/lib/db'` inside a client
   component would otherwise be bundled and served to every visitor. With this
   import the build fails instead — the cheap failure, and the loud one.

   The WebSocket `Pool` driver is used rather than `drizzle-orm/neon-http`
   because admin mutations pair a row write with an audit write, and the HTTP
   driver can only ship a fixed statement batch: it cannot roll back on a
   condition evaluated between statements. Node 22+ — which includes Vercel's
   Node runtime — exposes a global `WebSocket`, so no `ws` polyfill is required.
   ========================================================================== */

import 'server-only';

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import * as schema from './schema';

function resolveConnectionString(): string {
  /* A NEXT_PUBLIC_ copy of the credential is not a configuration mistake that
     can be tolerated for one deploy: the value is inlined into every JavaScript
     chunk the browser downloads, and it stays in the CDN cache afterwards.
     Refusing to boot is the only proportionate response. */
  if (process.env.NEXT_PUBLIC_DATABASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_DATABASE_URL is set. A NEXT_PUBLIC_ variable is inlined into the browser ' +
        'bundle, so this publishes the database credential to every visitor. Remove it, then ' +
        'rotate the vd_app password in the Neon console before deploying again.',
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set, so there is no database to connect to. Copy the pooled ' +
        'connection string for the vd_app role (not neondb_owner) from the Neon console into ' +
        '.env.local, and set it in the Vercel project environment for deployed builds.',
    );
  }

  return connectionString;
}

/* Next's dev server re-evaluates a changed module and everything downstream of
   it on every save. Without this cache each edit would leak a Pool and its
   sockets, and a long editing session ends in Neon refusing new connections. */
const poolCache = globalThis as unknown as { __valerioDentalPool?: Pool };

const pool =
  poolCache.__valerioDentalPool ??
  new Pool({
    connectionString: resolveConnectionString(),
    /* Below Vercel's function timeout on purpose. If Neon is unreachable we want
       our own error — which the form paths turn into a "try again" message the
       patient can act on — rather than the platform killing the invocation and
       returning an opaque 504. */
    connectionTimeoutMillis: 8_000,
  });

if (process.env.NODE_ENV !== 'production') {
  poolCache.__valerioDentalPool = pool;
}

export const db = drizzle({ client: pool, schema });

/** The client's type, for helpers that accept either `db` or a transaction. */
export type Database = typeof db;

export { schema };
