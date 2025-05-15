
# Guía de Despliegue: Orthoprotesis Dental Clinic

Esta guía te ayudará a configurar y desplegar la aplicación de la clínica dental en producción.

## 1. Configuración del Proyecto Supabase

Necesitarás un proyecto de Supabase para almacenar los datos de citas, mensajes y testimonios.

1.  **Crear un Proyecto Supabase:**
    *   Ve a [Supabase](https://supabase.com/).
    *   Haz clic en "Start your project" y sigue los pasos para crear una nueva organización y un nuevo proyecto.
    *   Guarda tu **Project URL** y tu **anon public key**. Los necesitarás para las variables de entorno.

2.  **Configurar Tablas en Supabase:**
    *   En el dashboard de tu proyecto Supabase, ve a "SQL Editor" en el menú de la izquierda.
    *   Ejecuta los siguientes scripts SQL para crear las tablas necesarias:

    **Tabla: `appointments`**
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
      status TEXT DEFAULT 'pending' NOT NULL -- Ej: pending, confirmed, cancelled, completed
    );
    -- Enable Row Level Security
    ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

    -- RLS Policy: Permitir inserción pública (para el formulario del sitio web)
    CREATE POLICY "Public insert access for appointments" ON public.appointments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

    -- RLS Policy (Admin): Permitir acceso total a usuarios autenticados con el rol 'admin_role' en su metadata
    -- ¡Asegúrate de haber asignado {"role": "admin_role"} a la raw_user_meta_data de tus usuarios admin!
    CREATE POLICY "Admin full access for appointments" ON public.appointments
    FOR ALL
    TO authenticated
    USING (((auth.jwt() -> 'raw_user_meta_data') ->> 'role') = 'admin_role')
    WITH CHECK (((auth.jwt() -> 'raw_user_meta_data') ->> 'role') = 'admin_role');
    ```

    **Tabla: `contact_messages`**
    ```sql
    CREATE TABLE public.contact_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      status TEXT DEFAULT 'unread' NOT NULL -- Ej: unread, read, archived
    );
    ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public insert access for contact_messages" ON public.contact_messages
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

    CREATE POLICY "Admin full access for contact_messages" ON public.contact_messages
    FOR ALL
    TO authenticated
    USING (((auth.jwt() -> 'raw_user_meta_data') ->> 'role') = 'admin_role')
    WITH CHECK (((auth.jwt() -> 'raw_user_meta_data') ->> 'role') = 'admin_role');
    ```

    **Tabla: `testimonials`**
    ```sql
    CREATE TABLE public.testimonials (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      quote TEXT NOT NULL,
      location TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      status TEXT DEFAULT 'pending_approval' NOT NULL -- Ej: pending_approval, approved, rejected
    );
    ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public insert access for testimonials" ON public.testimonials
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

    CREATE POLICY "Public read access for approved testimonials" ON public.testimonials
    FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');

    CREATE POLICY "Admin full access for testimonials" ON public.testimonials
    FOR ALL
    TO authenticated
    USING (((auth.jwt() -> 'raw_user_meta_data') ->> 'role') = 'admin_role')
    WITH CHECK (((auth.jwt() -> 'raw_user_meta_data') ->> 'role') = 'admin_role');
    ```
    **Nota sobre Row Level Security (RLS) para Administradores:** Las políticas de administrador anteriores asumen que has añadido `{"role": "admin_role"}` a la `raw_user_meta_data` de tus usuarios administradores en Supabase Auth (tabla `auth.users`).
    Puedes actualizar la metadata de un usuario específico con el siguiente SQL (reemplaza `USER_ID_HERE` con el ID real del usuario):
    ```sql
    -- Ejemplo para añadir el rol de administrador a un usuario:
    -- UPDATE auth.users
    -- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin_role"}'::jsonb
    -- WHERE id = 'USER_ID_HERE';
    ```

## 2. Variables de Entorno

Crea un archivo `.env.local` en la raíz de tu proyecto y añade las siguientes variables con los valores de tu proyecto Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=TU_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_PUBLIC_KEY

# Google AI (Genkit) API Key for testimonial moderation
GOOGLE_API_KEY=TU_GOOGLE_AI_API_KEY
```

