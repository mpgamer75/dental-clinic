/* ============================================================================
   LIST PARAMETERS — the query string is the state
   ----------------------------------------------------------------------------
   Search, filter, sort and page all live in the URL. That is not a stylistic
   preference: it is what makes a filtered view something the clinic can
   bookmark, reload, share between the front desk and the surgery, and reach
   with the browser's back button. It also means the server does the filtering,
   so the page never holds more rows than it shows.

   Everything here is parsed defensively. A query string is user input — a
   hand-edited `?pagina=-4` or `?estado=<script>` reaches these functions before
   it reaches a query, and each one narrows to a value the SQL builder is
   allowed to see. Nothing from this module is ever interpolated into SQL as
   text; the parsed values select a prebuilt clause instead.

   Parameter names are Spanish because the panel is Spanish-only and the URL is
   part of the interface the clinic reads.
   ========================================================================== */

import {
  APPOINTMENT_STATUSES,
  CONTACT_MESSAGE_STATUSES,
  TESTIMONIAL_STATUSES,
  type AppointmentStatus,
  type ContactMessageStatus,
  type TestimonialStatus,
} from '@/lib/schema';

import { PARAM, buildListHref, firstValue, type RawSearchParams } from './list-href';

/* Re-exported so a server page has one import for "everything about the query
   string". Client components must import from ./list-href directly — see the
   note at the top of that file. */
export { PARAM, buildListHref };
export type { RawSearchParams };

/**
 * Twenty rows.
 *
 * Chosen against the screen rather than the database: twenty is roughly two
 * phone screens of scrolling, and it keeps the page's own count honest — the
 * number under a stat card comes from `count(*)`, never from `rows.length`, and
 * this constant exists so nothing is tempted to confuse the two again. The
 * panel this replaces read ten rows and captioned them "de 45 totales".
 */
export const PAGE_SIZE = 20;

/** Longer than any name or address in the tables, short enough that a pattern
 *  match cannot be turned into a denial of service by pasting a novel. */
const SEARCH_MAX_LENGTH = 80;

/** 1-based, clamped. `?pagina=0`, `?pagina=-1` and `?pagina=abc` are all 1. */
export function parsePage(raw: RawSearchParams): number {
  const parsed = Number.parseInt(firstValue(raw, PARAM.page) ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  /* An upper bound so a crafted `?pagina=999999999` cannot ask Postgres for an
     OFFSET it has to count its way to. */
  return Math.min(parsed, 10_000);
}

export function parseSearch(raw: RawSearchParams): string {
  const value = firstValue(raw, PARAM.search)?.trim() ?? '';
  return value.slice(0, SEARCH_MAX_LENGTH);
}

/** Narrows an arbitrary string to one of a table's declared statuses, or null
 *  for "todos". The tuples come from schema.ts, so this list and the CHECK
 *  constraint cannot drift apart. */
function parseStatus<T extends string>(
  raw: RawSearchParams,
  allowed: readonly T[],
): T | null {
  const value = firstValue(raw, PARAM.status);
  return allowed.find((candidate) => candidate === value) ?? null;
}

export const parseAppointmentStatus = (raw: RawSearchParams): AppointmentStatus | null =>
  parseStatus(raw, APPOINTMENT_STATUSES);

export const parseMessageStatus = (raw: RawSearchParams): ContactMessageStatus | null =>
  parseStatus(raw, CONTACT_MESSAGE_STATUSES);

export const parseTestimonialStatus = (raw: RawSearchParams): TestimonialStatus | null =>
  parseStatus(raw, TESTIMONIAL_STATUSES);

/* ----------------------------------------------------------------------------
   Sort orders
   ----------------------------------------------------------------------------
   Each entity declares its own closed set. 'cola' and 'revision' are the two
   that carry a clinical meaning rather than a preference, and both are the
   default for their table — see the note on the queue in queries.ts.
   -------------------------------------------------------------------------- */

export const APPOINTMENT_SORTS = ['cola', 'recientes', 'antiguos'] as const;
export type AppointmentSort = (typeof APPOINTMENT_SORTS)[number];

export const MESSAGE_SORTS = ['recientes', 'antiguos'] as const;
export type MessageSort = (typeof MESSAGE_SORTS)[number];

export const TESTIMONIAL_SORTS = ['revision', 'recientes', 'antiguos'] as const;
export type TestimonialSort = (typeof TESTIMONIAL_SORTS)[number];

function parseSort<T extends string>(raw: RawSearchParams, allowed: readonly T[]): T {
  const value = firstValue(raw, PARAM.sort);
  return allowed.find((candidate) => candidate === value) ?? allowed[0];
}

export const parseAppointmentSort = (raw: RawSearchParams): AppointmentSort =>
  parseSort(raw, APPOINTMENT_SORTS);

export const parseMessageSort = (raw: RawSearchParams): MessageSort =>
  parseSort(raw, MESSAGE_SORTS);

export const parseTestimonialSort = (raw: RawSearchParams): TestimonialSort =>
  parseSort(raw, TESTIMONIAL_SORTS);

/** Human labels for the sort control. Kept beside the values so a new order
 *  cannot be added without naming it in Spanish. */
export const SORT_LABELS: Record<
  AppointmentSort | MessageSort | TestimonialSort,
  string
> = {
  cola: 'Cola de atención (urgentes primero)',
  revision: 'Cola de revisión (peor puntuación primero)',
  recientes: 'Más recientes primero',
  antiguos: 'Más antiguos primero',
};
