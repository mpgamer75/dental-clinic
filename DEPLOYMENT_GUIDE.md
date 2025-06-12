# Guide de Déploiement Professionnel - Clinique Dentaire

## 🚀 Vue d'ensemble

Ce guide vous accompagne dans le déploiement de votre application de clinique dentaire sur Vercel avec Supabase comme backend. L'application est optimisée pour la production avec des fonctionnalités de sécurité, de performance et de monitoring.

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Compte Supabase (gratuit)
- Node.js 18+ installé localement
- Git installé

## 🗄️ Configuration Supabase

### 1. Création du projet

1. Connectez-vous à [Supabase](https://supabase.com)
2. Cliquez sur "New Project"
3. Choisissez votre organisation
4. Remplissez les informations :
   - **Nom du projet** : `valerio-dental-clinic`
   - **Mot de passe de base de données** : Générer un mot de passe fort
   - **Région** : Choisissez la région la plus proche de vos utilisateurs
5. Cliquez sur "Create new project"

### 2. Configuration de la base de données

Une fois le projet créé, exécutez le script SQL suivant dans l'éditeur SQL de Supabase :

```sql
-- Création des tables principales
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  service_type TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  quote TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name_es TEXT NOT NULL DEFAULT 'Clínica Dental Valerio',
  clinic_name_en TEXT NOT NULL DEFAULT 'Valerio Dental Clinic',
  doctor_name_es TEXT NOT NULL DEFAULT 'Dr. Valerio',
  doctor_name_en TEXT NOT NULL DEFAULT 'Dr. Valerio',
  address_es TEXT NOT NULL,
  address_en TEXT NOT NULL,
  phone_es TEXT NOT NULL,
  phone_en TEXT NOT NULL,
  email TEXT NOT NULL,
  schedule_es TEXT NOT NULL,
  schedule_en TEXT NOT NULL,
  map_link_es TEXT,
  map_link_en TEXT,
  embed_map_link_es TEXT,
  embed_map_link_en TEXT,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_appointments BOOLEAN DEFAULT TRUE,
  allow_testimonials BOOLEAN DEFAULT TRUE,
  allow_contact_form BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des paramètres par défaut
INSERT INTO app_settings (
  clinic_name_es, clinic_name_en,
  doctor_name_es, doctor_name_en,
  address_es, address_en,
  phone_es, phone_en,
  email,
  schedule_es, schedule_en
) VALUES (
  'Clínica Dental Valerio',
  'Valerio Dental Clinic',
  'Dr. Valerio',
  'Dr. Valerio',
  'Calle Principal #123, Santo Domingo',
  'Main Street #123, Santo Domingo',
  '+1 (809) 555-0123',
  '+1 (809) 555-0123',
  'info@valeriodental.com',
  'Lunes a Viernes: 8:00 AM - 6:00 PM',
  'Monday to Friday: 8:00 AM - 6:00 PM'
) ON CONFLICT DO NOTHING;

-- Création des politiques RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Politiques pour les rendez-vous
CREATE POLICY "Anyone can insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politiques pour les messages
CREATE POLICY "Anyone can insert messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all messages" ON contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update messages" ON contact_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politiques pour les témoignages
CREATE POLICY "Anyone can insert testimonials" ON testimonials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view approved testimonials" ON testimonials
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Admins can view all testimonials" ON testimonials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update testimonials" ON testimonials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Politiques pour les paramètres
CREATE POLICY "Anyone can view settings" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON app_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Création d'un utilisateur admin par défaut
INSERT INTO users (email, role) VALUES ('admin@valeriodental.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Fonctions pour les timestamps automatiques
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour les timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Configuration de l'authentification

1. Dans Supabase, allez dans **Authentication** > **Settings**
2. Configurez les paramètres suivants :
   - **Site URL** : `https://votre-domaine.vercel.app`
   - **Redirect URLs** : 
     - `https://votre-domaine.vercel.app/auth/callback`
     - `https://votre-domaine.vercel.app/admin`
3. Activez les providers d'authentification souhaités (Email par défaut)

### 4. Récupération des clés API

1. Allez dans **Settings** > **API**
2. Notez les informations suivantes :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** (clé publique)
   - **service_role** (clé privée - à garder secrète)

## 🌐 Déploiement Vercel

### 1. Préparation du code

1. Assurez-vous que votre code est sur GitHub
2. Vérifiez que le fichier `vercel.json` est présent à la racine
3. Vérifiez que `next.config.mjs` est configuré pour la production

### 2. Connexion à Vercel

1. Allez sur [Vercel](https://vercel.com)
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur "New Project"
4. Importez votre repository GitHub

### 3. Configuration du projet

1. **Nom du projet** : `valerio-dental-clinic`
2. **Framework Preset** : Next.js (détecté automatiquement)
3. **Root Directory** : `./` (par défaut)
4. **Build Command** : `npm run build` (par défaut)
5. **Output Directory** : `.next` (par défaut)
6. **Install Command** : `npm install` (par défaut)

### 4. Variables d'environnement

Ajoutez les variables d'environnement suivantes dans Vercel :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_privee_service_role

# Admin
ADMIN_EMAIL=admin@valeriodental.com

# Google AI (optionnel)
GOOGLE_AI_API_KEY=votre_cle_google_ai

# Autres
NODE_ENV=production
```

### 5. Déploiement

1. Cliquez sur "Deploy"
2. Attendez que le build se termine (2-3 minutes)
3. Votre application sera disponible à l'URL fournie par Vercel

## 🔧 Configuration post-déploiement

### 1. Domaine personnalisé (optionnel)

1. Dans Vercel, allez dans **Settings** > **Domains**
2. Ajoutez votre domaine personnalisé
3. Configurez les enregistrements DNS selon les instructions de Vercel

### 2. Configuration SSL

Vercel configure automatiquement SSL pour tous les domaines.

### 3. Variables d'environnement de production

Mettez à jour les variables d'environnement dans Supabase avec l'URL de production :

1. **Authentication** > **Settings**
2. **Site URL** : `https://votre-domaine.vercel.app`
3. **Redirect URLs** : 
   - `https://votre-domaine.vercel.app/auth/callback`
   - `https://votre-domaine.vercel.app/admin`

## 🧹 Nettoyage des données de test

Avant la mise en production, nettoyez les données de test :

```bash
# Localement
npm run cleanup:test-data

# Ou via l'interface Supabase
# Allez dans Table Editor et supprimez manuellement les données de test
```

## 🔒 Sécurité

### 1. Politiques de sécurité

Les politiques RLS sont déjà configurées dans le script SQL.

### 2. Headers de sécurité

Le fichier `next.config.mjs` inclut les headers de sécurité appropriés.

### 3. Variables d'environnement

- Ne partagez jamais les clés privées
- Utilisez des mots de passe forts
- Activez l'authentification à deux facteurs sur tous les comptes

## 📊 Monitoring et Analytics

### 1. Vercel Analytics

1. Dans Vercel, allez dans **Analytics**
2. Activez Vercel Analytics pour suivre les performances

### 2. Supabase Monitoring

1. Dans Supabase, allez dans **Reports**
2. Surveillez l'utilisation de la base de données
3. Configurez des alertes si nécessaire

## 🚀 Optimisations de performance

### 1. Images

- Utilisez le composant `next/image` pour l'optimisation automatique
- Configurez les formats WebP et AVIF
- Utilisez des tailles d'image appropriées

### 2. Cache

- Les fichiers statiques sont mis en cache automatiquement
- Configurez le cache des images dans `next.config.mjs`

### 3. Bundle

- Le code est automatiquement minifié
- Les imports sont optimisés
- Les chunks sont divisés automatiquement

## 🔄 Mises à jour

### 1. Déploiement automatique

Vercel déploie automatiquement à chaque push sur la branche principale.

### 2. Rollback

En cas de problème, vous pouvez revenir à une version précédente dans Vercel.

### 3. Prévisualisation

Chaque pull request génère une URL de prévisualisation.

## 📞 Support

### 1. Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### 2. Communauté

- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Community](https://github.com/supabase/supabase/discussions)

## ✅ Checklist de déploiement

- [ ] Projet Supabase créé et configuré
- [ ] Base de données initialisée avec le script SQL
- [ ] Authentification configurée
- [ ] Clés API récupérées
- [ ] Code poussé sur GitHub
- [ ] Projet Vercel créé
- [ ] Variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Données de test nettoyées
- [ ] Tests de fonctionnalités effectués
- [ ] Monitoring configuré

## 🎉 Félicitations !

Votre application de clinique dentaire est maintenant déployée en production avec :
- ✅ Performance optimisée
- ✅ Sécurité renforcée
- ✅ Monitoring en place
- ✅ Déploiement automatique
- ✅ Sauvegarde automatique (Supabase)

Votre site est prêt à accueillir vos patients !

