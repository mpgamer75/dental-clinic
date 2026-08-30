/* ============================================================================
   FORMATTING — done once, on the server, in the clinic's timezone
   ----------------------------------------------------------------------------
   Every date the panel shows is formatted here and travels to the browser as a
   finished string. Two reasons, and both are failures this project has already
   paid for once:

   1. The clinic is in Santiago de los Caballeros, UTC-4, and its staff open the
      panel from phones that are sometimes set to something else. A timestamp
      formatted in the viewer's zone means the front desk and the surgery can
      read different days off the same appointment. The zone is pinned.

   2. A `new Date()` formatted during a client render disagrees with the same
      call during the server render, which React reports as a hydration error
      and browsers resolve by keeping whichever one is wrong. Formatting on the
      server removes the second render entirely.

   The `Intl` formatters are module-level constants: constructing one costs
   real time, and a table of twenty rows constructs three per row otherwise.
   ========================================================================== */

import 'server-only';

/** IANA zone for Santiago de los Caballeros. Fixed offset UTC-4, no DST. */
export const CLINIC_TIME_ZONE = 'America/Santo_Domingo';

const dateTimeFormatter = new Intl.DateTimeFormat('es-DO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: CLINIC_TIME_ZONE,
});

const dayFormatter = new Intl.DateTimeFormat('es-DO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: CLINIC_TIME_ZONE,
});

/* A calendar date carries no time of day, so it is formatted in UTC — the same
   discipline src/app/actions.ts uses on the way in. Rendering `2026-03-10` in
   UTC-4 would move it to the 9th, which is how a patient who asked for Tuesday
   ends up in the book on Monday. */
const calendarFormatter = new Intl.DateTimeFormat('es-DO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const shortDayFormatter = new Intl.DateTimeFormat('es-DO', {
  day: 'numeric',
  month: 'short',
  timeZone: CLINIC_TIME_ZONE,
});

const relativeFormatter = new Intl.RelativeTimeFormat('es-DO', { numeric: 'auto' });

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "12 mar 2026, 09:41" */
export function formatDateTime(value: Date): string {
  return dateTimeFormatter.format(value);
}

/** "jueves, 12 de marzo" — for grouping headers and chart tooltips. */
export function formatDay(value: Date): string {
  return dayFormatter.format(value);
}

/** "12 mar" — chart axis ticks, where the year is noise. */
export function formatShortDay(value: Date): string {
  return shortDayFormatter.format(value);
}

/**
 * The `YYYY-MM-DD` a patient picked, as Spanish prose.
 *
 * Parsed with `Date.UTC` rather than `new Date(string)` so the value is pinned
 * to UTC midnight regardless of the runtime's own zone — the same reason
 * actions.ts refuses to let a calendar date become an instant.
 */
export function formatCalendarDate(value: string | null): string | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? value : calendarFormatter.format(date);
}

/**
 * How long a request has been waiting, as "hace 3 días".
 *
 * The queue is the reason this exists: a status badge says an appointment is
 * pending, and only the age says whether that is fine or a problem.
 */
export function formatWaitedFor(value: Date, now = Date.now()): string {
  const elapsed = now - value.getTime();

  if (elapsed < HOUR_MS) {
    return relativeFormatter.format(-Math.max(1, Math.round(elapsed / MINUTE_MS)), 'minute');
  }
  if (elapsed < DAY_MS) {
    return relativeFormatter.format(-Math.round(elapsed / HOUR_MS), 'hour');
  }
  return relativeFormatter.format(-Math.round(elapsed / DAY_MS), 'day');
}

/** Whole days a request has been waiting, for the "needs attention" threshold. */
export function daysWaiting(value: Date, now = Date.now()): number {
  return Math.floor((now - value.getTime()) / DAY_MS);
}
