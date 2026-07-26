import { redirect } from 'next/navigation';
import { createServerClient as createSsrClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types_db';
import { createServerClient } from '@/lib/supabase-server';
import { AdminDashboardClient } from '@/components/admin/dashboard-client';

/** Authenticated admin pages must never be cached or prerendered. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Sign-out. Cookie mutation is legal in the 'action' phase, so this builds its
 * own writable client rather than reusing the read-only page client.
 */
async function signOut() {
  'use server';
  const cookieStore = await cookies();

  const supabase = createSsrClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    },
  );

  await supabase.auth.signOut();
  redirect('/es');
}

export default async function AdminDashboardPage() {
  // Uses the shared helper, whose setAll is wrapped in try/catch.
  //
  // This page previously inlined its own createServerClient with an UNGUARDED
  // setAll. Next 15 seals the cookie store during render and throws on any
  // write outside a Server Action or Route Handler, so two ordinary situations
  // produced an uncaught 500 instead of the intended redirect:
  //   - an authenticated non-admin loading the page (the signOut below cleared
  //     auth cookies mid-render), and
  //   - any admin whose access token had expired (getSession auto-refreshed and
  //     tried to persist the new token mid-render).
  // The shared helper had already been fixed; this copy had drifted.
  const supabase = await createServerClient();

  // getUser(), not getSession(). getSession() only decodes the cookie locally
  // and does not verify its signature, so a forged cookie would satisfy it.
  // getUser() validates the token against the Supabase auth server.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/es');
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError) {
    // Distinguish "the check failed" from "you are not an admin". Signing a
    // user out because the database was briefly unreachable is the wrong
    // response, and it used to happen silently.
    console.error('[admin-dashboard] admin check failed:', adminError.message);
    throw new Error('No se pudo verificar el acceso de administrador.');
  }

  if (!adminRow) {
    // Not an admin. Just leave — do NOT call signOut() here: cookie writes are
    // illegal during render, and the caller may be a legitimate non-admin user
    // whose session should survive.
    redirect('/es');
  }

  const [appointmentsResult, messagesResult, testimonialsResult] = await Promise.all([
    supabase.from('appointments').select('*').order('submitted_at', { ascending: false }),
    supabase.from('contact_messages').select('*').order('submitted_at', { ascending: false }),
    supabase.from('testimonials').select('*').order('submitted_at', { ascending: false }),
  ]);

  // Surface load failures instead of rendering an all-empty dashboard that
  // looks like a quiet day at the clinic.
  const loadErrors = [
    appointmentsResult.error && 'citas',
    messagesResult.error && 'mensajes',
    testimonialsResult.error && 'testimonios',
  ].filter(Boolean) as string[];

  if (loadErrors.length) {
    console.error(
      '[admin-dashboard] failed to load:',
      appointmentsResult.error?.message,
      messagesResult.error?.message,
      testimonialsResult.error?.message,
    );
  }

  return (
    <AdminDashboardClient
      userEmail={user.email || ''}
      appointments={appointmentsResult.data || []}
      messages={messagesResult.data || []}
      testimonials={testimonialsResult.data || []}
      loadErrors={loadErrors}
      signOutAction={signOut}
    />
  );
}
