/* ============================================================================
   Fixed-window rate limiting
   ----------------------------------------------------------------------------
   There was none before this. The clinic's only intake channel — three public
   forms writing straight to the appointment book — could be filled by a `for`
   loop, and the admin login accepted guesses at whatever rate the network
   allowed.

   The window is fixed rather than sliding on purpose. A sliding window needs the
   timestamps of the individual hits, which means storing one row per submission
   keyed by client; a fixed window needs one integer per client per hour. The
   known weakness is the boundary — a caller can spend a full allowance at 10:59
   and another at 11:00 — and for a limit whose job is to stop automation rather
   than to meter a paid API, two hours' worth of forms in one minute is still
   two hours' worth of forms.
   ========================================================================== */

import 'server-only';

import { and, eq, inArray, lt, sql } from 'drizzle-orm';

import { db } from './db';
import { rateLimits } from './schema';
import { formatDatabaseFailure } from '@/lib/db-errors';

/**
 * What to do when the counter itself cannot be read or written.
 *
 * The two answers are opposite on purpose, and the asymmetry is the whole
 * design:
 *
 *   'allow' — public forms. A Neon outage must not also take the appointment
 *     book offline. The cost of being wrong is a burst of spam that a human
 *     deletes from a queue; the cost of the alternative is a patient with a
 *     broken tooth being told to go away by a form that looks broken.
 *
 *   'deny' — admin login. A database outage must not quietly convert the login
 *     into an unmetered guessing oracle, which is exactly what failing open
 *     would do: the endpoint that most needs the limit is the one whose limit
 *     would disappear. The clinic is locked out of the panel for the duration of
 *     the outage, which is recoverable; a guessed password is not.
 */
export type DatabaseErrorPolicy = 'allow' | 'deny';

export interface RateLimitOptions {
  /** Opaque key, e.g. `appointment:<ip-hash>`. Never a raw address. */
  bucket: string;
  /** Hits permitted within one window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Behaviour when the counter query throws. Defaults to the safe answer. */
  onDatabaseError?: DatabaseErrorPolicy;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Hits left in the current window, floored at zero. */
  remaining: number;
  /** Seconds until the window rolls over. Zero when the call was allowed. */
  retryAfterSeconds: number;
}

export interface RateLimitPreset {
  limit: number;
  windowMs: number;
  onDatabaseError: DatabaseErrorPolicy;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * Public form submissions: five per hour per client.
 *
 * Sized against the legitimate worst case rather than the average. A family
 * booking for three children shares one address and one NAT, and someone whose
 * first submission failed validation will retry — five leaves room for both. It
 * also caps an unattended script at 120 rows a day per address, which is a queue
 * a receptionist can still clear by hand.
 */
export const PUBLIC_FORM_RATE_LIMIT: RateLimitPreset = {
  limit: 5,
  windowMs: HOUR_MS,
  onDatabaseError: 'allow',
};

/**
 * Admin login: five attempts per fifteen minutes per client.
 *
 * Enough that a real person who mistypes a password twice and then reaches for
 * the password manager is never blocked, and slow enough that online guessing
 * stops being a strategy — 480 attempts a day against a password with any
 * entropy at all is not a threat.
 */
export const ADMIN_LOGIN_RATE_LIMIT: RateLimitPreset = {
  limit: 5,
  windowMs: 15 * MINUTE_MS,
  onDatabaseError: 'deny',
};

/* The sweeper's horizon: twice the widest window above. Anything older than this
   cannot affect a decision, so keeping it only costs table size. */
const SWEEP_HORIZON_MS = 2 * HOUR_MS;

/* Neon's free plan has no cron, so expired windows have to be collected inline.
   Doing it on every call would double the query count of every form submission
   to delete nothing 99 times out of 100; at this probability the table is swept
   several times an hour under any traffic that could actually grow it, and
   idle traffic does not need sweeping. */
const SWEEP_PROBABILITY = 0.01;

/** Forms that share the public allowance. Separate buckets per form so a burst
    of testimonials does not spend an appointment's allowance. */
export type PublicFormKind = 'appointment' | 'contact' | 'testimonial';

/* An absent hash means no proxy header was present — normal in local dev, and on
   Vercel it does not happen. Everything unidentified shares one bucket, which is
   the conservative choice: an attacker cannot escape a limit by stripping a
   header, they can only join the crowd that already has none. */
function bucketKey(prefix: string, ipHash: string | null): string {
  return `${prefix}:${ipHash ?? 'unknown'}`;
}

export function publicFormBucket(form: PublicFormKind, ipHash: string | null): string {
  return bucketKey(form, ipHash);
}

export function adminLoginBucket(ipHash: string | null): string {
  return bucketKey('login', ipHash);
}

/**
 * Count one hit against `bucket` and report whether it is within `limit`.
 *
 * The counter is incremented by the same statement that reads it. A
 * read-then-write would be a lost-update waiting to happen: two submissions
 * arriving together both read `hits = 4`, both write 5, and the sixth request
 * through the door is permitted. `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`
 * serialises on the primary key inside Postgres, so each caller gets a distinct
 * number back and nobody has to hold a lock in application code.
 */
export async function checkRateLimit({
  bucket,
  limit,
  windowMs,
  onDatabaseError = 'deny',
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const secondsToWindowEnd = Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000));

