# Configuration Supabase - Clinique Dentaire Valerio

## 🗄️ Structure de la Base de Données

### Tables Créées

#### 1. **appointments** - Rendez-vous
```sql
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL
);
```

#### 2. **contact_messages** - Messages de Contact
```sql
CREATE TABLE public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'unread' NOT NULL
);
```

#### 3. **testimonials** - Témoignages
```sql
CREATE TABLE public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quote TEXT NOT NULL,
  location TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending_approval' NOT NULL
);
```

## 🔐 Politiques RLS (Row Level Security)

### Politiques Publiques
```sql
-- Permettre l'insertion publique pour les formulaires
CREATE POLICY "Public insert access for appointments" ON public.appointments
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public insert access for contact_messages" ON public.contact_messages
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public insert access for testimonials" ON public.testimonials
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Permettre la lecture des témoignages approuvés
CREATE POLICY "Public read access for approved testimonials" ON public.testimonials
FOR SELECT TO anon, authenticated USING (status = 'approved');
```

### Politiques Admin
```sql
-- Accès complet pour les administrateurs
CREATE POLICY "Admin full access for appointments" ON public.appointments
FOR ALL TO authenticated USING (auth.role() = 'admin_role') WITH CHECK (auth.role() = 'admin_role');

CREATE POLICY "Admin full access for contact_messages" ON public.contact_messages
FOR ALL TO authenticated USING (auth.role() = 'admin_role') WITH CHECK (auth.role() = 'admin_role');

CREATE POLICY "Admin full access for testimonials" ON public.testimonials
FOR ALL TO authenticated USING (auth.role() = 'admin_role') WITH CHECK (auth.role() = 'admin_role');
```

## 👤 Configuration de l'Utilisateur Admin

### 1. Créer un utilisateur admin
```sql
-- Remplacer l'ID par l'ID de votre utilisateur
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin_role"}'::jsonb
WHERE id = 'VOTRE_USER_ID';
```

### 2. Variables d'Environnement
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wyospvndshfmkqvwkefn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b3Nwdm5kc2hmbWtxdndrZWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjU3OTEsImV4cCI6MjA2Mjg0MTc5MX0.ilCgAzO_kpOC2iUbeyhNmz_5tp5CA3L5ddwsV1GYegI
```

## 🚀 Déploiement sur Vercel

### 1. Configuration Vercel
Le fichier `vercel.json` est déjà configuré avec :
- Headers de cache pour les images
- Variables d'environnement Supabase
- Optimisations de performance

### 2. Variables d'Environnement Vercel
Dans le dashboard Vercel, configurez :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Déploiement
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

## 🔧 Fonctionnalités Admin

### Dashboard
- **URL** : `/admin`
- **Statistiques** : Rendez-vous, messages, témoignages
- **Graphiques** : Taux de réussite, activité mensuelle
- **Actions rapides** : Accès aux différentes sections

### Gestion des Rendez-vous
- **URL** : `/admin/appointments`
- **Actions** : Confirmer, compléter, annuler
- **Filtres** : Par statut, date, urgence
- **Détails** : Informations complètes du patient

### Messages de Contact
- **URL** : `/admin/messages`
- **Statuts** : Non lu, lu, archivé
- **Réponses** : Interface de réponse intégrée

### Témoignages
- **URL** : `/admin/testimonials`
- **Modération** : Approuver, rejeter
- **Prévisualisation** : Avant publication

## 🔒 Sécurité

### Authentification
- **Supabase Auth** : Gestion des sessions
- **RLS** : Protection au niveau de la base de données
- **Middleware** : Vérification des rôles

### Headers de Sécurité
- **CSP** : Content Security Policy
- **HSTS** : HTTP Strict Transport Security
- **X-Frame-Options** : Protection contre le clickjacking
- **X-Content-Type-Options** : Protection MIME sniffing

## 📊 Types TypeScript

Les types sont définis dans `src/lib/types_db.ts` et `src/lib/types.ts` :
- `AppointmentSupabase`
- `ContactMessageSupabase`
- `TestimonialSupabase`

## 🎨 Interface Utilisateur

### Thème
- **Basculement** : Clic direct sur l'icône soleil/lune
- **Transition** : Animation fluide de 300ms
- **Responsive** : Adaptation mobile/desktop

### Navigation
- **Admin** : Sidebar avec navigation rapide
- **Public** : Menu principal multilingue
- **Breadcrumbs** : Navigation contextuelle

## 🚨 Dépannage

### Erreurs Courantes

#### 1. Erreur 404 Admin
- Vérifier que l'utilisateur a le rôle `admin_role`
- Vérifier les politiques RLS
- Vérifier la configuration Supabase

#### 2. Images 404
- Vérifier que les images sont dans `public/images/`
- Vérifier la configuration Next.js
- Redémarrer le serveur de développement

#### 3. Erreurs TypeScript
- Vérifier les types dans `src/lib/types.ts`
- Vérifier la correspondance avec le schéma Supabase
- Exécuter `npm run build` pour vérifier

### Logs de Débogage
```bash
# Vérifier les logs Supabase
supabase logs

# Vérifier les logs Next.js
npm run dev
```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de la console
2. Vérifier la configuration Supabase
3. Vérifier les variables d'environnement
4. Redémarrer le serveur de développement

---

**Dernière mise à jour** : $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Version** : 1.0.0
**Statut** : ✅ Prêt pour production 