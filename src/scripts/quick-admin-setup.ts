// Quick script to configure an admin
// Usage: npx tsx src/scripts/quick-admin-setup.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function quickSetup() {
  console.log('🚀 Quick admin setup...\n');

  try {
    // 1. List users
    console.log('1️⃣ Looking up users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error:', usersError.message);
      return;
    }

    if (users.users.length === 0) {
      console.log('⚠️  No users found. Create an account first via /admin/login');
      return;
    }

    console.log(`📋 ${users.users.length} user(s) found:`);
    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    // 2. Use the first user
    const user = users.users[0];
    console.log(`\n2️⃣ Configuring ${user.email} as admin...`);

    // 3. Create the admin_users table if needed
    const { error: tableError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      console.log('📋 Creating the admin_users table...');

      // Run the creation SQL
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.admin_users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
          );

          ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
          GRANT ALL ON public.admin_users TO authenticated;
          GRANT SELECT ON public.admin_users TO anon;
        `
      });

      if (sqlError) {
        console.log('⚠️  Could not create the table automatically.');
        console.log('📋 Run this manually in the Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.admin_users TO authenticated;

INSERT INTO public.admin_users (id) VALUES ('${user.id}');
        `);
        return;
      }
    }

    // 4. Add the user as an admin
    const { error: insertError } = await supabase
      .from('admin_users')
      .upsert({ id: user.id });

    if (insertError) {
      console.error('❌ Error adding the admin:', insertError.message);
      console.log('\n📋 Run this manually in Supabase:');
      console.log(`INSERT INTO public.admin_users (id) VALUES ('${user.id}') ON CONFLICT (id) DO NOTHING;`);
      return;
    }

    console.log('✅ Setup completed successfully!');
    console.log(`📧 Admin: ${user.email}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log('\n🔗 You can now access:');
    console.log('   • http://localhost:9003/admin/login');
    console.log('   • http://localhost:9003/admin (after signing in)');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

quickSetup();
