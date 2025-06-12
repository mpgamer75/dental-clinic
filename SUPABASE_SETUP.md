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



# Vue d'ensemble des tables et politiques 

CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL -- Ej: pending, confirmed, cancelled, completed
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public insert access for new appointments
-- This allows anyone (anon role) to insert a new appointment, which is needed for your public form.
CREATE POLICY "Public insert access for appointments" ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Example RLS Policies for an Admin Panel (you would create these for authenticated admin users)
-- CREATE POLICY "Admin full access for appointments" ON public.appointments
-- FOR ALL
-- TO authenticated
-- USING (auth.role() = 'admin_role'); -- Replace 'admin_role' with your actual admin role


CREATE TABLE public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'unread' NOT NULL -- Ej: unread, read, archived
);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public insert access for new contact messages
CREATE POLICY "Public insert access for contact_messages" ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Example RLS Policies for an Admin Panel
-- CREATE POLICY "Admin full access for contact_messages" ON public.contact_messages
-- FOR ALL
-- TO authenticated
-- USING (auth.role() = 'admin_role');

CREATE TABLE public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quote TEXT NOT NULL,
  location TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending_approval' NOT NULL -- Ej: pending_approval, approved, rejected
);

-- Enable Row Level Security
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public insert access for new testimonials
CREATE POLICY "Public insert access for testimonials" ON public.testimonials
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- RLS Policy: Allow public read access ONLY for approved testimonials
CREATE POLICY "Public read access for approved testimonials" ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Example RLS Policies for an Admin Panel
-- CREATE POLICY "Admin full access for testimonials" ON public.testimonials
-- FOR ALL
-- TO authenticated
-- USING (auth.role() = 'admin_role');


-- For the 'appointments' table
-- Assumes you have an 'admin_role' for your authenticated admin users.
-- You might need to create this role or manage user roles via metadata in Supabase Auth.
CREATE POLICY "Admin full access for appointments"
ON public.appointments
FOR ALL
TO authenticated -- This policy applies to any authenticated user
USING (auth.role() = 'admin_role') -- Checks if the authenticated user has the 'admin_role'
WITH CHECK (auth.role() = 'admin_role');

-- For the 'contact_messages' table
CREATE POLICY "Admin full access for contact_messages"
ON public.contact_messages
FOR ALL
TO authenticated
USING (auth.role() = 'admin_role')
WITH CHECK (auth.role() = 'admin_role');

-- For the 'testimonials' table
-- (The RLS for public select of 'approved' testimonials should already exist)
CREATE POLICY "Admin full access for testimonials"
ON public.testimonials
FOR ALL
TO authenticated
USING (auth.role() = 'admin_role')
WITH CHECK (auth.role() = 'admin_role');


UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin_role"}'::jsonb
WHERE id = '47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa';





-- Nouvelles querys pour corriger le problème de non affichage des rdv et messages sur l'application _crypto_aead_det_decrypt

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admin full access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert access for appointments" ON public.appointments;

-- Créer les nouvelles politiques
-- Permettre l'insertion publique
CREATE POLICY "Public can insert appointments" 
ON public.appointments FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Permettre la lecture pour les admins (en utilisant les métadonnées JWT)
CREATE POLICY "Admins can view all appointments" 
ON public.appointments FOR SELECT 
TO authenticated 
USING (
  auth.jwt() ->> 'user_metadata' ::jsonb ->> 'role' = 'admin_role'
  OR 
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin_role'
);

-- Permettre la mise à jour pour les admins
CREATE POLICY "Admins can update appointments" 
ON public.appointments FOR UPDATE 
TO authenticated 
USING (
  auth.jwt() ->> 'user_metadata' ::jsonb ->> 'role' = 'admin_role'
  OR 
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin_role'
)
WITH CHECK (
  auth.jwt() ->> 'user_metadata' ::jsonb ->> 'role' = 'admin_role'
  OR 
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin_role'
);

-- Permettre la suppression pour les admins
CREATE POLICY "Admins can delete appointments" 
ON public.appointments FOR DELETE 
TO authenticated 
USING (
  auth.jwt() ->> 'user_metadata' ::jsonb ->> 'role' = 'admin_role'
  OR 
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin_role'
);
