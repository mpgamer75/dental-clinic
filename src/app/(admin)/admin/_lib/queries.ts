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
  type TimePreference,
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
  /* Whether this row came from `npm run db:demo:seed`.
     Carried all the way to the table so a sample row can be badged: the
     name in these lists is what somebody is about to dial, and a seeded
     row that looks like a patient is the one way this data set can cause
     real harm. */
  isDemo: boolean;
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
    isDemo: row.isDemo,
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
  /* See the note on AppointmentRow.isDemo — a seeded row that looks like a
     patient is the one way this data set can cause real harm. */
  isDemo: boolean;
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
        isDemo: row.isDemo,
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
  /* See the note on AppointmentRow.isDemo — a seeded row that looks like a
     patient is the one way this data set can cause real harm. */
  isDemo: boolean;
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
        isDemo: row.isDemo,
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
    /* The timezone is INLINED, not bound.
     *
     * Written as `${CLINIC_TIME_ZONE}` this renders a bind parameter, and the
     * fragment is used twice — once in the SELECT inside `to_char`, once in the
     * GROUP BY. Drizzle numbers those as two different placeholders, so
     * Postgres compares `to_char(… $1 …)` against `GROUP BY … $2 …`, cannot see
     * the first as a function of the second, and rejects the whole query with
     * SQLSTATE 42803 (grouping_error). The chart rendered its error state on
     * every load.
     *
     * `sql.raw` is safe here and only here: the value is a module constant, not
     * request data. The assertion below is what keeps that true — it fails the
     * build-time path immediately if anyone ever points this at something
     * user-supplied or quote-bearing. */
    if (!/^[A-Za-z][A-Za-z0-9_+/-]*$/.test(CLINIC_TIME_ZONE)) {
      throw new Error(`CLINIC_TIME_ZONE is not a bare IANA identifier: ${CLINIC_TIME_ZONE}`);
    }
    const zone = sql.raw(`'${CLINIC_TIME_ZONE}'`);
    const clinicDay = sql`((${appointments.submittedAt} at time zone ${zone})::date)`;
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

/* ============================================================================
   Analytics — the bucket list belongs to the query, not to the data
   ----------------------------------------------------------------------------
   A GROUP BY returns the categories that OCCURRED. A chart axis needs the
   categories that EXIST, and those are different lists. A month in which the
   clinic cancelled nothing returns no 'cancelled' row, so the funnel quietly
   redraws with three bars instead of four, every series shifts one colour along
   and the reader sees a change in the shape of the practice where there was
   only a change in the shape of the result set.

   So each aggregate below is a single row of `count(*) FILTER (WHERE …)` rather
   than a set of grouped counts. An aggregate with no GROUP BY returns exactly
   one row even over a table with nothing in it, which makes "every bucket is
   present and an absent category reads as a real zero" a property of the SQL
   instead of a fill loop that a later edit can forget. It is also one pass over
   the table per chart rather than one per bucket, and it keeps the promise made
   at the top of this file: the aggregation happens in Postgres, and only the
   handful of numbers a chart draws crosses the wire.

   `::int` on every count for the reason spelled out on `getDashboardCounts`:
   the driver returns bigint as a STRING, and a string survives `+` as
   concatenation rather than failing, so an uncast total renders correctly and
   computes a percentage of "0123".

   None of these exclude demo rows. That is deliberate — demo rows exist so
   these charts have a shape to draw, and hiding them here would leave the panel
   looking broken in exactly the situation the seed was run to fix. What the
   dashboard owes the reader instead is a visible notice that it is showing
   fabricated data; `getDemoDataPresence` below answers that.
   ========================================================================== */

/**
 * One column, slice or bar.
 *
 * `key` is stable and machine-readable; `label` is Spanish and for humans. They
 * are separate so a chart can key its colours and its React children off
 * something that does not move when the copy is reworded — otherwise renaming
 * "Pendientes" recolours the series and breaks the reconciliation of the
 * element it is drawn with.
 */
export interface ChartBucket<TKey extends string = string> {
  key: TKey;
  label: string;
  total: number;
}

