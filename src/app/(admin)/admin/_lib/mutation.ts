/* ============================================================================
   THE GATE EVERY ADMIN MUTATION PASSES THROUGH
   ----------------------------------------------------------------------------
   A Server Action is a public HTTP endpoint. The page that renders the button
   proves nothing about who eventually presses it — or about whether a button
   was involved at all — so every mutation re-establishes both facts for itself:
   the request carries this browser's CSRF token, and the browser holds a valid
   session. Neither is inherited from the layout that let the page render.

   Why this lives in one function rather than as two lines copied into a dozen
   actions: the copied version is only as good as the least careful edit, and
   the failure is silent — an action that forgets `assertCsrf` looks exactly
   like one that does not, and still works. A gate that must be opened before
   the actor's identity is available cannot be skipped by accident, because
   nothing downstream compiles without the value it returns.

   The order is fixed: CSRF first, because it is the cheap check and because a
   forged request should never reach the session lookup, then the session.
   ========================================================================== */

import 'server-only';

import { CsrfError, assertCsrf } from '@/lib/csrf';

import { readAdminSession, type AdminActor } from './session';

/** What every admin mutation returns. The client turns it into a toast. */
export type MutationResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export const MUTATION_MESSAGES = {
  csrf:
    'La sesión de este formulario caducó. Recargue la página e inténtelo de nuevo.',
  anonymous: 'Su sesión terminó. Vuelva a iniciar sesión para continuar.',
  /* Deliberately not "no autorizado": the person is signed in and the account
     is real, so the useful thing to say is who can change that. */
  forbidden:
    'Su cuenta no tiene acceso al panel. Solicite acceso al administrador de la clínica.',
  unavailable:
    'No se pudo verificar su sesión porque el servicio de autenticación no respondió. ' +
    'No se ha cambiado nada. Inténtelo de nuevo en unos momentos.',
  invalid: 'La solicitud no era válida. Recargue la página e inténtelo de nuevo.',
  database:
    'La base de datos no respondió, así que no se guardó ningún cambio. Inténtelo de nuevo.',
  /* Named for what actually happened rather than "error": a row that is not
     there any more is the ordinary outcome of two people working the same queue
     from two phones, and telling them to reload is advice they can act on. */
  vanished:
    'Ese registro ya no existe — es posible que otra persona lo haya eliminado. Recargue la lista.',
} as const;

type Guard =
  | { ok: true; actor: AdminActor }
  | { ok: false; failure: MutationResult };

/**
 * Verify the token and the session. Call it as the first statement of every
 * mutation and return `guard.failure` unchanged when it refuses.
 */
export async function guardAdminMutation(formData: FormData): Promise<Guard> {
  try {
    await assertCsrf(formData);
  } catch (error) {
    /* The reason is logged, never returned. `CsrfError` says which half of the
       double-submit failed, which is useful to us and is a map of the check to
       whoever is probing it. */
    console.warn(
      '[admin] mutation rejected: %s',
      error instanceof CsrfError ? error.message : 'CSRF check threw an unexpected error',
    );
    return { ok: false, failure: { ok: false, message: MUTATION_MESSAGES.csrf } };
  }

  const check = await readAdminSession();

  if (check.status === 'anonymous') {
    return { ok: false, failure: { ok: false, message: MUTATION_MESSAGES.anonymous } };
  }

  if (check.status === 'forbidden') {
    /* A valid session belonging to someone who is not staff. This is the
       authorization half of the guard, and it has to be here as well as on the
       page: a Server Action is a public endpoint, so a non-member who never
       loads the panel can still POST straight at this function. */
    return { ok: false, failure: { ok: false, message: MUTATION_MESSAGES.forbidden } };
  }

  if (check.status === 'unavailable') {
    /* Refused, not attempted. The mutation must not proceed on an unverified
       session, and the message says plainly that nothing changed — otherwise
       the honest thing to do is press the button again, and the second press
       is the one that runs twice. */
    return { ok: false, failure: { ok: false, message: MUTATION_MESSAGES.unavailable } };
  }

  return { ok: true, actor: check.actor };
}

/** A required text field from a posted form, or null. */
export function formField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A checkbox: present means on. Radix's `Switch` posts nothing when it is
 *  off, which is the HTML checkbox contract and the reason an unchecked
 *  toggle must never be read as "field missing, keep the old value". */
export function formFlag(formData: FormData, name: string): boolean {
  return formData.get(name) !== null;
}
