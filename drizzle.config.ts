/* ============================================================================
   drizzle-kit configuration
   ----------------------------------------------------------------------------
   Kit is used here for `pull`, `studio` and for reading a diff — not for
   producing the migrations that ship. Those are hand-written SQL in
   migrations/, applied in filename order by src/scripts/migrate.ts, because the
   things this schema actually needs (role grants, a pinned `search_path` on a
   trigger function, partial indexes) are not things a schema diff produces.
   ========================================================================== */

import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

/* Next loads .env.local itself; a standalone kit process does not, and would
   otherwise report "no connection string" while the value sits in the file. */
config({ path: '.env.local' });

/* Everything kit does — `pull`, `push`, `studio` — reads system catalogs and
   writes DDL, and vd_app deliberately has neither DDL nor any sight of
   neon_auth. Point it at the owner role when one is configured, and fall back to
   the application URL so `studio` still opens for a read-only look. */
const connectionString = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'Neither MIGRATION_DATABASE_URL nor DATABASE_URL is set, so drizzle-kit has no database ' +
      'to talk to. Put the neondb_owner connection string in MIGRATION_DATABASE_URL in ' +
      '.env.local for anything that emits DDL.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/schema.ts',

  /* Not './migrations'. Kit numbers its output from its own journal, which does
     not exist here, so a generated file would be written as 0000_*.sql and
     src/scripts/migrate.ts — which sorts by filename — would apply a diff
     *before* the initial schema it was diffed against. Generated SQL lands in a
     subdirectory to be read, and is copied into the numbered sequence by hand
     once it has been. */
  out: './migrations/drizzle',

  /* neon_auth is listed so a `pull` reports the auth tables as present and
     managed elsewhere rather than as objects missing from the schema file. */
  schemaFilter: ['app', 'audit', 'neon_auth'],

  dbCredentials: { url: connectionString },

  /* Confirm before executing, and show what is about to run. Non-negotiable for
     a database holding real patient enquiries. */
  strict: true,
  verbose: true,
});
