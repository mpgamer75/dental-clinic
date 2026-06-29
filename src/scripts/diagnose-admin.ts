// Diagnostic script to identify admin-related problems
// Usage: npx tsx src/scripts/diagnose-admin.ts

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
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseAdmin() {
  console.log('🔍 Diagnosing the admin system...\n');

  try {
    // 1. Check the Supabase connection
    console.log('1️⃣ Testing the Supabase connection...');
    const { error: healthError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);

    if (healthError) {
      if (healthError.message.includes('relation "admin_users" does not exist')) {
        console.log('❌ The admin_users table does not exist');
        console.log('📋 Fix: run the fix-admin-table.sql script in Supabase');
        return;
      } else {
        console.log('❌ Connection error:', healthError.message);
        return;
      }
    }
    console.log('✅ Supabase connection OK');

    // 2. List all users
    console.log('\n2️⃣ User list:');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.log('❌ Error fetching users:', usersError);
      return;
    }

    if (users.users.length === 0) {
      console.log('⚠️  No users found');
      return;
    }

    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    // 3. Check existing admins
    console.log('\n3️⃣ Configured admins:');
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('*');

    if (adminsError) {
      console.log('❌ Error fetching admins:', adminsError);
      return;
    }

    if (admins.length === 0) {
      console.log('⚠️  No admin configured');
      console.log('\n🔧 To add an admin, run:');
      users.users.forEach((user, index) => {
        console.log(`   ${index + 1}. INSERT INTO public.admin_users (id) VALUES ('${user.id}'); -- ${user.email}`);
      });
    } else {
      console.log('✅ Admins found:');
      for (const admin of admins) {
        const user = users.users.find(u => u.id === admin.id);
        console.log(`   - ${user?.email || 'Unknown email'} (ID: ${admin.id})`);
      }
    }

    // 4. Test access with a normal (anon) client
    console.log('\n4️⃣ Testing normal client access...');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey || !supabaseUrl) {
      console.log('❌ Missing environment variables');
      return;
    }
    const normalClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { error: accessError } = await normalClient
      .from('admin_users')
      .select('id')
      .limit(1);

    if (accessError) {
      console.log('❌ Normal client access blocked:', accessError.message);
      console.log('💡 This can be expected if RLS is enabled');
    } else {
      console.log('✅ Normal client access OK');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseAdmin();
