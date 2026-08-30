/* ============================================================================
   Migration runner
   ----------------------------------------------------------------------------
   Usage: npm run db:migrate
   ----------------------------------------------------------------------------
   Applies every migrations/*.sql in filename order, once, each inside its own
   transaction, and records what it applied in app._migrations. Deliberately
   small: the migrations are hand-written SQL because what this schema needs —
   role grants, a trigger function with a pinned search_path, partial indexes —
   is not what a schema differ emits. What was missing was not a generator, it
   was a record of which files had already run; before this, "is the database up
   to date?" could only be answered by reading it.

   Each file is checksummed. Editing an already-applied migration is the failure
   this catches: the edit runs on nobody's database, every environment silently
   diverges, and the difference surfaces months later as a constraint that exists
   in staging and not in production.
   ========================================================================== */

import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Client } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

/* Resolved from the working directory rather than from this file's location:
   npm scripts always run at the project root, and `import.meta.url` is not
   available under the CommonJS output tsx produces for a package with no
   "type": "module". */
const MIGRATIONS_DIR = resolve(process.cwd(), 'migrations');

/**
 * DATABASE_URL is the vd_app role, which has no DDL — by design. A migration
 * therefore needs the owner connection string, which lives only in a developer's
 * shell or in MIGRATION_DATABASE_URL, never in the deployed environment.
 */
function connectionString(): string {
  const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!url) {
    console.error(
      'Set MIGRATION_DATABASE_URL to the neondb_owner connection string from the Neon console.\n' +
        'DATABASE_URL alone is not enough: it points at vd_app, which is granted CRUD and no DDL.',
    );
    process.exit(1);
  }

  if (!process.env.MIGRATION_DATABASE_URL) {
    console.warn(
      'MIGRATION_DATABASE_URL is not set; falling back to DATABASE_URL.\n' +
        'If that is the vd_app role this will fail on the first CREATE — which is the grant ' +
        'working as intended, not a bug in this script.',
    );
  }

  return url;
}

function checksum(sqlText: string): string {
  return createHash('sha256').update(sqlText).digest('hex');
}

async function pendingFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    /* Plain lexicographic order over the zero-padded prefixes, which is why they
       are zero-padded. Subdirectories are skipped above, so migrations/drizzle —
       where drizzle-kit writes its unreviewed diffs — is never picked up. */
    .sort((a, b) => a.localeCompare(b, 'en'));
}

async function main(): Promise<void> {
  const client = new Client(connectionString());
  await client.connect();

  try {
    /* `app` may not exist yet on a brand-new branch, and the ledger has to be
       creatable before the migration that creates the schema has run. */
    await client.query('CREATE SCHEMA IF NOT EXISTS app');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app._migrations (
        filename   text PRIMARY KEY,
        checksum   text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const applied = new Map<string, string>();
    const { rows } = await client.query<{ filename: string; checksum: string }>(
      'SELECT filename, checksum FROM app._migrations',
    );
    for (const row of rows) applied.set(row.filename, row.checksum);

    const files = await pendingFiles();
    if (files.length === 0) {
      console.log('No .sql files in migrations/ — nothing to do.');
      return;
    }

    let appliedCount = 0;

    for (const filename of files) {
      const sqlText = await readFile(resolve(MIGRATIONS_DIR, filename), 'utf8');
      const digest = checksum(sqlText);
      const previous = applied.get(filename);

      if (previous) {
        if (previous !== digest) {
          throw new Error(
            `${filename} has changed since it was applied.\n` +
              'An applied migration is history and cannot be edited: this database ran the old ' +
              'text and every other environment will run the new one. Add a follow-up migration ' +
              'instead, or — if the file was never applied anywhere else — delete its row from ' +
              'app._migrations by hand and re-run.',
          );
        }

        console.log(`  skip  ${filename} (already applied)`);
        continue;
      }

      /* One transaction per file, not one for the whole run: a failure halfway
         through the sequence leaves the files before it applied and recorded,
         so the fix is to correct the failing file and re-run rather than to
         reason about a half-applied schema. */
      await client.query('BEGIN');
      try {
        await client.query(sqlText);
        await client.query('INSERT INTO app._migrations (filename, checksum) VALUES ($1, $2)', [
          filename,
          digest,
        ]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`${filename} failed and was rolled back: ${(error as Error).message}`, {
          cause: error,
        });
      }

      appliedCount += 1;
      console.log(`  apply ${filename}`);
    }

    console.log(
      appliedCount === 0
        ? 'Database is up to date.'
        : `Applied ${appliedCount} migration${appliedCount === 1 ? '' : 's'}.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('Migration failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
