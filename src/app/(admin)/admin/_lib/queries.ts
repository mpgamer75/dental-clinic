/* ============================================================================
   ADMIN READS — Drizzle, on the server, one page at a time
   ----------------------------------------------------------------------------
   The panel this replaces held a database credential in the browser and issued
   its own SELECTs from a client component; row-level security was the only
   thing between a visitor's devtools and the whole appointment book, and RLS is
   gone with Supabase. Every read now happens here, behind a session check the
   browser cannot influence, and only the rows a page actually renders cross the
   wire.

   Two rules this module exists to enforce:

   * A COUNT IS A COUNT. Every list returns `{ rows, total }` where `total`
     comes from `count(*)` over the same predicate, never from `rows.length`.
     The old dashboard read ten rows with a hard `.limit(10)` and captioned them
     "de 45 totales" — a number that was true of the table and false of the list
     underneath it, which is how eleven routine submissions came to hide an
     urgent one.

   * A FAILED READ IS NOT AN EMPTY TABLE. Every function returns a
     `QueryOutcome`, so a page cannot render zero rows without having decided
     what to do about the difference between "nothing to show" and "we could not
     look". The previous version dropped every error object on the floor and
     drew a confident grid of zeros whenever the database was unreachable — for
     a clinic, "no pending appointments" when the truth is "we cannot see your
     appointments" is the worst of the two lies.

   Rows leave here as view models with their dates already formatted (see
   format.ts). The client islands receive strings and render them; they do no
   date maths, so there is nothing in them that can disagree with the server.
   ========================================================================== */

import 'server-only';

import { cache } from 'react';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  or,
  sql,
  type Column,
  type SQL,
} from 'drizzle-orm';

import { appointmentBooking } from '@/lib/data';
import { db } from '@/lib/db';
import { formatDatabaseFailure } from '@/lib/db-errors';
import {
  appointments,
  contactMessages,
  siteSettings,
  testimonials,
  SITE_SETTINGS_ID,
  type AppointmentStatus,
  type ContactMessageStatus,
  type SiteSettings,
  type TestimonialStatus,
} from '@/lib/schema';

import {
  CLINIC_TIME_ZONE,
  daysWaiting,
  formatCalendarDate,
  formatDateTime,
  formatShortDay,
  formatWaitedFor,
} from './format';
import {
  PAGE_SIZE,
  type AppointmentSort,
  type MessageSort,
  type TestimonialSort,
} from './list-params';

/* ============================================================================
   Outcome
   ========================================================================== */

export type QueryOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; detail: string };

/**
 * Run a read and reduce any failure to a loggable, non-identifying string.
 *
 * `formatDatabaseFailure` rather than the error itself, always: Drizzle exposes
 * the bound values as an own `params` key and inlines them in its message, so
 * `console.error('...', error)` on a query filtered by a patient's email prints
 * that email into a log this project does not own.
 */
async function runQuery<T>(label: string, run: () => Promise<T>): Promise<QueryOutcome<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    const detail = formatDatabaseFailure(error);
    console.error('[admin] %s failed: %s', label, detail);
    return { ok: false, detail };
  }
}

/* ============================================================================
   Search
   ========================================================================== */

/**
 * A case-insensitive "contains" across the given columns.
 *
 * The wildcards are escaped. Without that, a receptionist searching for a
 * literal "100%" matches every row in the table, and `_` — which is in plenty
 * of email addresses — quietly matches any single character. Postgres treats
 * backslash as LIKE's escape character by default, and the value travels as a
 * bind parameter, so the doubling here is the whole fix.
 */
