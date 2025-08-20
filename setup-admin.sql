-- Script pour configurer un utilisateur admin
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, créer la table admin_users si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Activer RLS sur la table admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Politique pour que les admins puissent voir qui sont les autres admins
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 4. Voir tous les utilisateurs existants pour trouver votre ID
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- 5. Une fois que vous avez trouvé votre ID utilisateur, remplacez 'VOTRE_USER_ID_ICI' 
--    par votre vrai ID et exécutez cette ligne :
-- INSERT INTO public.admin_users (id) 
-- VALUES ('VOTRE_USER_ID_ICI') 
-- ON CONFLICT (id) DO NOTHING;

-- 6. Vérifier que l'utilisateur est bien admin
-- SELECT 
--   u.id,
--   u.email,
--   CASE WHEN au.id IS NOT NULL THEN 'Admin' ELSE 'User' END as role
-- FROM auth.users u
-- LEFT JOIN public.admin_users au ON u.id = au.id
-- WHERE u.id = 'VOTRE_USER_ID_ICI';
