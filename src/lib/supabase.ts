import { createClient } from '@supabase/supabase-js';
import type { Database } from './types_db'; // Import du type de base de données

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Client Supabase typé
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Remarque: Pour générer `types_db.ts` pour un client Supabase typé:
// 1. Installer Supabase CLI: `npm install supabase --save-dev` (ou globalement)
// 2. Se connecter: `npx supabase login`
// 3. Lier votre projet: `npx supabase link --project-ref YOUR_PROJECT_ID`
// 4. Générer les types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/types_db.ts`
// Remplacez YOUR_PROJECT_ID par l'ID réel de votre projet Supabase.
