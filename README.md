# Clínica Dental Valerio - Sitio Web Oficial

Bienvenido al repositorio del sitio web oficial de la Clínica Dental Valerio, dirigida por el **Dr. Francis Valerio** en **Santiago de los Caballeros, República Dominicana**. Este proyecto es una aplicación web real y funcional, diseñada para ofrecer a los pacientes una experiencia digital moderna y eficiente.

## 🚀 Descripción General del Proyecto

Este sitio web multilingüe (español/inglés) ha sido desarrollado para proporcionar información completa sobre los servicios de la clínica, permitir la reserva de citas en línea, mostrar testimonios de pacientes y exhibir las certificaciones profesionales del Dr. Valerio. También incluye un panel de administración seguro para la gestión de contenidos y citas.

## 🛠️ Tecnologías Utilizadas (Tech Stack)

El proyecto está construido con una pila tecnológica moderna y robusta, garantizando rendimiento, seguridad y mantenibilidad:

*   **Next.js 15**: Un framework de React para desarrollo web, optimizado para aplicaciones con renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG). Ofrece excelente rendimiento y una mejor experiencia para desarrolladores.
*   **TypeScript**: Un superset de JavaScript que añade tipado estático, mejorando la calidad del código, la detección de errores y la mantenibilidad en proyectos grandes.
*   **Supabase**: Una alternativa open-source a Firebase, que proporciona una base de datos PostgreSQL, autenticación, almacenamiento de archivos y funciones Edge. Sirve como backend robusto para todas las operaciones de datos del sitio.
*   **Tailwind CSS**: Un framework CSS utilitario que permite construir rápidamente interfaces de usuario personalizadas y responsivas directamente en el marcado HTML.
*   **Shadcn/ui**: Una colección de componentes UI reutilizables, estilizados con Tailwind CSS, para acelerar el desarrollo de la interfaz de usuario.

## ✨ Funcionalidades Clave

*   **Interfaz Multilingüe**: Soporte completo para español e inglés.
*   **Reserva de Citas**: Formulario interactivo para agendar consultas.
*   **Galería de Diplomas y Certificaciones**: Presentación de las cualificaciones profesionales del Dr. Valerio.
*   **Testimonios de Pacientes**: Sección dedicada a opiniones y comentarios de los pacientes.
*   **Mapa de Google Integrado**: Visualización precisa de la ubicación de la clínica.
*   **Panel de Administración Seguro**: Gestión de citas, mensajes, testimonios y parámetros del sitio.
*   **Optimización de Rendimiento**: Carga rápida de páginas y optimización de imágenes.
*   **Seguridad Mejorada**: Encabezados de seguridad HTTP y protección contra amenazas comunes.

## 🚀 Inicio Rápido (Para Desarrolladores)

1.  **Clonar el repositorio**:
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd Valerio_Dental
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    # o
    yarn install
    ```
3.  **Configurar variables de entorno**:
    Cree un archivo `.env.local` en la raíz del proyecto y agregue sus claves API de Supabase (ver `DEPLOYMENT_GUIDE.md` para más detalles):
    ```
    NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_supabase
    SUPABASE_SERVICE_ROLE_KEY=tu_clave_privada_supabase
    # GOOGLE_AI_API_KEY=tu_clave_google_ai (si aplica)
    ```
4.  **Iniciar el servidor de desarrollo**:
    ```bash
    npm run dev
    # o
    yarn dev
    ```
    El sitio estará disponible en `http://localhost:3000`.

## 🌐 Despliegue

Este proyecto está diseñado para ser desplegado en [Vercel](https://vercel.com) y utiliza [Supabase](https://supabase.com) como backend. Se proporciona una guía de despliegue detallada (`DEPLOYMENT_GUIDE.md`) en la raíz del proyecto para ayudarte en el proceso de puesta en producción.

---

© {{year}} Clínica Dental Valerio. Todos los derechos reservados.