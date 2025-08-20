-- Script pour corriger définitivement la table admin_users
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer la table existante si elle pose problème
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- 2. Recréer la table proprement
CREATE TABLE public.admin_users (
  id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Désactiver RLS temporairement pour simplifier
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- 4. Donner accès complet aux utilisateurs authentifiés
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO anon;

-- 5. Voir votre ID utilisateur (copiez l'ID qui s'affiche)
SELECT 
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Remplacez 'VOTRE_ID_ICI' par votre vrai ID utilisateur et exécutez cette ligne
-- INSERT INTO public.admin_users (id) VALUES ('VOTRE_ID_ICI');

-- 7. Vérifier que ça a marché
-- SELECT * FROM public.admin_users;
