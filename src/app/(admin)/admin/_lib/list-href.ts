/* ============================================================================
   THE QUERY-STRING CONTRACT
   ----------------------------------------------------------------------------
   Split out of list-params.ts on purpose, and the reason is bundle size rather
   than tidiness. The parsers in that file narrow a raw parameter against the
   status tuples in @/lib/schema, and schema.ts builds its tables at import time
   — so a client component that reached for `buildListHref` there would drag
   drizzle-orm/pg-core into the browser bundle to read four string literals.

   Nothing in this module imports anything. The toolbar and the pager are client
   components and this is all either of them needs.
   ========================================================================== */

/** Next 16 hands `searchParams` to a page as a promise of this shape. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Parameter names, in Spanish.
 *
 * The panel is Spanish-only and the URL is part of the interface: a filtered
 * view gets bookmarked, pasted into a message and read aloud over the phone
 * between the front desk and the surgery.
 */
export const PARAM = {
  page: 'pagina',
  search: 'buscar',
  status: 'estado',
  sort: 'orden',
} as const;

export type ParamKey = keyof typeof PARAM;

function firstValue(raw: RawSearchParams, key: string): string | undefined {
  const value = raw[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

export { firstValue };

/**
 * Rebuild the query string with one parameter changed.
 *
 * Every change except paging resets to page 1. Without that, filtering a
 * six-page list down to two while sitting on page 5 lands on an empty table
 * that looks exactly like "no hay resultados" — the user's own filter appears
 * to have found nothing when it found plenty.
 */
export function buildListHref(
  pathname: string,
  current: RawSearchParams,
  change: Partial<Record<ParamKey, string | null>>,
): string {
  const params = new URLSearchParams();

  for (const key of Object.keys(PARAM) as ParamKey[]) {
    const name = PARAM[key];
    const value = key in change ? change[key] : firstValue(current, name);
    if (value !== null && value !== undefined && value !== '') {
      params.set(name, value);
    }
  }

  if (!('page' in change)) params.delete(PARAM.page);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
