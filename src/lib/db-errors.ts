/**
 * Describing a database failure without copying patient data into the log.
 *
 * This is not defensive tidiness — the raw objects genuinely carry the row. It
 * was verified by triggering a real CHECK violation against the live database
 * and walking what came back:
 *
 *   depth 0  DrizzleQueryError
 *            own enumerable keys: query, params, cause
 *            params  = ["X","maria@…","809…","Implantes","dolor al masticar…"]
 *            message = 'Failed query: insert into "app"."appointments" (…)
 *                       params: X,maria@…,809…,dolor al masticar…'
 *   depth 1  DatabaseError  (node-postgres)
 *            code 23514, constraint appointments_name_check, table appointments
 *            detail = 'Failing row contains (…, maria@…, 809…, dolor al …)'
 *
 * So there are three separate ways to leak the same row, and the two obvious
 * approaches both take one:
 *
 *   console.error('…', error)   prints `params` — it is an OWN key, so Node's
 *                               inspector shows it whatever the message says
 *   error.message.slice(0, N)   the query text runs 210-290 characters before
 *                               `params:` begins, so a truncation that looks
 *                               safe today is one renamed column from leaking
 *
 * Neither is a margin worth holding. This module reads only the four fields
 * that identify a failure — SQLSTATE, constraint, table, schema — and never
 * touches `detail`, `params`, `query` or any `message`.
 *
 * Note that the pg fields live on the CAUSE, not on the error Drizzle throws.
 * A `typeof error.code === 'string'` check against the top-level object is
 * always false, which is how an earlier version of this logic ended up dead:
 * it looked like it was reporting constraint names and was in fact falling
 * through to the message branch every single time.
 */

/** The identifying fields of a Postgres error. Safe to log in full. */
export interface DatabaseFailure {
  sqlstate: string;
  constraint: string;
  table: string;
  schema: string;
}

/** How deep to walk before giving up. Drizzle wraps once; leaving headroom
 *  costs nothing and survives a driver that wraps twice. */
const MAX_CAUSE_DEPTH = 8;

function hasStringCode(value: unknown): value is { code: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

function readString(source: object, key: string, fallback: string): string {
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/**
 * Reduce any thrown value to the four fields that identify it.
 *
 * When no Postgres error is found in the cause chain the failure did not come
 * from the server at all — it is DNS, a socket, a timeout, or the compute
 * waking from suspend. Those are distinguished by their constructor name, which
 * carries no row data, rather than by their message: the outermost error is
 * usually still Drizzle's, and its message embeds the query and its parameters.
 */
export function describeDatabaseFailure(error: unknown): DatabaseFailure {
  let node: unknown = error;

  for (let depth = 0; node && depth < MAX_CAUSE_DEPTH; depth++) {
    if (hasStringCode(node)) {
      return {
        sqlstate: node.code,
        constraint: readString(node, 'constraint', 'none'),
        table: readString(node, 'table', 'unknown'),
        schema: readString(node, 'schema', 'unknown'),
      };
    }
    node = (node as { cause?: unknown }).cause;
  }

  const name =
    error instanceof Error && error.name.length > 0 ? error.name : typeof error;

  return {
    sqlstate: 'none',
    constraint: 'none',
    table: 'unknown',
    schema: `non-postgres:${name}`,
  };
}

/**
 * A one-line form for a `console.error` template.
 *
 * Exists so call sites cannot accidentally pass the error itself as the last
 * argument — the failure mode this whole module is about. Prefer:
 *
 *     console.error('[audit] insert failed: %s', formatDatabaseFailure(error));
 *
 * over passing the object and trusting the inspector.
 */
export function formatDatabaseFailure(error: unknown): string {
  const f = describeDatabaseFailure(error);
  return f.sqlstate === 'none'
    ? `no sqlstate (${f.schema})`
    : `sqlstate ${f.sqlstate} on ${f.schema}.${f.table} (constraint ${f.constraint})`;
}
