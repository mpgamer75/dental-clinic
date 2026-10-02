import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

import { AdminChrome } from '@/components/admin/admin-chrome';
import { AdminCsrfProvider } from '@/components/admin/csrf-provider';
import type { NavBadgeCounts } from '@/components/admin/nav-items';
import { SignOutButton } from '@/components/admin/sign-out-button';
import { ErrorPanel } from '@/components/admin/states';
import { Button } from '@/components/ui/button';
import { CSRF_FIELD_NAME, getCsrfToken } from '@/lib/csrf';
import { contactDetails } from '@/lib/data';

import { getCachedDashboardCounts } from '../_lib/queries';
import { ADMIN_LOGIN_PATH, requireAdminPage } from '../_lib/session';

/* ============================================================================
   THE PANEL'S FRONT DOOR — not its only lock
   ----------------------------------------------------------------------------
   A SERVER component that resolves the session before any admin markup is
   serialised: an anonymous request gets a redirect, a non-member gets a
   refusal, and neither gets the chrome or the shape of the panel.

   What it cannot do is keep DATA out of the response. A layout that declines to
   render `{children}` does not stop the page segment beneath it from running —
   the router renders segments independently and serialises each one into the
   RSC payload — and on client-side navigation a layout does not re-run at all.
   So the authorisation that actually protects patient rows lives in the data
   layer: every read in _lib/queries.ts goes through `runQuery`, which asks
   `readAdminSessionOnce()` first. The layout and the queries share that one
   memoised answer per request.

   Mutations are the third check. A Server Action is a public endpoint reachable
   without rendering any page, so each one re-verifies the session for itself in
   _lib/mutation.ts.

   The route group is what keeps /admin/login outside this guard: a login form
   nested inside its own redirect is a loop.
   ========================================================================== */

/** `getSession` reads a cookie, so this segment can never be prerendered. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Panel · Orthoprotesis',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const guard = await requireAdminPage();

  /* Read before the branch: the refusal path below needs it for its sign-out
     button, and reading a cookie twice in one render is free. */
  const csrfSeed = await getCsrfToken();

  /* Anonymous callers were already redirected inside `requireAdminPage`. Two
     states reach here, and neither may be a redirect:

       forbidden    a valid session that is not staff. Sending them to the login
                    form would loop — they would sign in successfully and arrive
                    right back — so the refusal is stated instead.
       unavailable  the auth service or the staff lookup did not answer.
                    Redirecting on that would be the old bug in server clothing:
                    the dentist is signed in, has done nothing wrong, and would
                    land on a login form with no explanation.

     Either way the panel is withheld — nothing below this line renders. */
  if (!guard.ok) {
    if (guard.forbidden) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-5 py-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-ink-soft">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-h3 text-ink">Esta cuenta no tiene acceso</h1>
            <p className="mt-2 text-body text-ink-soft">{guard.detail}</p>
          </div>
          {/* Wrapped, because SignOutButton posts a Server Action and every
              mutation in this panel carries a CSRF token. Signing out is the
              one action this person genuinely needs — being told the account is
              wrong while stuck signed into it is a dead end, particularly on a
              shared clinic machine. */}
          <AdminCsrfProvider
            seed={csrfSeed ? { field: CSRF_FIELD_NAME, token: csrfSeed } : null}
          >
            <div className="self-start">
              <SignOutButton ground="surface" />
            </div>
          </AdminCsrfProvider>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-5 py-12">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brass-soft text-brass-ink">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-heading text-h3 text-ink">No se pudo verificar su sesión</h1>
          <p className="mt-2 text-body text-ink-soft">
            El servicio de autenticación no respondió, así que el panel no se ha cargado. Su sesión
            sigue siendo válida: no hace falta volver a iniciarla salvo que el problema persista.
          </p>
        </div>

        <ErrorPanel title="Verificación de sesión no disponible" detail={guard.detail} />

        <Button variant="outline" size="sm" className="self-start" asChild>
          <Link href={ADMIN_LOGIN_PATH}>Ir a la pantalla de acceso</Link>
        </Button>
      </main>
    );
  }

  /* Read above, never minted: a Server Component render cannot write a cookie.
     When it comes back null — a reopened browser, since the CSRF cookie is a
     session cookie and the auth cookie is not — AdminCsrfProvider mints one
     from the client on its first effect. */
  const csrfToken = csrfSeed;

  const counts = await getCachedDashboardCounts();
  /* An empty object when the count query failed, so the badges are ABSENT
     rather than zero. A "0" beside Citas is a claim that there is nothing
     waiting, and that claim is exactly what could not be verified. */
  const badges: NavBadgeCounts = counts.ok
    ? {
        appointmentsPending: counts.data.appointmentsPending,
        messagesUnread: counts.data.messagesUnread,
        testimonialsPending: counts.data.testimonialsPending,
      }
    : {};

  return (
    <AdminCsrfProvider
      seed={csrfToken ? { field: CSRF_FIELD_NAME, token: csrfToken } : null}
    >
      <AdminChrome
        actorEmail={guard.actor.email}
        clinicName={contactDetails.clinicName.es}
        badges={badges}
      >
        {children}
      </AdminChrome>
    </AdminCsrfProvider>
  );
}
