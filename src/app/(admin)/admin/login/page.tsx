import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

import { LoginForm } from '@/components/admin/login-form';
import { contactDetails } from '@/lib/data';

import { ADMIN_HOME_PATH, readAdminSession } from '../_lib/session';

/* ============================================================================
   /admin/login
   ----------------------------------------------------------------------------
   Deliberately OUTSIDE the (panel) route group, so it is the one path under
   /admin that the guarded layout does not wrap. A login form nested inside its
   own guard redirects to itself, forever.

   src/proxy.ts knows this too: `auth.middleware({ loginUrl: '/admin/login' })`
   allows its own login path through. The two must name the same URL — see the
   note on ADMIN_LOGIN_PATH.
   ========================================================================== */

/** The session lives in a cookie, and a prerendered page has none. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Acceso al panel · Orthoprotesis',
  /* An internal panel has no business in a search index, and `noarchive` keeps
     it out of cached copies as well. */
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  const check = await readAdminSession();

  /* Someone who is already signed in has no use for this form. An
     'unavailable' check falls through on purpose: if the auth service cannot be
     reached, sending them into the panel would only bounce them straight back
     out, and the form at least gives them something to do. */
  if (check.status === 'authenticated') redirect(ADMIN_HOME_PATH);

  /* A non-member goes to the panel too, where the layout states plainly that
     their account has no access. Leaving them on this form instead would invite
     them to sign in again — which would succeed, and land them back here, which
     reads as a broken login rather than a refusal. */
  if (check.status === 'forbidden') redirect(ADMIN_HOME_PATH);

  const clinicName = contactDetails.clinicName.es;

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* The drenched half. Present on lg only: on a phone it would be a
          screenful of colour above the fold, pushing the form the person came
          here to use off the bottom of the screen. */}
      <aside className="drenched-deep hidden flex-col justify-between p-10 lg:flex xl:p-14">
        <span className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brass text-brass-on">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="font-heading text-[1.15rem] text-drench-on">{clinicName}</span>
        </span>

        <div className="max-w-measure">
          <p className="font-heading text-h2 text-drench-on">Panel interno</p>
          <p className="mt-4 text-body text-drench-on/80">
            Desde aquí se gestionan las solicitudes de cita, los mensajes de los pacientes y los
            testimonios que se publican en el sitio. El acceso queda registrado.
          </p>
        </div>

        <p className="text-small text-drench-on/60">
          {contactDetails.doctorName.es} · {contactDetails.address.es}
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link
            href="/es"
            className="group inline-flex items-center gap-2 text-small text-ink-soft transition-colors duration-fast hover:text-primary"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-fast ease-out-quart group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            Volver al sitio
          </Link>

          <span className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary lg:hidden">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-6 font-heading text-h3 text-ink">Acceso al panel</h1>
          <p className="mt-2 text-body text-ink-soft">
            Introduzca las credenciales de administración de {clinicName}.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-8 text-small text-ink-faint">
            Si no consigue entrar, no reintente indefinidamente: tras varios intentos fallidos el
            acceso se bloquea temporalmente desde esta conexión.
          </p>
        </div>
      </main>
    </div>
  );
}
