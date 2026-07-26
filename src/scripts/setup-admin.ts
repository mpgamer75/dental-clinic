// Script to automatically configure an admin user
// Usage: npx tsx src/scripts/setup-admin.ts <email>

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/types_db';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdmin(email?: string) {
  try {
    console.log('🔍 Looking up users...');

    // Fetch all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`📋 ${users.users.length} user(s) found:`);
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    let targetUser;

    if (email) {
      targetUser = users.users.find(user => user.email === email);
      if (!targetUser) {
        console.error(`❌ User with email ${email} not found`);
        return;
      }
    } else {
      // Use the only user if there is exactly one
      if (users.users.length === 1) {
        targetUser = users.users[0];
      } else {
        console.log('⚠️  Multiple users found. Specify an email:');
        console.log('npx tsx src/scripts/setup-admin.ts <email>');
        return;
      }
    }

    console.log(`👤 Configuring ${targetUser.email} as admin...`);

    // Check whether the admin_users table exists and create it if needed
    const { error: tableError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('relation "admin_users" does not exist')) {
      console.log('📋 Creating the admin_users table...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.admin_users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
          );

          ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

          -- Non-recursive.
          --
          -- This previously read:
          --   USING (EXISTS (SELECT 1 FROM public.admin_users
          --                  WHERE admin_users.id = auth.uid()))
          -- i.e. a policy ON admin_users that queries admin_users, which
          -- re-triggers itself. Postgres aborts with 42P17 "infinite recursion
          -- detected in policy for relation admin_users", and because every
          -- other admin policy does the same membership subquery, the whole
          -- admin surface becomes unreachable. Comparing the row's own id to
          -- auth.uid() needs no subquery at all.
          CREATE POLICY "Users can read own admin row"
          ON public.admin_users FOR SELECT
          TO authenticated
          USING (id = auth.uid());

          -- Helper other tables' policies use, so they never have to query
          -- admin_users from inside their own USING clause.
          CREATE OR REPLACE FUNCTION public.is_admin()
          RETURNS boolean
          LANGUAGE sql SECURITY DEFINER STABLE
          SET search_path = public
          AS $fn$
            SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid());
          $fn$;

          REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
          GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
        `
      });

      if (createError) {
        console.error('❌ Error creating the table:', createError);
        return;
      }
    }

    // Add the user as an admin
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({ id: targetUser.id })
      .select();

    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('❌ Error adding the admin:', insertError);
      return;
    }

    // Verify it worked
    const { data: adminCheck, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', targetUser.id)
      .single();

    if (checkError) {
      console.error('❌ Error during verification:', checkError);
      return;
    }

    console.log('✅ User configured as admin successfully!');
    console.log(`📧 Email: ${targetUser.email}`);
    console.log(`🆔 ID: ${targetUser.id}`);
    console.log(`📅 Added on: ${adminCheck.created_at}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Read the email from the command-line arguments
const email = process.argv[2];
setupAdmin(email);
