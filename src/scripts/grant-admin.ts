/* ============================================================================
   grant-admin — add, list or revoke access to the admin panel
   ----------------------------------------------------------------------------
   A Neon Auth account is authentication: it proves who someone is. A row in
   `app.staff` is authorization: it decides whether they may read the patient
   book. This script manages the second. Creating the account itself is a
   separate, deliberate step in the Neon Console — the application refuses to
   proxy sign-up precisely so that nobody can self-register into a staff
   address (see src/app/api/auth/[...path]/route.ts).

   Usage:
     npm run admin:grant  -- dentist@clinic.do "Dr. Francis Valerio"
     npm run admin:list
     npm run admin:revoke -- someone@clinic.do

   Revoking sets `disabled_at` rather than deleting the row. The row is the
   record that this person once had access, which is the thing an audit trail
   exists to keep; the application role has no DELETE on the table.
   ========================================================================== */

import { config } from 'dotenv';
import { Pool } from '@neondatabase/serverless';

/* .env.local first, matching Next's own precedence. Loading only `.env` is the
   mistake that makes a script silently fall back to localhost defaults and
   report a connection error that looks nothing like a missing variable. */
config({ path: '.env.local', quiet: true });
config({ quiet: true });

/* Writes to app.staff need INSERT/UPDATE, which vd_app has. DDL is not
   required, so unlike migrate.ts this can use the ordinary application
   credential. */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    'DATABASE_URL is not set. Copy it from .env.local, or run this from the project root.',
  );
  process.exit(1);
}

/** A deliberately forgiving shape check. Postgres enforces the real constraint;
 *  this exists to catch a shell-mangled argument before it becomes a row. */
function looksLikeAnAddress(value: string): boolean {
  const at = value.indexOf('@');
  return at > 0 && at < value.length - 1 && !/\s/.test(value);
}

async function main(): Promise<number> {
  const [command, email, name] = process.argv.slice(2);
  const pool = new Pool({ connectionString });

  try {
    if (command === 'list') {
      const { rows } = await pool.query(
        `select email, name, user_id, created_at, disabled_at
           from app.staff
          order by disabled_at nulls first, email`,
      );

      if (rows.length === 0) {
        console.log('No staff rows. Nobody can sign in to /admin yet.');
        console.log('Grant the first one with:  npm run admin:grant -- you@clinic.do "Your Name"');
        return 0;
      }

      console.log(`${rows.length} staff row(s):\n`);
      for (const r of rows) {
        const state = r.disabled_at ? `REVOKED ${r.disabled_at.toISOString().slice(0, 10)}` : 'active';
        const signedIn = r.user_id ? 'has signed in' : 'never signed in';
        console.log(`  ${r.email.padEnd(34)} ${state.padEnd(20)} ${signedIn}   ${r.name ?? ''}`);
      }
      return 0;
    }

    if (command === 'grant') {
      if (!email || !looksLikeAnAddress(email)) {
        console.error('Usage: npm run admin:grant -- <email> ["Full Name"]');
        return 1;
      }

      /* Re-granting a revoked address clears disabled_at rather than failing on
         the primary key — that is the ordinary case of someone returning from
         leave, and making them ask an engineer for a DELETE would be absurd. */
      const { rows } = await pool.query(
        `insert into app.staff (email, name)
              values ($1, $2)
         on conflict (email) do update
                set name        = coalesce(excluded.name, app.staff.name),
                    disabled_at = null
           returning email, name, disabled_at`,
        [email, name ?? null],
      );

      console.log(`Granted admin access to ${rows[0].email}.`);
      console.log(
        '\nThis only authorises the address. If it has no Neon Auth account yet, create one\n' +
          'in the Neon Console (Auth -> Users) — the app deliberately refuses to proxy sign-up,\n' +
          'so an account cannot be self-registered against a staff address.',
      );
      return 0;
    }

    if (command === 'revoke') {
      if (!email || !looksLikeAnAddress(email)) {
        console.error('Usage: npm run admin:revoke -- <email>');
        return 1;
      }

      const { rows } = await pool.query(
        `update app.staff
            set disabled_at = now()
          where email = $1 and disabled_at is null
      returning email`,
        [email],
      );

      if (rows.length === 0) {
        /* Distinguishing "not there" from "already revoked" matters: the second
           is a no-op the operator can stop worrying about, the first means they
           typed the wrong address and access is still live somewhere. */
        const { rows: existing } = await pool.query(
          'select disabled_at from app.staff where email = $1',
          [email],
        );
        console.log(
          existing.length === 0
            ? `No staff row for ${email}. Nothing changed — check the address with: npm run admin:list`
            : `${email} was already revoked. Nothing changed.`,
        );
        return existing.length === 0 ? 1 : 0;
      }

      console.log(`Revoked admin access for ${rows[0].email}.`);
      console.log('Their existing session stays valid until it expires; end it in the Neon Console to cut it now.');
      return 0;
    }

    console.error(
      'Usage:\n' +
        '  npm run admin:grant  -- <email> ["Full Name"]\n' +
        '  npm run admin:revoke -- <email>\n' +
        '  npm run admin:list',
    );
    return 1;
  } finally {
    await pool.end();
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error('Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