**¡IMPORTANTE!** Reemplaza `TU_...` con tus valores reales. `GOOGLE_API_KEY` es necesaria para la moderación de testimonios.

## 3. Despliegue de la Aplicación Next.js (Ejemplo con Vercel)

Vercel es una excelente plataforma para desplegar aplicaciones Next.js.

1.  **Conectar Repositorio Git:**
    *   Sube tu código a un repositorio Git (GitHub, GitLab, Bitbucket).
    *   Ve a [Vercel](https://vercel.com/) y regístrate o inicia sesión.
    *   Importa tu proyecto Git.

2.  **Configurar el Proyecto en Vercel:**
    *   Vercel usualmente detecta que es un proyecto Next.js y configura los comandos de build.
    *   **Variables de Entorno:** Ve a la configuración de tu proyecto en Vercel (Settings -> Environment Variables) y añade las mismas variables de entorno que pusiste en tu `.env.local`. Estas son `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y `GOOGLE_API_KEY`.

3.  **Desplegar:**
    *   Vercel desplegará automáticamente tu proyecto cada vez que hagas push a la rama principal (o la rama que configures).

## 4. Panel de Administración (Dentro de la Misma App en `/admin`)

El panel de administración para gestionar citas, mensajes y testimonios está siendo construido dentro de la misma aplicación Next.js, bajo la ruta `/admin`.

*   **Autenticación:** **CRÍTICO:** Deberás implementar un sistema de autenticación robusto para la sección `/admin`. **Supabase Auth** es una excelente opción.
    *   Crea una página de login para `/admin/login` (aún no implementada en este prototipo).
    *   Protege las rutas `/admin/*` para que solo usuarios autenticados (con un rol de administrador) puedan acceder. Esto se puede hacer con middleware de Next.js o verificaciones en `AdminLayout` (aún no completamente implementado en este prototipo).
    *   Asigna el `admin_role` a tus usuarios administradores en Supabase Auth actualizando su `raw_user_meta_data`.
*   **Funcionalidad:** El panel de administración leerá y modificará los datos en las tablas `appointments`, `contact_messages`, y `testimonials` utilizando las RLS policies de administrador definidas.

## 5. Consideraciones de Seguridad Adicionales

*   **Row Level Security (RLS) en Supabase:** Son tu principal línea de defensa. Revisa y ajusta cuidadosamente las políticas para el sitio público (permitiendo inserciones necesarias) y para el panel de administración (asegurando que solo administradores autenticados puedan leer/modificar datos).
*   **HTTPS:** Vercel provee HTTPS por defecto. Asegúrate de que esté activo.
*   **Validación de Entradas:** La aplicación usa Zod para validación en Server Actions y Genkit para moderación.
*   **Dependencias:** Mantén tus dependencias actualizadas.
*   **Protección CSRF:** Los Server Actions de Next.js tienen protección CSRF incorporada.
*   **Admin Panel Security:** La seguridad del panel `/admin` es primordial. Asegura que solo personal autorizado pueda acceder y realizar cambios.

## 6. Generar Tipos de Base de Datos Supabase (Recomendado)

Para un cliente Supabase completamente tipado:
1. Instala Supabase CLI: `npm install supabase --save-dev`
2. Inicia sesión: `npx supabase login`
3. Vincula tu proyecto: `npx supabase link --project-ref TU_PROJECT_ID` (reemplaza `TU_PROJECT_ID` con el ID de tu proyecto Supabase)
4. Genera los tipos: `npx supabase gen types typescript --project-id TU_PROJECT_ID --schema public > src/lib/types_db.ts`
   Esto creará `types_db.ts` que `src/lib/supabase.ts` usa para tipado.

