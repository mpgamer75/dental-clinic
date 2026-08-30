/**
 * The CSRF token as a form sees it: the input name and the value to put in it.
 *
 * A module of its own, with no imports, because it is the one shape that has to
 * cross the server/client line. The name travels WITH the value so no client
 * module ever has to restate `'csrf_token'` — the client cannot import
 * @/lib/csrf (it is `server-only`, and the cookie name is not the browser's
 * business), and a hardcoded copy on the client is a string that can drift from
 * the one the server checks against. When it drifts, every admin mutation fails
 * with a CSRF error naming a field the form does not have.
 */
export interface CsrfSeal {
  field: string;
  token: string;
}
