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
   THE SECURITY BOUNDARY
   ----------------------------------------------------------------------------
   This layout is the reason the panel is safe, and everything below it assumes
   it ran. It is a SERVER component: the session is resolved before a single
   byte of admin markup is serialised, so an anonymous request receives a
   redirect and never receives a patient's name, a table shell, or the shape of
   the panel.

   That is the whole change. The version this replaces was a `use client` page
   that fetched a session in a `useEffect` and conditionally rendered a login
   form — which means the dashboard, its queries and a database credential had
   already been sent to the browser by the time it decided who was asking. And
   src/proxy.ts skipped /admin entirely, so nothing else was checking either.

   It is not, however, the only check. A layout guards PAGES; it cannot guard a
   Server Action, which is a public endpoint reachable without ever rendering
   the page that would normally call it. Every mutation therefore re-verifies
   the session for itself in _lib/mutation.ts.

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