/** `count(*) FILTER (WHERE <match>)`, cast to a real number. */
function bucketCount(match: SQL): SQL<number> {
  return sql<number>`count(*) filter (where ${match})::int`;
}

/* ----------------------------------------------------------------------------
   Appointment status funnel
   -------------------------------------------------------------------------- */

export type FunnelStage = ChartBucket<AppointmentStatus>;

/**
 * How many requests are sitting at each stage of the workflow.
 *
 * Ordered the way the work actually flows — pending, then confirmed, then
 * completed — and NOT by size. Sorted by count this is a bar chart of four
 * unrelated numbers; in workflow order the same four numbers answer "where do
 * requests stop moving?", which is the question the clinic has. `cancelled`
 * comes last because it is an exit from the funnel rather than a step along it,
 * and a reader who sees it between 'confirmed' and 'completed' will read it as
 * one.
 */
export function getAppointmentFunnel(): Promise<QueryOutcome<FunnelStage[]>> {
  return runQuery('appointment funnel', async () => {
    const atStatus = (status: AppointmentStatus) =>
      bucketCount(sql`${appointments.status} = ${status}`);

    const [row] = await db
      .select({
        pending: atStatus('pending'),
        confirmed: atStatus('confirmed'),
        completed: atStatus('completed'),
        cancelled: atStatus('cancelled'),
      })
      .from(appointments);

    /* The `?? 0` is unreachable — an ungrouped aggregate always yields a row —
       but writing it keeps the function total, so a future `.where()` that
       filters everything out degrades to zeros rather than to `undefined`
       reaching a chart as NaN. */
    return [
      { key: 'pending', label: 'Pendientes', total: row?.pending ?? 0 },
      { key: 'confirmed', label: 'Confirmadas', total: row?.confirmed ?? 0 },
      { key: 'completed', label: 'Completadas', total: row?.completed ?? 0 },
      { key: 'cancelled', label: 'Canceladas', total: row?.cancelled ?? 0 },
    ] satisfies FunnelStage[];
  });
}

/* ----------------------------------------------------------------------------
   Time-of-day preference
   -------------------------------------------------------------------------- */

export type TimePreferenceKey = TimePreference | 'unstated';
export type TimePreferenceSlice = ChartBucket<TimePreferenceKey>;

/**
 * What half of the day patients ask for, for staffing the rota.
 *
 * "Sin indicar" is its own slice and is never folded into "Cualquiera". They
 * look alike and mean opposite things: a patient who chose "cualquier hora"
 * has told the clinic they are flexible, a patient who left the optional field
 * empty has told it nothing. Merging them turns silence into consent and
 * overstates how much of the afternoon the clinic can fill — the one decision
 * this chart is actually used for.
 *
 * The labels are written here rather than taken from
 * `appointmentBooking.es.reasonPrefix.times`, which holds "por la mañana" and
 * "cualquier hora": those are sentence fragments the booking action splices
 * into the `reason` text, and they read as broken English on an axis and wrap
 * on a phone.
 */
export function getTimePreferenceSplit(): Promise<QueryOutcome<TimePreferenceSlice[]>> {
  return runQuery('time preference split', async () => {
    const prefers = (value: TimePreference) =>
      bucketCount(sql`${appointments.timePreference} = ${value}`);

    const [row] = await db
      .select({
        morning: prefers('morning'),
        afternoon: prefers('afternoon'),
        any: prefers('any'),
        /* `IS NULL`, not `= null`. The column is nullable by design — the field
           is optional on the form — and an equality test against NULL is NULL,
           which a FILTER treats as false, so this bucket would always be 0 and
           the four slices would not add up to the number of appointments. */
        unstated: bucketCount(sql`${appointments.timePreference} is null`),
      })
      .from(appointments);

    return [
      { key: 'morning', label: 'Mañana', total: row?.morning ?? 0 },
      { key: 'afternoon', label: 'Tarde', total: row?.afternoon ?? 0 },
      { key: 'any', label: 'Cualquiera', total: row?.any ?? 0 },
      { key: 'unstated', label: 'Sin indicar', total: row?.unstated ?? 0 },
    ] satisfies TimePreferenceSlice[];
  });
}

