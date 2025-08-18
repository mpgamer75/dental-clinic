import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configuration de sécurité
const SECURITY_HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  // Ajouter les headers de sécurité
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Ne pas traiter les routes statiques
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return res;
  }

  // Vérifier l'authentification pour les routes admin
  if (pathname.startsWith('/admin')) {
    // Permettre l'accès à la page de login
    if (pathname === '/admin/login') {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Si déjà connecté et admin, rediriger vers dashboard
      if (session) {
        const { data: adminCheck } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .single();
          
        if (adminCheck) {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        }
      }
      return res;
    }

    // Pour toutes les autres routes admin, vérifier l'auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Vérifier si l'utilisateur est admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (adminError || !adminCheck) {
      console.error('Admin check failed:', adminError);
      // Déconnecter et rediriger
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    return res;
  }

  // Gestion des langues pour les routes publiques
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${DEFAULT_LANGUAGE}`, req.url));
  }

  // Si pas de préfixe de langue, ajouter le préfixe par défaut
  const hasLangPrefix = SUPPORTED_LANGUAGES.some(lang => 
    pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
  );

  if (!hasLangPrefix && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LANGUAGE}${pathname}`, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};