  let hits: number;
  try {
    const [row] = await db
      .insert(rateLimits)
      .values({ bucket, windowStart, hits: 1 })
      .onConflictDoUpdate({
        target: [rateLimits.bucket, rateLimits.windowStart],
        set: { hits: sql`${rateLimits.hits} + 1` },
      })
      .returning({ hits: rateLimits.hits });

    // RETURNING on an upsert always yields the row; the guard is for the type.
    hits = row?.hits ?? 1;
  } catch (error) {
    console.error('[rate-limit] counter unavailable for %s: %s', bucket, formatDatabaseFailure(error));

    return onDatabaseError === 'allow'
      ? { allowed: true, remaining: limit, retryAfterSeconds: 0 }
      : { allowed: false, remaining: 0, retryAfterSeconds: secondsToWindowEnd };
  }

  await sweepExpiredWindows();

  const allowed = hits <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - hits),
    retryAfterSeconds: allowed ? 0 : secondsToWindowEnd,
  };
}

/** `checkRateLimit` with the public-form preset already applied. */
export function checkPublicFormLimit(
  form: PublicFormKind,
  ipHash: string | null,
): Promise<RateLimitResult> {
  return checkRateLimit({ bucket: publicFormBucket(form, ipHash), ...PUBLIC_FORM_RATE_LIMIT });
}

/** `checkRateLimit` with the admin-login preset already applied.
 *
 *  Counts EVERY attempt, per client. Used by /api/auth/[...path], Neon Auth's
 *  public sign-in route, which only a script calls — the panel's own form signs
 *  in through `signInAction`, which uses the failure-counting gate below. */
export function checkAdminLoginLimit(ipHash: string | null): Promise<RateLimitResult> {
  return checkRateLimit({ bucket: adminLoginBucket(ipHash), ...ADMIN_LOGIN_RATE_LIMIT });
}

/* ============================================================================
   The panel's sign-in form: FAILURES, per account and per client
   ----------------------------------------------------------------------------
   The form used to spend `checkAdminLoginLimit` — five attempts per fifteen
   minutes, counted BEFORE authenticating, keyed on the client address. The
   whole clinic leaves the building through one NAT address, so three members
   of staff signing in correctly plus two typos locked everybody out, and the
   message blamed "intentos fallidos" for attempts that had succeeded.

   Two buckets now, and only failed sign-ins count against either:

     per account, per client   5 failures / 15 min — online guessing of one
                               account stops being a strategy, exactly as
                               before;
     per client                15 failures / 15 min — spraying many accounts
                               from one address is capped, while several staff
                               mistyping on the same morning are not.

   The gate also refuses a client that has used up the API route's every-attempt
   bucket, so alternating between the two public sign-in endpoints buys an
   attacker nothing. Legitimate staff never touch that route.

   Fails CLOSED, like the preset it replaces for this path: an unreadable
   counter must not turn the login into an unmetered oracle.
   ========================================================================== */

