import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from "@/lib/types_db";
import { AdminDashboardClient } from '@/components/admin/dashboard-client';

async function signOut() {
  'use server';
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
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
    }
  );
  
  await supabase.auth.signOut();
  redirect('/es');
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient<Database>(
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
    }
  );

  // Vérifier l'authentification
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    redirect('/es');
  }

  // Vérifier si l'utilisateur est admin
  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (adminError || !adminCheck) {
    console.error('User is not admin:', session.user.id);
    await supabase.auth.signOut();
    redirect('/es');
  }

  // Récupérer toutes les données
  const [appointmentsResult, messagesResult, testimonialsResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .order('submitted_at', { ascending: false }),
    supabase
      .from('contact_messages')
      .select('*')
      .order('submitted_at', { ascending: false }),
    supabase
      .from('testimonials')
      .select('*')
      .order('submitted_at', { ascending: false }),
  ]);

  const appointments = appointmentsResult.data || [];
  const messages = messagesResult.data || [];
  const testimonials = testimonialsResult.data || [];

  return (
    <AdminDashboardClient
      userEmail={session.user.email || ''}
      appointments={appointments}
      messages={messages}
      testimonials={testimonials}
      signOutAction={signOut}
    />
  );
}
