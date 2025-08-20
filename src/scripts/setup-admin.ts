// Script pour configurer automatiquement un utilisateur admin
// Usage: npx tsx src/scripts/setup-admin.ts <email>

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/types_db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Assurez-vous d\'avoir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre .env.local');
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
    console.log('🔍 Recherche des utilisateurs...');
    
    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }

    console.log(`📋 ${users.users.length} utilisateur(s) trouvé(s):`);
    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    let targetUser;
    
    if (email) {
      targetUser = users.users.find(user => user.email === email);
      if (!targetUser) {
        console.error(`❌ Utilisateur avec l'email ${email} non trouvé`);
        return;
      }
    } else {
      // Prendre le premier utilisateur s'il n'y en a qu'un
      if (users.users.length === 1) {
        targetUser = users.users[0];
      } else {
        console.log('⚠️  Plusieurs utilisateurs trouvés. Spécifiez un email:');
        console.log('npx tsx src/scripts/setup-admin.ts <email>');
        return;
      }
    }

    console.log(`👤 Configuration de ${targetUser.email} comme admin...`);

    // Vérifier si la table admin_users existe et créer si nécessaire
    const { error: tableError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('relation "admin_users" does not exist')) {
      console.log('📋 Création de la table admin_users...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.admin_users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
          );
          
          ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Admins can view admin_users" 
          ON public.admin_users FOR SELECT 
          TO authenticated 
          USING (
            EXISTS (
              SELECT 1 FROM public.admin_users 
              WHERE admin_users.id = auth.uid()
            )
          );
        `
      });

      if (createError) {
        console.error('❌ Erreur lors de la création de la table:', createError);
        return;
      }
    }

    // Ajouter l'utilisateur comme admin
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({ id: targetUser.id })
      .select();

    if (insertError && !insertError.message.includes('duplicate key')) {
      console.error('❌ Erreur lors de l\'ajout de l\'admin:', insertError);
      return;
    }

    // Vérifier que ça a marché
    const { data: adminCheck, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', targetUser.id)
      .single();

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }

    console.log('✅ Utilisateur configuré comme admin avec succès!');
    console.log(`📧 Email: ${targetUser.email}`);
    console.log(`🆔 ID: ${targetUser.id}`);
    console.log(`📅 Ajouté le: ${adminCheck.created_at}`);
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];
setupAdmin(email);