const ADMIN_LOGIN_FAILURES = {
  perAccount: 5,
  perClient: 15,
  windowMs: 15 * MINUTE_MS,
} as const;

/** Bucket keys. `accountKey` is a salted hash of the address, never the
 *  address itself — rate_limits is not a place for staff personal data. */
function loginFailureBuckets(ipHash: string | null, accountKey: string) {
  return {
    account: bucketKey(`login-fail:${accountKey}`, ipHash),
    client: bucketKey('login-fail', ipHash),
  };
}

/**
 * May this client try to sign in to this account right now? Reads the
 * counters without adding to them — a successful sign-in must cost nothing.
 */
export async function checkAdminLoginGate(
  ipHash: string | null,
  accountKey: string,
): Promise<RateLimitResult> {
  const now = Date.now();
  const { windowMs } = ADMIN_LOGIN_FAILURES;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const secondsToWindowEnd = Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000));
  const buckets = loginFailureBuckets(ipHash, accountKey);
  const apiBucket = adminLoginBucket(ipHash);

  /* All three are fifteen-minute windows, so they share a window start and a
     single SELECT answers all of them. */
  let hits: Map<string, number>;
  try {
    const rows = await db
      .select({ bucket: rateLimits.bucket, hits: rateLimits.hits })
      .from(rateLimits)
      .where(
        and(
          inArray(rateLimits.bucket, [buckets.account, buckets.client, apiBucket]),
          eq(rateLimits.windowStart, new Date(windowStartMs)),
        ),
      );
    hits = new Map(rows.map((row) => [row.bucket, row.hits]));
  } catch (error) {
    console.error('[rate-limit] login gate unavailable: %s', formatDatabaseFailure(error));
    return { allowed: false, remaining: 0, retryAfterSeconds: secondsToWindowEnd };
  }

  const accountFailures = hits.get(buckets.account) ?? 0;
  const clientFailures = hits.get(buckets.client) ?? 0;
  const apiAttempts = hits.get(apiBucket) ?? 0;

  const allowed =
    accountFailures < ADMIN_LOGIN_FAILURES.perAccount &&
    clientFailures < ADMIN_LOGIN_FAILURES.perClient &&
    apiAttempts < ADMIN_LOGIN_RATE_LIMIT.limit;

  return {
    allowed,
    remaining: Math.max(0, ADMIN_LOGIN_FAILURES.perAccount - accountFailures),
    retryAfterSeconds: allowed ? 0 : secondsToWindowEnd,
  };
}

/** Count one rejected sign-in against both buckets. Never throws: losing one
 *  increment must not turn a wrong password into a server error. */
export async function recordAdminLoginFailure(
  ipHash: string | null,
  accountKey: string,
): Promise<void> {
  const buckets = loginFailureBuckets(ipHash, accountKey);
  const preset = {
    windowMs: ADMIN_LOGIN_FAILURES.windowMs,
    onDatabaseError: 'deny' as const,
  };

  /* `checkRateLimit` is the atomic increment; its verdict is not needed here —
     the next attempt's gate reads the counts. It already logs and absorbs a
     database failure. */
  await Promise.all([
    checkRateLimit({ bucket: buckets.account, limit: ADMIN_LOGIN_FAILURES.perAccount, ...preset }),
    checkRateLimit({ bucket: buckets.client, limit: ADMIN_LOGIN_FAILURES.perClient, ...preset }),
  ]);
}

/**
 * Drop windows old enough that no limit can still refer to them.
 *
 * Awaited rather than left floating: a serverless function is frozen the moment
 * its response is sent, so a detached promise here would be cancelled mid-flight
 * most of the time and the table would grow anyway. One extra indexed DELETE on
 * one call in a hundred is a price worth paying for a sweep that actually runs.
 * Its failure is swallowed — an unswept table is a housekeeping problem, and it
 * must never be the reason a patient's appointment is rejected.
 */
async function sweepExpiredWindows(): Promise<void> {
  if (Math.random() >= SWEEP_PROBABILITY) return;

  try {
    const horizon = new Date(Date.now() - SWEEP_HORIZON_MS);
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, horizon));
  } catch (error) {
    console.error('[rate-limit] sweep failed: %s', formatDatabaseFailure(error));
  }
}
