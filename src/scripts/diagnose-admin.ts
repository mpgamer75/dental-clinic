// Script de diagnostic pour identifier les problèmes admin
// Usage: npx tsx src/scripts/diagnose-admin.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/types_db';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseAdmin() {
  console.log('🔍 Diagnostic du système admin...\n');

  try {
    // 1. Vérifier la connexion Supabase
    console.log('1️⃣ Test de connexion Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);

    if (healthError) {
      if (healthError.message.includes('relation "admin_users" does not exist')) {
        console.log('❌ La table admin_users n\'existe pas');
        console.log('📋 Solution: Exécutez le script fix-admin-table.sql dans Supabase');
        return;
      } else {
        console.log('❌ Erreur de connexion:', healthError.message);
        return;
      }
    }
    console.log('✅ Connexion Supabase OK');

    // 2. Lister tous les utilisateurs
    console.log('\n2️⃣ Liste des utilisateurs:');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Erreur récupération utilisateurs:', usersError);
      return;
    }

    if (users.users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé');
      return;
    }

    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    // 3. Vérifier les admins existants
    console.log('\n3️⃣ Admins configurés:');
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('*');

    if (adminsError) {
      console.log('❌ Erreur récupération admins:', adminsError);
      return;
    }

    if (admins.length === 0) {
      console.log('⚠️  Aucun admin configuré');
      console.log('\n🔧 Pour ajouter un admin, exécutez:');
      users.users.forEach((user, index) => {
        console.log(`   ${index + 1}. INSERT INTO public.admin_users (id) VALUES ('${user.id}'); -- ${user.email}`);
      });
    } else {
      console.log('✅ Admins trouvés:');
      for (const admin of admins) {
        const user = users.users.find(u => u.id === admin.id);
        console.log(`   - ${user?.email || 'Email inconnu'} (ID: ${admin.id})`);
      }
    }

    // 4. Test d'accès avec un client normal
    console.log('\n4️⃣ Test d\'accès client normal...');
    const normalClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: testAccess, error: accessError } = await normalClient
      .from('admin_users')
      .select('id')
      .limit(1);

    if (accessError) {
      console.log('❌ Accès client normal bloqué:', accessError.message);
      console.log('💡 Cela peut être normal si RLS est activé');
    } else {
      console.log('✅ Accès client normal OK');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

diagnoseAdmin();
