/* ============================================================================
   DATABASE SCHEMA — the single source of truth for row shapes
   ----------------------------------------------------------------------------
   Mirrors migrations/0001_init.sql, CHECK constraints included. The constraints
   are restated here rather than left implicit because of exactly the failure the
   old schema shipped: `status` was unconstrained `text` in Postgres while
   TypeScript declared it as a closed union, so the union was fiction and any
   string could be written. A rule that lives in one of the two places drifts
   from the other; a rule that lives in both fails loudly when it drifts.

   Three `Database` declarations preceded this file — src/lib/types_db.ts, a
   second interface of the same name inside src/lib/types.ts, and the Supabase
   generated types. All three are superseded by the inferred types at the bottom
   of this file. Row shapes come from here and nowhere else.

   Check-constraint names are the ones Postgres itself assigns to an inline
   column constraint (`<table>_<column>_check`). Naming them anything else would
   make `drizzle-kit push` propose dropping and recreating every constraint in a
   database whose shape it already matches.
   ========================================================================== */

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/* ----------------------------------------------------------------------------
   citext — case-insensitive text, used for every email column.

   Drizzle has no built-in for it. Modelling the column as plain `text` would
   compile, but the generated DDL would then disagree with the database and
   `drizzle-kit push` would offer to rewrite a citext column as text — silently
   restoring the bug citext exists to prevent: two enquiries, one address,
   different capitalisation, no match.
   -------------------------------------------------------------------------- */
const citext = customType<{ data: string; driverData: string }>({
  dataType: () => 'citext',
});

export const appSchema = pgSchema('app');
export const auditSchema = pgSchema('audit');

/* ----------------------------------------------------------------------------
   Closed value sets. Exported as `as const` tuples so a Zod enum, a `<select>`,
   and the CHECK constraint below are all built from one list instead of three
   hand-copied ones.
   -------------------------------------------------------------------------- */
export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const TIME_PREFERENCES = ['morning', 'afternoon', 'any'] as const;
export type TimePreference = (typeof TIME_PREFERENCES)[number];

export const CONTACT_MESSAGE_STATUSES = ['unread', 'read', 'archived'] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export const TESTIMONIAL_STATUSES = ['pending_approval', 'approved', 'rejected'] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

/** Renders a value set into a CHECK body as `'a', 'b', 'c'`, so the list and the
    constraint cannot be edited independently of one another. */
function sqlValueList(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value}'`).join(', '));
}

/* ============================================================================
   app.appointments
   ========================================================================== */
export const appointments = appSchema.table(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: citext('email').notNull(),
    phone: text('phone'),
    serviceType: text('service_type').notNull(),
    reason: text('reason').notNull(),
    isUrgent: boolean('is_urgent').notNull().default(false),

    /* `date`, and in string mode, for the same reason the form carries a plain
       `YYYY-MM-DD` string end to end: a JS Date round-tripped through UTC lands
       a day early everywhere west of Greenwich, and Santiago is UTC-4. A patient
       who asks for Tuesday must not be booked for Monday. */
    preferredDate: date('preferred_date'),
    timePreference: text('time_preference').$type<TimePreference>(),

    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status').$type<AppointmentStatus>().notNull().default('pending'),
  },
  (t) => [
    index('appointments_queue_idx').on(t.isUrgent.desc(), t.submittedAt.desc()),
    index('appointments_status_idx').on(t.status, t.submittedAt.desc()),
    index('appointments_preferred_date_idx')
      .on(t.preferredDate)
      .where(sql`${t.preferredDate} IS NOT NULL`),

    check('appointments_name_check', sql`length(${t.name}) BETWEEN 2 AND 100`),
    check('appointments_email_check', sql`length(${t.email}) <= 255`),
    check('appointments_phone_check', sql`${t.phone} IS NULL OR length(${t.phone}) <= 40`),
    check('appointments_service_type_check', sql`length(${t.serviceType}) <= 120`),
    check('appointments_reason_check', sql`length(${t.reason}) BETWEEN 10 AND 500`),
    check(
      'appointments_time_preference_check',
      sql`${t.timePreference} IN (${sqlValueList(TIME_PREFERENCES)})`,
    ),
    check('appointments_status_check', sql`${t.status} IN (${sqlValueList(APPOINTMENT_STATUSES)})`),
  ],
);

/* ============================================================================
   app.contact_messages
   ========================================================================== */
export const contactMessages = appSchema.table(
  'contact_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: citext('email').notNull(),
    phone: text('phone'),
    message: text('message').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status').$type<ContactMessageStatus>().notNull().default('unread'),
  },
  (t) => [
    index('contact_messages_status_idx').on(t.status, t.submittedAt.desc()),

    check('contact_messages_name_check', sql`length(${t.name}) BETWEEN 2 AND 100`),
    check('contact_messages_email_check', sql`length(${t.email}) <= 255`),
    check('contact_messages_phone_check', sql`${t.phone} IS NULL OR length(${t.phone}) <= 40`),
    check('contact_messages_message_check', sql`length(${t.message}) BETWEEN 10 AND 1000`),
    check(
      'contact_messages_status_check',
      sql`${t.status} IN (${sqlValueList(CONTACT_MESSAGE_STATUSES)})`,
    ),
  ],
);

/* ============================================================================
   app.testimonials
   ----------------------------------------------------------------------------
   There is no auto-approve path. `moderationScore` orders the review queue; it
   does not open the gate. The rule it replaces published anything scoring >= 85
   straight onto a medical practice's homepage, scored by a literal blocklist
   that never looked at `location` at all.
   ========================================================================== */
