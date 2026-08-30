# 🧪 TESTS DE VÉRIFICATION

## Test 1️⃣ : Hydratation corrigée

### Commandes
```bash
npm run dev
```

### Étapes
1. Ouvrir la console du navigateur (F12)
2. Aller sur http://localhost:9003
3. Rafraîchir la page (F5) 3-4 fois
4. Naviguer entre les pages (es/en)
5. Changer le thème (clair/sombre)

### Résultats attendus ✅
- ❌ Plus d'erreur "Hydration failed"
- ✅ Console propre (sauf warnings normaux)
- ✅ UI stable après chaque refresh
- ✅ Navigation fluide
- ✅ Thème fonctionne correctement

---

## Test 2️⃣ : Connexion admin

### Prérequis
Votre utilisateur doit être dans la table `admin_users`. Si ce n'est pas fait :

```sql
-- 1. Trouver votre ID
SELECT id, email FROM auth.users;

-- 2. Ajouter votre ID
INSERT INTO admin_users (id) VALUES ('VOTRE_ID_ICI');
```

### Étapes
1. Aller sur http://localhost:9003/admin/login
2. Entrer email/mot de passe
3. Cliquer "Iniciar Sesión"
4. Observer la console (F12)

### Résultats attendus ✅
- ✅ Message console : "🔍 Vérification admin pour: [votre-id]"
- ✅ Message console : "✅ Connexion réussie, redirection vers /admin"
- ✅ Redirection automatique après ~100ms
- ✅ Page `/admin` se charge correctement
- ✅ Voir votre email dans le header du dashboard

### Si erreur "Acceso denegado"
```sql
-- Vérifier que vous êtes bien dans admin_users
SELECT * FROM admin_users WHERE id = 'VOTRE_ID';

-- Si rien ne s'affiche, ajouter :
INSERT INTO admin_users (id) VALUES ('VOTRE_ID');
```

---

## Test 3️⃣ : Dashboard admin

### Étapes
1. Une fois connecté sur `/admin`
2. Vérifier les statistiques (messages, citas, testimonios)
3. Cliquer sur "Ver sitio web"
4. Cliquer sur "Cerrar sesión"

### Résultats attendus ✅
- ✅ Statistiques s'affichent (même si à 0)
- ✅ Cartes interactives (hover effects)
- ✅ "Ver sitio web" redirige vers `/es`
- ✅ "Cerrar sesión" déconnecte et redirige vers `/es`

---

## Test 4️⃣ : Sécurité

### Étapes
1. Se déconnecter
2. Essayer d'accéder à http://localhost:9003/admin

### Résultats attendus ✅
- ✅ Redirection automatique vers `/admin/login`
- ✅ Pas d'accès au dashboard sans authentification

---

## 📝 Checklist complète

- [ ] Pas d'erreur d'hydratation
- [ ] Navigation navbar fonctionne
- [ ] Thème clair/sombre fonctionne
- [ ] Changement de langue fonctionne
- [ ] Connexion admin redirige vers `/admin`
- [ ] Dashboard admin s'affiche
- [ ] Statistiques visibles
- [ ] Déconnexion fonctionne
- [ ] Sécurité des routes `/admin` active

---

## 🆘 En cas de problème

### Problème : Erreur d'hydratation persiste
**Solution** :
```bash
# 1. Vider le cache Next.js
rm -rf .next

# 2. Redémarrer
npm run dev
```

### Problème : Connexion ne redirige pas
**Console attendue** :
```
🔍 Vérification admin pour: abc123...
📋 Résultat vérification admin: { adminData: {...}, adminError: null }
✅ Connexion réussie, redirection vers /admin
```

**Si bloqué** :
1. Vérifier la console pour voir où ça bloque
2. Vérifier que `admin_users` contient votre ID
3. Vérifier que les variables d'env sont correctes

### Problème : Dashboard ne se charge pas
**Vérifier** :
1. Session établie : `await supabase.auth.getSession()` retourne une session
2. Admin vérifié : `admin_users` contient l'ID
3. RLS policies : Supabase > Authentication > Policies

---

**Date** : 2025-10-16

