-- Script pour ajouter un utilisateur comme admin
-- 1. D'abord, voir tous les utilisateurs existants

SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Copiez l'ID de l'utilisateur que vous voulez rendre admin
-- 3. Remplacez 'VOTRE_ID_ICI' par l'ID copié et exécutez la ligne suivante :

-- INSERT INTO public.admin_users (id) VALUES ('VOTRE_ID_ICI') ON CONFLICT (id) DO NOTHING;

-- 4. Vérifiez que ça a marché :

SELECT 
  u.id,
  u.email,
  au.created_at as admin_since,
  CASE WHEN au.id IS NOT NULL THEN '✅ Admin' ELSE '❌ User' END as role
FROM auth.users u
LEFT JOIN public.admin_users au ON u.id = au.id
ORDER BY u.created_at DESC;
