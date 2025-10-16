-- Configuration optimisée de la base de données pour la clinique dentaire
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table admin_users (système d'authentification simplifié)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Désactiver RLS sur admin_users pour simplifier l'accès
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- 3. Donner accès complet aux utilisateurs authentifiés
GRANT ALL ON public.admin_users TO authenticated;
GRANT SELECT ON public.admin_users TO anon;

-- 4. Créer ou mettre à jour la table appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Créer ou mettre à jour la table contact_messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'unread' NOT NULL CHECK (status IN ('unread', 'read', 'archived')),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Créer ou mettre à jour la table testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quote TEXT NOT NULL,
  location TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending_approval' NOT NULL CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Créer la table app_settings pour la configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name_es TEXT DEFAULT 'Clínica Dental Orthoprotesis',
  clinic_name_en TEXT DEFAULT 'Orthoprotesis Dental Clinic',
  doctor_name_es TEXT DEFAULT 'Dr. Francis Valerio',
  doctor_name_en TEXT DEFAULT 'Dr. Francis Valerio',
  address_es TEXT DEFAULT 'Dirección de la clínica',
  address_en TEXT DEFAULT 'Clinic address',
  phone_es TEXT DEFAULT '+1 (809) 123-4567',
  phone_en TEXT DEFAULT '+1 (809) 123-4567',
  email TEXT DEFAULT 'info@orthoprotesis.com',
  schedule_es TEXT DEFAULT 'Lunes a Viernes: 8:00 AM - 6:00 PM',
  schedule_en TEXT DEFAULT 'Monday to Friday: 8:00 AM - 6:00 PM',
  map_link_es TEXT DEFAULT 'https://maps.google.com',
  map_link_en TEXT DEFAULT 'https://maps.google.com',
  embed_map_link_es TEXT DEFAULT 'https://www.google.com/maps/embed',
  embed_map_link_en TEXT DEFAULT 'https://www.google.com/maps/embed',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_appointments BOOLEAN DEFAULT TRUE,
  allow_testimonials BOOLEAN DEFAULT TRUE,
  allow_contact_form BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Configurer RLS pour les tables principales
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 9. Politiques RLS simplifiées

-- Appointments: Public peut insérer, admins peuvent tout faire
DROP POLICY IF EXISTS "Public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin full access appointments" ON public.appointments;

CREATE POLICY "Public insert appointments" 
ON public.appointments FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Admin full access appointments" 
ON public.appointments FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Contact messages: Public peut insérer, admins peuvent tout faire
DROP POLICY IF EXISTS "Public insert contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admin full access contact_messages" ON public.contact_messages;

CREATE POLICY "Public insert contact_messages" 
ON public.contact_messages FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Admin full access contact_messages" 
ON public.contact_messages FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- Testimonials: Public peut insérer et lire les approuvés, admins peuvent tout faire
DROP POLICY IF EXISTS "Public insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public read approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admin full access testimonials" ON public.testimonials;

CREATE POLICY "Public insert testimonials" 
ON public.testimonials FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Public read approved testimonials" 
ON public.testimonials FOR SELECT 
TO anon, authenticated 
USING (status = 'approved');

CREATE POLICY "Admin full access testimonials" 
ON public.testimonials FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- App settings: Seuls les admins peuvent accéder
DROP POLICY IF EXISTS "Admin full access app_settings" ON public.app_settings;

CREATE POLICY "Admin full access app_settings" 
ON public.app_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
);

-- 10. Insérer les paramètres par défaut
INSERT INTO public.app_settings (id) 
VALUES (gen_random_uuid()) 
ON CONFLICT DO NOTHING;

-- 11. Fonctions utilitaires

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;
DROP TRIGGER IF EXISTS update_testimonials_updated_at ON public.testimonials;
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;

CREATE TRIGGER update_appointments_updated_at 
BEFORE UPDATE ON public.appointments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at 
BEFORE UPDATE ON public.contact_messages 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at 
BEFORE UPDATE ON public.testimonials 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at 
BEFORE UPDATE ON public.app_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
BEFORE UPDATE ON public.admin_users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Vues utiles pour les statistiques
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.appointments WHERE status = 'pending') as pending_appointments,
  (SELECT COUNT(*) FROM public.contact_messages WHERE status = 'unread') as unread_messages,
  (SELECT COUNT(*) FROM public.testimonials WHERE status = 'pending_approval') as pending_testimonials,
  (SELECT COUNT(*) FROM public.appointments) as total_appointments,
  (SELECT COUNT(*) FROM public.contact_messages) as total_messages,
  (SELECT COUNT(*) FROM public.testimonials WHERE status = 'approved') as approved_testimonials;

-- Donner accès à la vue aux admins
GRANT SELECT ON admin_stats TO authenticated;

-- 13. Instructions finales
-- Pour ajouter un utilisateur admin, utilisez cette commande en remplaçant USER_ID:
-- INSERT INTO public.admin_users (id) VALUES ('USER_ID_HERE') ON CONFLICT (id) DO NOTHING;

-- Pour voir tous les utilisateurs:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
