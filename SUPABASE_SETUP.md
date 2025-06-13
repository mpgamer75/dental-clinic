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





-- Nouvelles querys pour corriger le problème de non affichage des rdv et messages sur l'application 

-- 1. D'abord, créer la table admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Insérer votre utilisateur admin
INSERT INTO public.admin_users (id) 
VALUES ('47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa') 
ON CONFLICT (id) DO NOTHING;

-- 3. Activer RLS sur la table admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Politique pour que les admins puissent voir qui sont les autres admins
CREATE POLICY "Admins can view admin_users" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 5. Maintenant, supprimer toutes les anciennes politiques pour appointments
DROP POLICY IF EXISTS "Admin full access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert access for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON public.appointments;

-- 6. Créer les nouvelles politiques pour appointments
CREATE POLICY "Public can insert appointments" 
ON public.appointments FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Admins can view all appointments" 
ON public.appointments FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admins can update appointments" 
ON public.appointments FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admins can delete appointments" 
ON public.appointments FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 7. Politiques pour contact_messages
DROP POLICY IF EXISTS "Admin full access for contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public insert access for contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can insert contact_messages" ON public.contact_messages;

CREATE POLICY "Public can insert contact_messages" 
ON public.contact_messages FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Admins can view all contact_messages" 
ON public.contact_messages FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admins can update contact_messages" 
ON public.contact_messages FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admins can delete contact_messages" 
ON public.contact_messages FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 8. Politiques pour testimonials
DROP POLICY IF EXISTS "Admin full access for testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public insert access for testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public read access for approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public can insert testimonials" ON public.testimonials;

CREATE POLICY "Public can insert testimonials" 
ON public.testimonials FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Public read access for approved testimonials" 
ON public.testimonials FOR SELECT 
TO anon, authenticated 
USING (status = 'approved');

CREATE POLICY "Admins can view all testimonials" 
ON public.testimonials FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admins can update testimonials" 
ON public.testimonials FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admins can delete testimonials" 
ON public.testimonials FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 9. Vérifier que tout est bien configuré
SELECT * FROM public.admin_users;

-- 13 Juin 2025 

-- 1. Créer la table app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name_es TEXT NOT NULL DEFAULT 'Orthoprotesis Dental Clinic',
  clinic_name_en TEXT NOT NULL DEFAULT 'Orthoprotesis Dental Clinic',
  doctor_name_es TEXT NOT NULL DEFAULT 'Dr. Francis Valerio',
  doctor_name_en TEXT NOT NULL DEFAULT 'Dr. Francis Valerio',
  address_es TEXT NOT NULL DEFAULT 'Plaza Las Ramblas, Módulo 101, Santiago de los Caballeros, República Dominicana',
  address_en TEXT NOT NULL DEFAULT 'Plaza Las Ramblas, Module 101, Santiago de los Caballeros, Dominican Republic',
  phone_es TEXT NOT NULL DEFAULT '809-581-7059',
  phone_en TEXT NOT NULL DEFAULT '809-581-7059',
  email TEXT NOT NULL DEFAULT 'info@orthoprotesisdental.com',
  schedule_es TEXT NOT NULL DEFAULT 'Lunes a Viernes: 9:00 AM - 6:00 PM',
  schedule_en TEXT NOT NULL DEFAULT 'Monday to Friday: 9:00 AM - 6:00 PM',
  map_link_es TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=Plaza+Las+Ramblas+Santiago+de+los+Caballeros',
  map_link_en TEXT NOT NULL DEFAULT 'https://maps.google.com/?q=Plaza+Las+Ramblas+Santiago+de+los+Caballeros',
  embed_map_link_es TEXT NOT NULL DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4060.840856210959!2d-70.69729749999999!3d19.4541221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eb1cf5f2201f147%3A0xf5965af18d5482e2!2sPlaza%20las%20Ramblas!5e1!3m2!1sfr!2sdo!4v1749698637474!5m2!1sfr!2sdo',
  embed_map_link_en TEXT NOT NULL DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4060.840856210959!2d-70.69729749999999!3d19.4541221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eb1cf5f2201f147%3A0xf5965af18d5482e2!2sPlaza%20las%20Ramblas!5e1!3m2!1sfr!2sdo!4v1749698637474!5m2!1sfr!2sdo',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_appointments BOOLEAN DEFAULT TRUE,
  allow_testimonials BOOLEAN DEFAULT TRUE,
  allow_contact_form BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Activer RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Politique pour les admins
CREATE POLICY "Admins can manage app_settings" 
ON public.app_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 4. Insérer les paramètres par défaut
INSERT INTO public.app_settings (id) 
VALUES (gen_random_uuid()) 
ON CONFLICT DO NOTHING;


-- MAJ de amin_role 

-- 1. Vérifier que la table admin_users existe
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Activer RLS si pas déjà fait
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Ajouter votre utilisateur comme admin (remplacez l'ID par le vôtre)
INSERT INTO public.admin_users (id) 
VALUES ('47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa') 
ON CONFLICT (id) DO NOTHING;

-- 4. Mettre à jour les métadonnées utilisateur pour la compatibilité
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin_role"}'::jsonb
WHERE id = '47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa';

-- 5. Vérifier que l'utilisateur est bien admin
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data,
  CASE WHEN au.id IS NOT NULL THEN 'Admin' ELSE 'User' END as role
FROM auth.users u
LEFT JOIN public.admin_users au ON u.id = au.id
WHERE u.id = '47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa';








-- Vérifier si vous êtes dans admin_users
SELECT * FROM public.admin_users WHERE id = '47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa';

-- Si pas de résultat, ajouter votre utilisateur
INSERT INTO public.admin_users (id) 
VALUES ('47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa') 
ON CONFLICT (id) DO NOTHING;

-- Vérifier que ça a marché
SELECT * FROM public.admin_users WHERE id = '47f980bb-6cf4-4e0a-9f47-e87ea1f5d3aa';