/* ----------------------------------------------------------------------------
   How long pending requests have been waiting
   -------------------------------------------------------------------------- */

export type WaitBucketKey = 'under24h' | 'days1to3' | 'days4to7' | 'over7d';

export interface WaitBucket extends ChartBucket<WaitBucketKey> {
  /** How many of `total` are flagged urgent. */
  urgent: number;
}

/**
 * The age of the backlog: pending requests grouped by how long they have gone
 * unanswered, with the urgent ones counted separately inside each bucket.
 *
 * This is the most operationally useful chart on the page, and the `urgent`
 * column is the reason. The headline count of pending appointments says a
 * number; it cannot say that one of them is a patient who wrote "llevo dos
 * noches con un dolor punzante" nine days ago and has been pushed off the first
 * page by eleven routine enquiries since. A bar in "más de 7 días" with urgent
 * shaded inside it says exactly that, and it is the failure this whole panel
 * was rebuilt to stop.
 *
 * The boundaries partition the line with no gap and no overlap — [0,1), [1,4),
 * [4,8), [8,∞) days — so the four buckets always sum to the pending total. The
 * first bucket is written as a bare `< interval '1 day'` rather than
 * `BETWEEN 0 AND 1` so that a row whose `submitted_at` is slightly in the
 * future, which clock skew between the app server and Neon can produce, still
 * lands somewhere instead of vanishing from a chart that claims to be complete.
 *
 * `now()` is evaluated by Postgres, once, for all four filters. Passing a
 * JavaScript timestamp instead would put the app server's clock in charge of
 * the boundaries and let two of them be computed either side of a tick.
 */
export function getPendingWaitBuckets(): Promise<QueryOutcome<WaitBucket[]>> {
  return runQuery('pending wait buckets', async () => {
    const waited = sql`(now() - ${appointments.submittedAt})`;

    const within = (lower: SQL | null, upper: SQL | null): SQL => {
      if (lower === null) return sql`${waited} < ${upper}`;
      if (upper === null) return sql`${waited} >= ${lower}`;
      return sql`${waited} >= ${lower} and ${waited} < ${upper}`;
    };

    const oneDay = sql`interval '1 day'`;
    const fourDays = sql`interval '4 days'`;
    const eightDays = sql`interval '8 days'`;

    const urgentIn = (match: SQL) => bucketCount(sql`${appointments.isUrgent} and ${match}`);

    const under24h = within(null, oneDay);
    const days1to3 = within(oneDay, fourDays);
    const days4to7 = within(fourDays, eightDays);
    const over7d = within(eightDays, null);

    const [row] = await db
      .select({
        under24hTotal: bucketCount(under24h),
        under24hUrgent: urgentIn(under24h),
        days1to3Total: bucketCount(days1to3),
        days1to3Urgent: urgentIn(days1to3),
        days4to7Total: bucketCount(days4to7),
        days4to7Urgent: urgentIn(days4to7),
        over7dTotal: bucketCount(over7d),
        over7dUrgent: urgentIn(over7d),
      })
      .from(appointments)
      /* Only what is still waiting. A confirmed or completed request has an
         answer, so its age is history rather than backlog, and including it
         would bury the four or five rows this chart exists to make visible
         under three months of resolved ones. */
      .where(eq(appointments.status, 'pending'));

    return [
      {
        key: 'under24h',
        label: 'Menos de 24 h',
        total: row?.under24hTotal ?? 0,
        urgent: row?.under24hUrgent ?? 0,
      },
      {
        key: 'days1to3',
        label: '1 a 3 días',
        total: row?.days1to3Total ?? 0,
        urgent: row?.days1to3Urgent ?? 0,
      },
      {
        key: 'days4to7',
        label: '4 a 7 días',
        total: row?.days4to7Total ?? 0,
        urgent: row?.days4to7Urgent ?? 0,
      },
      {
        key: 'over7d',
        label: 'Más de 7 días',
        total: row?.over7dTotal ?? 0,
        urgent: row?.over7dUrgent ?? 0,
      },
    ] satisfies WaitBucket[];
  });
}

/* ----------------------------------------------------------------------------
   Which weekdays generate requests
   -------------------------------------------------------------------------- */

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type WeekdayPoint = ChartBucket<WeekdayKey>;

