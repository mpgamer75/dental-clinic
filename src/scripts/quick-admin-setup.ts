// Script rapide pour configurer un admin
// Usage: npx tsx src/scripts/quick-admin-setup.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Vérifiez votre fichier .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function quickSetup() {
  console.log('🚀 Configuration rapide de l\'admin...\n');

  try {
    // 1. Lister les utilisateurs
    console.log('1️⃣ Recherche des utilisateurs...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erreur:', usersError.message);
      return;
    }

    if (users.users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé. Créez d\'abord un compte via /admin/login');
      return;
    }

    console.log(`📋 ${users.users.length} utilisateur(s) trouvé(s):`);
    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    // 2. Prendre le premier utilisateur
    const user = users.users[0];
    console.log(`\n2️⃣ Configuration de ${user.email} comme admin...`);

    // 3. Créer la table admin_users si nécessaire
    const { error: tableError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      console.log('📋 Création de la table admin_users...');
      
      // Exécuter le SQL de création
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
        console.log('⚠️  Impossible de créer la table automatiquement.');
        console.log('📋 Exécutez manuellement dans Supabase SQL Editor:');
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

    // 4. Ajouter l'utilisateur comme admin
    const { error: insertError } = await supabase
      .from('admin_users')
      .upsert({ id: user.id });

    if (insertError) {
      console.error('❌ Erreur lors de l\'ajout:', insertError.message);
      console.log('\n📋 Exécutez manuellement dans Supabase:');
      console.log(`INSERT INTO public.admin_users (id) VALUES ('${user.id}') ON CONFLICT (id) DO NOTHING;`);
      return;
    }

    console.log('✅ Configuration terminée avec succès!');
    console.log(`📧 Admin: ${user.email}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log('\n🔗 Vous pouvez maintenant accéder à:');
    console.log('   • http://localhost:9003/admin/login');
    console.log('   • http://localhost:9003/admin (après connexion)');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

quickSetup();
