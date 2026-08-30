'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { issueCsrfToken } from '@/app/admin/_actions/session';
import type { CsrfSeal } from '@/app/admin/_lib/csrf-seal';

/* ============================================================================
   THE TOKEN, MADE AVAILABLE TO EVERY FORM IN THE PANEL
   ----------------------------------------------------------------------------
   The layout reads the token with `getCsrfToken()` and seeds this provider with
   it. That read can legitimately come back empty: the CSRF cookie is a session
   cookie by design (see the note in @/lib/csrf) while the auth session outlives
   the browser being closed, so a dentist who reopens Chrome in the morning
   arrives signed in and unsealed.

   That case is why this is a provider and not a prop threaded through six
   components. A Server Component cannot mint the token — Next refuses cookie
   writes during a render — so the recovery has to happen from the client, once,
   and the result has to reach every form that is already on screen. Seeding
   each form with a render-time string instead would leave them all holding an
   empty value that only a full reload could fix.

   Until a token exists, mutation controls disable themselves rather than
   posting a request that is certain to be rejected. That gap is normally a
   single round trip and invisible.
   ========================================================================== */

interface CsrfContextValue {
  seal: CsrfSeal | null;
  /** False only while the very first mint is in flight, or after it failed. */
  ready: boolean;
}

const CsrfContext = createContext<CsrfContextValue>({ seal: null, ready: false });

export function AdminCsrfProvider({
  seed,
  children,
}: {
  seed: CsrfSeal | null;
  children: ReactNode;
}) {
  const [seal, setSeal] = useState<CsrfSeal | null>(seed);

  useEffect(() => {
    if (seal) return;

    /* Guarded against a provider that unmounts mid-flight — a navigation away
       from the panel during the first paint would otherwise set state on a
       component that is gone. */
    let live = true;

    issueCsrfToken()
      .then((next) => {
        if (live) setSeal(next);
      })
      .catch(() => {
        /* Nothing to report to the user here: no form has been submitted yet.
           The controls stay disabled and say why, which is more useful than a
           toast about a token nobody asked for. */
        console.error('[admin] could not obtain a CSRF token');
      });

    return () => {
      live = false;
    };
  }, [seal]);

  return (
    <CsrfContext.Provider value={{ seal, ready: seal !== null }}>{children}</CsrfContext.Provider>
  );
}

export function useCsrf(): CsrfContextValue {
  return useContext(CsrfContext);
}

/**
 * Build the FormData for a mutation with the token already in it.
 *
 * Returns null when there is no token, which is the signal for the caller to do
 * nothing at all — every mutation goes through this, so a missing token cannot
 * result in a request that the server will only reject.
 */
export function useMutationFormData(): (fields: Record<string, string>) => FormData | null {
  const { seal } = useCsrf();

  return useCallback(
    (fields: Record<string, string>) => {
      if (!seal) return null;

      const formData = new FormData();
      formData.set(seal.field, seal.token);
      for (const [name, value] of Object.entries(fields)) formData.set(name, value);
      return formData;
    },
    [seal],
  );
}

/** The hidden input, for forms that post themselves rather than being driven
 *  by a click handler — the settings form and the sign-out button. */
export function CsrfInput() {
  const { seal } = useCsrf();
  if (!seal) return null;
  return <input type="hidden" name={seal.field} value={seal.token} readOnly />;
}