export const testimonials = appSchema.table(
  'testimonials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    quote: text('quote').notNull(),
    location: text('location'),
    moderationScore: smallint('moderation_score'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: text('reviewed_by'),
    status: text('status').$type<TestimonialStatus>().notNull().default('pending_approval'),
  },
  (t) => [
    index('testimonials_public_idx')
      .on(t.submittedAt.desc())
      .where(sql`${t.status} = 'approved'`),
    index('testimonials_queue_idx')
      .on(t.moderationScore.asc().nullsFirst(), t.submittedAt.desc())
      .where(sql`${t.status} = 'pending_approval'`),

    check('testimonials_name_check', sql`length(${t.name}) BETWEEN 2 AND 100`),
    check('testimonials_quote_check', sql`length(${t.quote}) BETWEEN 10 AND 1000`),
    check('testimonials_location_check', sql`${t.location} IS NULL OR length(${t.location}) <= 120`),
    check('testimonials_moderation_score_check', sql`${t.moderationScore} BETWEEN 0 AND 100`),
    check('testimonials_status_check', sql`${t.status} IN (${sqlValueList(TESTIMONIAL_STATUSES)})`),
  ],
);

/* ============================================================================
   app.site_settings
   ----------------------------------------------------------------------------
   One row, forever: `id` is a boolean pinned to true. This is configuration, not
   a collection, and a table that can hold two rows eventually holds two rows —
   at which point "which one is live?" has no answer.
   ========================================================================== */
export const siteSettings = appSchema.table(
  'site_settings',
  {
    id: boolean('id').primaryKey().default(true),
    maintenanceMode: boolean('maintenance_mode').notNull().default(false),
    allowAppointments: boolean('allow_appointments').notNull().default(true),
    allowTestimonials: boolean('allow_testimonials').notNull().default(true),
    allowContactForm: boolean('allow_contact_form').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text('updated_by'),
  },
  (t) => [check('site_settings_id_check', sql`${t.id}`)],
);

/** The primary key of the one settings row, named so a query reads
    `eq(siteSettings.id, SITE_SETTINGS_ID)` rather than a bare `true`. */
export const SITE_SETTINGS_ID = true;

/* ============================================================================
   app.staff — the authorization boundary
   ----------------------------------------------------------------------------
   A Neon Auth session answers "who are you". A row here answers "may you see
   the patient book". Those are different questions, and for a while this
   project only asked the first: the Supabase panel gated on an `admin_users`
   row, the rewrite dropped that check, and every account in the auth project
   silently became an administrator.

   Matched by EMAIL rather than by the auth service's user id, because the id
   does not exist until first sign-in and access has to be grantable before
   then. `citext` makes the match case-insensitive.

   This is only safe while src/app/api/auth/[...path]/route.ts refuses to proxy
   sign-up. If anyone could self-register they could register a staff address
   and inherit its access. The two halves hold each other up.
   ========================================================================== */
export const staff = appSchema.table(
  'staff',
  {
    email: citext('email').primaryKey(),
    name: text('name'),
    /* Recorded on first sign-in so the audit log can address the account rather
       than the address. Never consulted when deciding access — it is null until
       that first sign-in, and access must work before it. */
    userId: text('user_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /* Revocation without deletion: dropping the row would erase the record that
       this person ever had access, which is the opposite of what an audit trail
       is for. The app role has no DELETE on this table. */
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
  },
  (t) => [check('staff_email_check', sql`position('@' in ${t.email}) > 1`)],
);

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

/* ============================================================================
   app.rate_limits
   ----------------------------------------------------------------------------
   Fixed-window counters for the public forms and for admin login. `bucket` is a
   caller-built key such as `appointment:<ip-hash>`; the address is hashed with a
   server secret before it arrives, because a raw IP is personal data and this
   table has no business holding one. See src/lib/rate-limit.ts.
   ========================================================================== */
export const rateLimits = appSchema.table(
  'rate_limits',
  {
    bucket: text('bucket').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    hits: integer('hits').notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.bucket, t.windowStart] }),
    index('rate_limits_window_idx').on(t.windowStart),
    check('rate_limits_hits_check', sql`${t.hits} >= 0`),
  ],
);

/* ============================================================================
   audit.audit_log
   ----------------------------------------------------------------------------
   Append-only by grant, not by convention: vd_app holds INSERT and SELECT here
   and nothing else, so a stolen application credential can add to the record of
   what it did but cannot edit or erase it. That is the entire reason the table
   lives in a schema of its own. See migrations/0002_app_role.sql.
   ========================================================================== */

/** Snapshot of a row before or after a change. `jsonb`, so the shape of an
    audited row can change without a migration. */
export type AuditSnapshot = Record<string, unknown>;

export const auditLog = auditSchema.table(
  'audit_log',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    actorId: text('actor_id'),
    actorEmail: citext('actor_email'),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before').$type<AuditSnapshot>(),
    after: jsonb('after').$type<AuditSnapshot>(),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_log_entity_idx').on(t.entity, t.entityId, t.createdAt.desc()),
    index('audit_log_created_idx').on(t.createdAt.desc()),
  ],
);

/* ============================================================================
   Inferred row types
   ----------------------------------------------------------------------------
   `Select` is what a query returns; `Insert` is what a write accepts, with the
   defaulted and generated columns already optional. Nothing in the app should
   hand-write either shape.
   ========================================================================== */
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;

export type SiteSettings = typeof siteSettings.$inferSelect;
export type NewSiteSettings = typeof siteSettings.$inferInsert;

export type RateLimitRow = typeof rateLimits.$inferSelect;
export type NewRateLimitRow = typeof rateLimits.$inferInsert;

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
