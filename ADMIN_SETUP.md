# Configuration de l'Administrateur

## 📋 **Prérequis**

Avant de commencer, assurez-vous d'avoir :
- ✅ Exécuté le script SQL `database-setup.sql` dans Supabase
- ✅ Configuré les variables d'environnement dans `.env.local`

## 🚀 **Méthode 1 : Configuration automatique (RECOMMANDÉ)**

### Étape 1 : Créer un compte utilisateur
```bash
# Démarrez le serveur
npm run dev

# Visitez http://localhost:9003/admin/login
# Essayez de vous connecter avec vos identifiants
# Vous aurez une erreur qui affichera votre ID utilisateur
```

### Étape 2 : Configurer comme admin
```bash
# Exécutez le script de diagnostic
npm run diagnose-admin

# OU exécutez le script de configuration rapide
npm run quick-admin
```

Le script ajoutera automatiquement le premier utilisateur trouvé comme admin.

## 🔧 **Méthode 2 : Configuration manuelle**

### Option A : Via Supabase SQL Editor

1. **Connectez-vous à Supabase** : https://supabase.com
2. **Ouvrez SQL Editor**
3. **Trouvez votre ID utilisateur** :
```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
```

4. **Ajoutez-vous comme admin** :
```sql
INSERT INTO public.admin_users (id) 
VALUES ('VOTRE_ID_UTILISATEUR_ICI') 
ON CONFLICT (id) DO NOTHING;
```

5. **Vérifiez** :
```sql
SELECT 
  u.id,
  u.email,
  CASE WHEN au.id IS NOT NULL THEN 'Admin' ELSE 'User' END as role
FROM auth.users u
LEFT JOIN public.admin_users au ON u.id = au.id;
```

### Option B : Via le message d'erreur

1. **Allez sur** : http://localhost:9003/admin/login
2. **Connectez-vous** avec vos identifiants
3. **L'erreur affichera** : "Aucun utilisateur admin configuré. Votre ID: xxx-xxx-xxx"
4. **Copiez l'ID** et utilisez-le dans la requête SQL ci-dessus

## ✅ **Vérification**

Une fois configuré, vous devriez pouvoir :
- ✅ Vous connecter sur `/admin/login`
- ✅ Être redirigé vers `/admin` (dashboard)
- ✅ Voir les statistiques et gérer le contenu

## 🐛 **Dépannage**

### Problème : "Variables d'environnement Supabase manquantes"
**Solution** : Vérifiez votre fichier `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service
```

### Problème : "Table admin_users non configurée"
**Solution** : Exécutez `database-setup.sql` dans Supabase SQL Editor

### Problème : "Erreur de base de données"
**Solution** : 
1. Vérifiez que la table existe : `SELECT * FROM public.admin_users;`
2. Vérifiez les permissions RLS
3. Assurez-vous que RLS est désactivé sur `admin_users`

### Problème : "La connexion ne redirige pas"
**Solution** :
1. Vérifiez que votre ID est bien dans `admin_users`
2. Videz le cache du navigateur
3. Réessayez en navigation privée

## 🔐 **Sécurité**

- ❌ **NE JAMAIS** commiter `.env.local`
- ✅ **Utilisez** des mots de passe forts
- ✅ **Limitez** l'accès admin aux personnes de confiance
- ✅ **Surveillez** les logs d'authentification dans Supabase

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console navigateur (F12)
2. Vérifiez les logs dans le terminal où tourne `npm run dev`
3. Consultez les logs Supabase (Dashboard > Logs)