function searchClause(term: string, columns: readonly Column[]): SQL | undefined {
  const trimmed = term.trim();
  if (!trimmed) return undefined;

  const pattern = `%${trimmed.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
  return or(...columns.map((column) => ilike(column, pattern)));
}

/** `and(...)` of the clauses that are actually present. Drizzle accepts
 *  `undefined` members but an all-undefined `and()` produces `()`, which is a
 *  syntax error rather than "no filter". */
function combine(...clauses: (SQL | undefined)[]): SQL | undefined {
  const present = clauses.filter((clause): clause is SQL => clause !== undefined);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return and(...present);
}

/* ============================================================================
   Appointments
   ========================================================================== */

export interface AppointmentRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  serviceType: string;
  reason: string;
  isUrgent: boolean;
  status: AppointmentStatus;
  /** Machine-readable, for `<time dateTime>`. */
  submittedAtIso: string;
  submittedAtLabel: string;
  waitedLabel: string;
  daysWaiting: number;
  preferredDateLabel: string | null;
  timePreferenceLabel: string | null;
}

export interface ListPage<T> {
  rows: T[];
  /** `count(*)` over the same predicate — the number the pager and the caption
   *  are both allowed to use. */
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQuery<TStatus extends string, TSort extends string> {
  page: number;
  search: string;
  status: TStatus | null;
  sort: TSort;
}

const timeLabels = appointmentBooking.es.reasonPrefix.times;

function toAppointmentRow(row: typeof appointments.$inferSelect, now: number): AppointmentRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    serviceType: row.serviceType,
    reason: row.reason,
    isUrgent: row.isUrgent,
    status: row.status,
    submittedAtIso: row.submittedAt.toISOString(),
    submittedAtLabel: formatDateTime(row.submittedAt),
    waitedLabel: formatWaitedFor(row.submittedAt, now),
    daysWaiting: daysWaiting(row.submittedAt, now),
    preferredDateLabel: formatCalendarDate(row.preferredDate),
    timePreferenceLabel: row.timePreference ? timeLabels[row.timePreference] : null,
  };
}

/**
 * The queue order.
 *
 * Urgent first, then whoever has waited longest. This is the single most
 * important ordering in the application: the panel it replaces sorted by
 * `submitted_at` alone and cut the list at ten, so eleven routine submissions
 * buried an urgent one on a page nobody would think to open.
 *
 * A note on `appointments_queue_idx`, which is `(is_urgent DESC, submitted_at
 * DESC)`. Its leading column matches, so Postgres can take the urgent group
 * from the index and sort only within it. The second column deliberately does
 * not match: the index reads newest-first and this reads oldest-first, because
 * the person the clinic needs to call is the one who has been waiting since
 * Tuesday, not the one who wrote in this morning. Flipping that column to ASC
 * in the next migration would let the whole ordering come off the index.
 */
function appointmentOrder(sort: AppointmentSort) {
  switch (sort) {
    case 'recientes':
      return [desc(appointments.submittedAt)];
    case 'antiguos':
      return [asc(appointments.submittedAt)];
    case 'cola':
    default:
      return [desc(appointments.isUrgent), asc(appointments.submittedAt)];
  }
}

export function listAppointments(
  query: ListQuery<AppointmentStatus, AppointmentSort>,
): Promise<QueryOutcome<ListPage<AppointmentRow>>> {
  return runQuery('appointment list', async () => {
    const where = combine(
      query.status ? eq(appointments.status, query.status) : undefined,
      searchClause(query.search, [
        appointments.name,
        appointments.email,
        appointments.serviceType,
        appointments.phone,
      ]),
    );

    const offset = (query.page - 1) * PAGE_SIZE;

    /* Both statements describe the same predicate and are issued together: the
       page waits for the slower of the two rather than for their sum. */
    const [rows, [totals]] = await Promise.all([
      db
        .select()
        .from(appointments)
        .where(where)
        .orderBy(...appointmentOrder(query.sort))
        .limit(PAGE_SIZE)
        .offset(offset),
      db.select({ value: count() }).from(appointments).where(where),
    ]);

    const now = Date.now();
    return {
      rows: rows.map((row) => toAppointmentRow(row, now)),
      total: totals?.value ?? 0,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  });
}

/* ============================================================================
   Contact messages
   ========================================================================== */

export interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactMessageStatus;
  submittedAtIso: string;
  submittedAtLabel: string;
  waitedLabel: string;
}

export function listMessages(
  query: ListQuery<ContactMessageStatus, MessageSort>,
): Promise<QueryOutcome<ListPage<MessageRow>>> {
  return runQuery('message list', async () => {
    const where = combine(
      query.status ? eq(contactMessages.status, query.status) : undefined,
      searchClause(query.search, [
        contactMessages.name,
        contactMessages.email,
        contactMessages.message,
      ]),
    );

    const order =
      query.sort === 'antiguos'
        ? asc(contactMessages.submittedAt)
        : desc(contactMessages.submittedAt);

    const [rows, [totals]] = await Promise.all([
      db
        .select()
        .from(contactMessages)
        .where(where)
        .orderBy(order)
        .limit(PAGE_SIZE)
        .offset((query.page - 1) * PAGE_SIZE),
      db.select({ value: count() }).from(contactMessages).where(where),
    ]);

    const now = Date.now();
    return {
      rows: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        message: row.message,
        status: row.status,
        submittedAtIso: row.submittedAt.toISOString(),
        submittedAtLabel: formatDateTime(row.submittedAt),
        waitedLabel: formatWaitedFor(row.submittedAt, now),
      })),
      total: totals?.value ?? 0,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  });
}

/* ============================================================================
   Testimonials
   ========================================================================== */

export interface TestimonialRow {
  id: string;
  name: string;
  quote: string;
  location: string | null;
  /** 0–100, or null for a submission that predates the score column. */
  moderationScore: number | null;
  status: TestimonialStatus;
  submittedAtIso: string;
  submittedAtLabel: string;
  waitedLabel: string;
  reviewedAtLabel: string | null;
  reviewedBy: string | null;
}

/**
 * Review order: worst moderation score first, unscored submissions ahead of
 * everything.
 *
 * The score does not decide anything — there is no auto-approve path, and
 * `submitTestimonialForm` writes 'pending_approval' from a literal — it only
 * decides what the reviewer is shown first. NULLS FIRST is deliberate: a row
 * with no score was never assessed at all, which is a stronger reason to look
 * at it than a low one. `testimonials_queue_idx` is
 * `(moderation_score ASC NULLS FIRST, submitted_at DESC)` under a partial
 * predicate on 'pending_approval', which is exactly this.
 */
function testimonialOrder(sort: TestimonialSort) {
  switch (sort) {
    case 'recientes':
      return [desc(testimonials.submittedAt)];
    case 'antiguos':
      return [asc(testimonials.submittedAt)];
    case 'revision':
    default:
      return [
        sql`${testimonials.moderationScore} asc nulls first`,
        desc(testimonials.submittedAt),
      ];
  }
}

export function listTestimonials(
  query: ListQuery<TestimonialStatus, TestimonialSort>,
): Promise<QueryOutcome<ListPage<TestimonialRow>>> {
  return runQuery('testimonial list', async () => {
    const where = combine(
      query.status ? eq(testimonials.status, query.status) : undefined,
      searchClause(query.search, [
        testimonials.name,
        testimonials.quote,
        testimonials.location,
      ]),
    );

    const [rows, [totals]] = await Promise.all([
      db
        .select()
        .from(testimonials)
        .where(where)
        .orderBy(...testimonialOrder(query.sort))
        .limit(PAGE_SIZE)
        .offset((query.page - 1) * PAGE_SIZE),
      db.select({ value: count() }).from(testimonials).where(where),
    ]);

    const now = Date.now();
    return {
      rows: rows.map((row) => ({
        id: row.id,
        name: row.name,
        quote: row.quote,
        location: row.location,
        moderationScore: row.moderationScore,
        status: row.status,
        submittedAtIso: row.submittedAt.toISOString(),
        submittedAtLabel: formatDateTime(row.submittedAt),
        waitedLabel: formatWaitedFor(row.submittedAt, now),
        reviewedAtLabel: row.reviewedAt ? formatDateTime(row.reviewedAt) : null,
        reviewedBy: row.reviewedBy,
      })),
      total: totals?.value ?? 0,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  });
}

/* ============================================================================
   Dashboard
   ========================================================================== */

export interface DashboardCounts {
  appointmentsTotal: number;
  appointmentsPending: number;
  appointmentsUrgentPending: number;
  messagesTotal: number;
  messagesUnread: number;
  testimonialsTotal: number;
  testimonialsPending: number;
  testimonialsApproved: number;
}

/**
 * Every headline number, in three queries rather than nine.
 *
 * `count(*) FILTER (WHERE …)` computes each table's totals in one pass over one
 * index, which is both faster and — more importantly — atomic per table: the
 * old version issued a separate `head: true` count per card, so a submission
 * arriving mid-request could be inside one number and outside the next, and the
 * cards contradicted each other with no way to tell which was right.
 *
 * The `::int` casts matter. Postgres returns `count(*)` as bigint, which the
 * driver hands back as a STRING to avoid losing precision beyond 2^53 — and a
 * string flows through `??` and template literals without complaint, so the
 * cards would render "12" correctly and any arithmetic on them silently
 * concatenate.
 */
export function getDashboardCounts(): Promise<QueryOutcome<DashboardCounts>> {
  return runQuery('dashboard counts', async () => {
    const [[appointmentTotals], [messageTotals], [testimonialTotals]] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          pending: sql<number>`count(*) filter (where ${appointments.status} = 'pending')::int`,
          urgentPending: sql<number>`count(*) filter (where ${appointments.isUrgent} and ${appointments.status} = 'pending')::int`,
        })
        .from(appointments),
      db
        .select({
          total: sql<number>`count(*)::int`,
          unread: sql<number>`count(*) filter (where ${contactMessages.status} = 'unread')::int`,
        })
        .from(contactMessages),
      db
        .select({
          total: sql<number>`count(*)::int`,
          pending: sql<number>`count(*) filter (where ${testimonials.status} = 'pending_approval')::int`,
          approved: sql<number>`count(*) filter (where ${testimonials.status} = 'approved')::int`,
        })
        .from(testimonials),
    ]);

    return {
      appointmentsTotal: appointmentTotals?.total ?? 0,
      appointmentsPending: appointmentTotals?.pending ?? 0,
      appointmentsUrgentPending: appointmentTotals?.urgentPending ?? 0,
      messagesTotal: messageTotals?.total ?? 0,
      messagesUnread: messageTotals?.unread ?? 0,
      testimonialsTotal: testimonialTotals?.total ?? 0,
      testimonialsPending: testimonialTotals?.pending ?? 0,
      testimonialsApproved: testimonialTotals?.approved ?? 0,
    };
  });
}

/**
 * The same counts, deduplicated within a single request.
 *
 * The layout needs them for the navigation badges and the dashboard needs them
 * for its cards. Without `cache` that is two identical round trips on the one
 * page where both render, and — worse — two answers that can disagree if a form
 * is submitted between them, so the sidebar would say 4 while the card beside
 * it says 3. React's per-request cache makes them the same three queries and
 * therefore the same numbers.
 */
export const getCachedDashboardCounts = cache(getDashboardCounts);

export interface TrendPoint {
  /** `YYYY-MM-DD` in clinic time. */
  day: string;
  label: string;
  total: number;
  urgent: number;
}

/** Two weeks: long enough to show a pattern, short enough to read on a phone. */
const TREND_DAYS = 14;

/**
 * Submissions per day, bucketed in the clinic's own timezone.
 *
 * The grouping expression converts before truncating. Bucketing on the raw
 * `timestamptz` groups by UTC day, and at UTC-4 that puts everything submitted
 * after 8pm — the end of a working day, when a patient in pain finally sits
 * down to write — onto tomorrow's bar. The chart this replaces did exactly
 * that, then labelled the buckets in local time, so the columns and their names
 * disagreed by one day.
 *
 * Days with no submissions do not come back from a GROUP BY, so the series is
 * filled in below. A chart that silently omits its empty days compresses a
 * quiet fortnight into three bars and reads as steady traffic.
 */
export function getSubmissionTrend(): Promise<QueryOutcome<TrendPoint[]>> {
  return runQuery('submission trend', async () => {
    const clinicDay = sql`((${appointments.submittedAt} at time zone ${CLINIC_TIME_ZONE})::date)`;
    const since = new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000);

    const rows = await db
      .select({
        day: sql<string>`to_char(${clinicDay}, 'YYYY-MM-DD')`,
        total: sql<number>`count(*)::int`,
        urgent: sql<number>`count(*) filter (where ${appointments.isUrgent})::int`,
      })
      .from(appointments)
      .where(gte(appointments.submittedAt, since))
      .groupBy(clinicDay);

    const counted = new Map(rows.map((row) => [row.day, row]));

    /* The axis is built from the CLINIC's calendar, not the server's. On Vercel
       the server runs in UTC, so between 8pm and midnight in Santiago the last
       bar would be tomorrow's — an empty column at the end of the chart every
       evening.

       `en-CA` is used purely because its short date format is ISO `YYYY-MM-DD`,
       which is the same key the SQL `to_char` above produces. Reading the parts
       out of a formatter avoids `new Date(someLocaleString)`, which relies on
       the engine's lenient parser and is only accidentally correct. */
    const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
      timeZone: CLINIC_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .split('-')
      .map(Number);

    /* Anchored at UTC NOON, and that is the whole trick: the resulting instant
       falls on the same calendar day in every zone from UTC-11 to UTC+12, so
       `formatShortDay` — which formats in clinic time — can never label a bucket
       with the day before or after the one it counts. */
    const anchor = Date.UTC(year, month - 1, day, 12);
    const DAY_MS = 86_400_000;

    const series: TrendPoint[] = [];
    for (let offset = TREND_DAYS - 1; offset >= 0; offset--) {
      const date = new Date(anchor - offset * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      const found = counted.get(key);
      series.push({
        day: key,
        label: formatShortDay(date),
        total: found?.total ?? 0,
        urgent: found?.urgent ?? 0,
      });
    }

    return series;
  });
}

export interface ServiceDemand {
  service: string;
  total: number;
}

/** The five services patients ask for most, over the whole table — not over
 *  whatever happened to be on the first page. */
export function getServiceDemand(): Promise<QueryOutcome<ServiceDemand[]>> {
  return runQuery('service demand', async () => {
    const rows = await db
      .select({
        service: appointments.serviceType,
        total: sql<number>`count(*)::int`,
      })
      .from(appointments)
      .groupBy(appointments.serviceType)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return rows;
  });
}

/**
 * The oldest requests still waiting for an answer, urgent first.
 *
 * This is the dashboard's reason to exist. It is deliberately not "the ten most
 * recent": recency is what buried the emergency.
 */
export function getAttentionQueue(limit = 6): Promise<QueryOutcome<AppointmentRow[]>> {
  return runQuery('attention queue', async () => {
    const rows = await db
      .select()
      .from(appointments)
      .where(eq(appointments.status, 'pending'))
      /* The same ordering the list page defaults to, from the same function:
         the dashboard's top six and the first six rows of
         /admin/appointments?estado=pending must be the same six, or the panel
         has two disagreeing opinions about what is urgent. */
      .orderBy(...appointmentOrder('cola'))
      .limit(limit);

    const now = Date.now();
    return rows.map((row) => toAppointmentRow(row, now));
  });
}

/* ============================================================================
   Site settings
   ========================================================================== */

export interface SiteSettingsView {
  maintenanceMode: boolean;
  allowAppointments: boolean;
  allowTestimonials: boolean;
  allowContactForm: boolean;
  updatedAtLabel: string;
  updatedBy: string | null;
}

export function toSettingsView(row: SiteSettings): SiteSettingsView {
  return {
    maintenanceMode: row.maintenanceMode,
    allowAppointments: row.allowAppointments,
    allowTestimonials: row.allowTestimonials,
    allowContactForm: row.allowContactForm,
    updatedAtLabel: formatDateTime(row.updatedAt),
    updatedBy: row.updatedBy,
  };
}

/**
 * The one settings row.
 *
 * Migration 0001 inserts it, so its absence means the migration has not been
 * applied to this database — a configuration fault, not an empty state, and one
 * the panel should name rather than paper over with defaults that would tell
 * the clinic its forms are open when nothing has ever read the flags.
 */
export function getSiteSettings(): Promise<QueryOutcome<SiteSettingsView>> {
  return runQuery('site settings', async () => {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, SITE_SETTINGS_ID))
      .limit(1);

    if (!row) {
      throw new Error(
        'app.site_settings holds no row. migrations/0001_init.sql seeds it; apply the ' +
          'migrations against this database.',
      );
    }

    return toSettingsView(row);
  });
}
