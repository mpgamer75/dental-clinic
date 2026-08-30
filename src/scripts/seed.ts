/* ============================================================================
   Seed
   ----------------------------------------------------------------------------
   Usage: npm run db:seed
   ----------------------------------------------------------------------------
   Restores the rows that came across from Supabase: two appointment requests and
   one testimonial awaiting review. They exist so that a fresh Neon branch is not
   an empty admin panel — every queue, badge and empty state in the dashboard has
   something to render, and the moderation flow can be exercised without anyone
   filling in a form first.

   Safe to run repeatedly. Each row carries the id it already has in the live
   database and is inserted with ON CONFLICT DO NOTHING, so a second run is a
   no-op against production and produces exactly the same three rows against a
   branch that has never seen them. Generating fresh uuids instead would quietly
   duplicate the set on every invocation.

   The contact details below are the developer's own test submissions carried
   over from the Supabase instance, not a patient's. Nothing here is clinical
   data and nothing in this file should ever become clinical data.
   ========================================================================== */

import { resolve } from 'node:path';

import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';

import {
  appointments,
  siteSettings,
  testimonials,
  type NewAppointment,
  type NewTestimonial,
} from '../lib/schema';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SEED_APPOINTMENTS: NewAppointment[] = [
  {
    id: 'cf672a08-c792-41ee-9254-8c9f91d973dc',
    name: 'Charles Lantigua Jorge',
    email: 'charleslantiguajorge@gmail.com',
    phone: '0767804034',
    serviceType: 'Limpieza Dental Profesional',
    reason: 'Limieza normal',
    isUrgent: false,
    preferredDate: null,
    timePreference: null,
    submittedAt: new Date('2025-05-16T00:55:32.294Z'),
    updatedAt: new Date('2025-05-16T00:55:32.294Z'),
    status: 'pending',
  },
  {
    id: 'f2033eff-6586-4a60-ba5d-b2fe6be8c9f9',
    name: 'Charles Lantigua Jorge',
    email: 'charleslantiguajorge@gmail.com',
    phone: '0767804034',
    serviceType: 'Limpieza Dental Profesional',
    reason: 'Limpieza dental clasica',
    isUrgent: false,
    preferredDate: null,
    timePreference: null,
    submittedAt: new Date('2025-06-12T04:22:07.707Z'),
    updatedAt: new Date('2025-06-12T04:22:07.707Z'),
    status: 'pending',
  },
];

const SEED_TESTIMONIALS: NewTestimonial[] = [
  {
    id: '7c3f7aa0-2866-440d-818c-25b2fd9f9a56',
    name: 'Charles Lantigua Jorge',
    quote: 'Incredible dentist, the best in Santiago',
    location: 'Santiago de los Caballeros',
    /* Null, not a number: this row predates the moderation rewrite, and an
       invented score would misrepresent it as having been assessed. */
    moderationScore: null,
    submittedAt: new Date('2025-06-11T19:26:02.290Z'),
    updatedAt: new Date('2025-06-11T19:26:02.290Z'),
    reviewedAt: null,
    reviewedBy: null,
    status: 'pending_approval',
  },
];

function connectionString(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error(
      'DATABASE_URL is not set. Put the vd_app connection string from the Neon console into ' +
        '.env.local — seeding only writes rows, so the application role is the right one here.',
    );
    process.exit(1);
  }

  return url;
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: connectionString() });
  const db = drizzle({ client: pool });

  try {
    /* 0001_init already inserts this row, but a seed that assumes a migration's
       side effects breaks the moment the two are run in the other order. */
    const settings = await db
      .insert(siteSettings)
      .values({ id: true })
      .onConflictDoNothing({ target: siteSettings.id })
      .returning({ id: siteSettings.id });

    const insertedAppointments = await db
      .insert(appointments)
      .values(SEED_APPOINTMENTS)
      .onConflictDoNothing({ target: appointments.id })
      .returning({ id: appointments.id });

    const insertedTestimonials = await db
      .insert(testimonials)
      .values(SEED_TESTIMONIALS)
      .onConflictDoNothing({ target: testimonials.id })
      .returning({ id: testimonials.id });

    console.log(
      `Seed complete: ${insertedAppointments.length}/${SEED_APPOINTMENTS.length} appointments, ` +
        `${insertedTestimonials.length}/${SEED_TESTIMONIALS.length} testimonials, ` +
        `${settings.length}/1 settings row inserted. ` +
        'Anything not counted was already present and was left untouched.',
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