/**
 * Submissions by day of the week, over the whole history, for staffing.
 *
 * The timezone conversion is the same lesson `getSubmissionTrend` records, and
 * it bites harder here because the error does not average out. `submitted_at`
 * is a `timestamptz`; reading a weekday out of it directly reads it in UTC, and
 * at UTC-4 everything a patient sends after 8pm belongs to the next UTC day —
 * so a fortnight of Sunday-evening toothache reports would land on Monday's
 * bar, and the clinic would staff a Monday morning for a demand that arrives
 * on Sunday night. Converting to clinic time before extracting is what keeps a
 * Tuesday a Tuesday.
 *
 * `isodow` rather than `dow` so the week starts on Monday — the working week as
 * the clinic reads it — instead of putting Sunday in front of it. All seven
 * days are returned in that order; a genuinely empty Saturday is information
 * about a clinic that closes at weekends, and dropping it would slide Sunday's
 * bar into Saturday's place on the axis.
 */
export function getWeekdayDemand(): Promise<QueryOutcome<WeekdayPoint[]>> {
  return runQuery('weekday demand', async () => {
    const clinicWeekday = sql`extract(isodow from (${appointments.submittedAt} at time zone ${CLINIC_TIME_ZONE}))`;
    const onDay = (isoDow: number) => bucketCount(sql`${clinicWeekday} = ${isoDow}`);

    const [row] = await db
      .select({
        mon: onDay(1),
        tue: onDay(2),
        wed: onDay(3),
        thu: onDay(4),
        fri: onDay(5),
        sat: onDay(6),
        sun: onDay(7),
      })
      .from(appointments);

    return [
      { key: 'mon', label: 'Lun', total: row?.mon ?? 0 },
      { key: 'tue', label: 'Mar', total: row?.tue ?? 0 },
      { key: 'wed', label: 'Mié', total: row?.wed ?? 0 },
      { key: 'thu', label: 'Jue', total: row?.thu ?? 0 },
      { key: 'fri', label: 'Vie', total: row?.fri ?? 0 },
      { key: 'sat', label: 'Sáb', total: row?.sat ?? 0 },
      { key: 'sun', label: 'Dom', total: row?.sun ?? 0 },
    ] satisfies WeekdayPoint[];
  });
}

/* ----------------------------------------------------------------------------
   Is the panel showing invented data?
   -------------------------------------------------------------------------- */

export interface DemoDataPresence {
  appointments: number;
  messages: number;
  testimonials: number;
  /** True if anything on the dashboard is fabricated. */
  any: boolean;
}

/**
 * How many rows in each table came from `npm run db:demo:seed`.
 *
 * The charts above are drawn over demo rows and real ones together, which is
 * what makes them legible on a table holding two appointments — and also what
 * makes this query necessary. A receptionist reading "34 citas pendientes" has
 * no way to see that thirty of them were invented by a script, and the concrete
 * failure is one phone call long: a name and an 809 number in the queue, dialled
 * on a Monday morning, belonging to nobody. The panel needs to say so on the
 * page, and this is the number it says it with.
 *
 * Each count is answered from the partial `… WHERE is_demo` index added in
 * migration 0004, so on a purged production database this is three reads of an
 * empty index rather than three scans of an appointment book that only grows.
 */
export function getDemoDataPresence(): Promise<QueryOutcome<DemoDataPresence>> {
  return runQuery('demo data presence', async () => {
    const [[appointmentRow], [messageRow], [testimonialRow]] = await Promise.all([
      db.select({ total: bucketCount(sql`${appointments.isDemo}`) }).from(appointments),
      db.select({ total: bucketCount(sql`${contactMessages.isDemo}`) }).from(contactMessages),
      db.select({ total: bucketCount(sql`${testimonials.isDemo}`) }).from(testimonials),
    ]);

    const counts = {
      appointments: appointmentRow?.total ?? 0,
      messages: messageRow?.total ?? 0,
      testimonials: testimonialRow?.total ?? 0,
    };

    return { ...counts, any: counts.appointments + counts.messages + counts.testimonials > 0 };
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
