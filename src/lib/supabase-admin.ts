import { createClient } from '@supabase/supabase-js';
import type { Database } from './types_db';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client Supabase pour l'admin
export const createAdminClient = async () => {
  const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
  
  // Vérifier que l'utilisateur est connecté
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session error:', error);
    throw new Error(`Session error: ${error.message}`);
  }
  
  if (!session) {
    throw new Error("No authenticated session");
  }

  // Vérifier que l'utilisateur est admin
  const { data: adminCheck, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (adminError && adminError.code !== 'PGRST116') {
    console.error('Admin check error:', adminError);
    throw new Error(`Admin verification failed: ${adminError.message}`);
  }

  if (!adminCheck) {
    throw new Error("User is not an admin");
  }
  
  return supabase;
};