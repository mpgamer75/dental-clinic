import { createClient } from '@supabase/supabase-js';
import type { Database } from './types_db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client admin avec service role key pour bypasser RLS
export const createAdminClient = async () => {
  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Vérifier que l'utilisateur actuel est admin
  const { data: { session }, error } = await adminClient.auth.getSession();
  
  if (error || !session) {
    throw new Error("No authenticated session");
  }

  // Vérifier dans admin_users
  const { data: adminCheck, error: adminError } = await adminClient
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .single();

  if (adminError || !adminCheck) {
    throw new Error("User is not an admin");
  }
  
  return adminClient;
};