import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configuration de sécurité
const SECURITY_HEADERS = {
  // Protection XSS
  'X-XSS-Protection': '1; mode=block',
  // Protection contre le clickjacking
  'X-Frame-Options': 'DENY',
  // Protection contre le MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Protection contre les attaques de référence
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com",
    "frame-src 'self' https://www.google.com https://www.youtube.com https://www.google.com/maps/",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // HSTS (HTTPS Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// Configuration des langues
const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';

// Liste des routes protégées
const ADMIN_ROUTES = ['/admin'];
const PUBLIC_ROUTES = ['/', '/es', '/en', '/agendar-cita', '/contacto', '/servicios', '/testimonios', '/preguntas-frecuentes'];

// Fonction pour vérifier si une route est publique
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || 
         pathname.startsWith('/images/') ||
         pathname.startsWith('/_next/') ||
         pathname.startsWith('/favicon.ico') ||
         pathname.startsWith('/api/');
}

// Fonction pour vérifier si une route est admin
function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

// Fonction pour vérifier si une route a déjà un préfixe de langue
function hasLanguagePrefix(pathname: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`);
}

// Fonction pour nettoyer les paramètres d'URL
function sanitizeUrl(url: string): string {
  // Supprimer les caractères dangereux
  return url.replace(/[<>\"'&]/g, '');
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();

  // 1. Nettoyage de l'URL
  const sanitizedPathname = sanitizeUrl(pathname);
  const sanitizedSearch = sanitizeUrl(search);

  // 2. Redirection si l'URL a été modifiée (nettoyage de caractères dangereux)
  if (sanitizedPathname !== pathname || sanitizedSearch !== search) {
    url.pathname = sanitizedPathname;
    url.search = sanitizedSearch;
    return NextResponse.redirect(url);
  }

  // 3. PRIORITÉ: Gestion des routes admin (AVANT les redirections de langue)
  if (isAdminRoute(pathname)) {
    console.log(`Middleware: Route admin détectée: ${pathname}`);
    
    // Si on a une route admin avec un préfixe de langue, rediriger vers la version sans préfixe
    const adminPathMatch = pathname.match(/^\/(es|en)(\/admin.*)$/);
    if (adminPathMatch) {
      const adminSubPath = adminPathMatch[2];
      url.pathname = adminSubPath;
      console.log(`Middleware: Redirection admin de ${pathname} vers ${url.pathname}`);
      return NextResponse.redirect(url);
    }
    
    // Vérifier que c'est une route admin valide
    const validAdminRoutes = [
      '/admin', 
      '/admin/login', 
      '/admin/appointments', 
      '/admin/messages', 
      '/admin/testimonials', 
      '/admin/dashboard', 
      '/admin/settings'
    ];
    
    const isValidAdminRoute = validAdminRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
    
    if (!isValidAdminRoute) {
      url.pathname = '/admin/login';
      console.log(`Middleware: Route admin invalide ${pathname}, redirection vers ${url.pathname}`);
      return NextResponse.redirect(url);
    }
    
    console.log(`Middleware: Route admin valide, continuer: ${pathname}`);
    
    // Ajouter les headers de sécurité et continuer
    const response = NextResponse.next();
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // 4. Gestion des routes statiques et API (ne pas rediriger)
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || 
      pathname.startsWith('/images/') || 
      pathname.includes('.')) {
    const response = NextResponse.next();
    
    // Headers spécifiques pour les images
    if (pathname.startsWith('/images/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Headers pour les assets statiques
    if (pathname.startsWith('/_next/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    return response;
  }

  // 5. Gestion des langues pour les routes publiques SEULEMENT
  if (pathname === '/') {
    console.log(`Middleware: Requête pour la racine, redirection vers /${DEFAULT_LANGUAGE}`);
    url.pathname = `/${DEFAULT_LANGUAGE}`;
    return NextResponse.redirect(url);
  }

  // 6. Si c'est une route sans préfixe de langue ET que ce n'est pas admin, rediriger vers la version avec langue
  if (!hasLanguagePrefix(pathname) && !isAdminRoute(pathname)) {
    console.log(`Middleware: Route sans langue détectée: ${pathname}, redirection vers /${DEFAULT_LANGUAGE}${pathname}`);
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`;
    return NextResponse.redirect(url);
  }

  // 7. Protection contre les attaques par force brute
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  
  // Bloquer les user agents suspects
  const suspiciousUserAgents = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests'
  ];
  
  if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    // Permettre les bots légitimes mais bloquer les suspects
    if (!userAgent.includes('googlebot') && !userAgent.includes('bingbot')) {
      return new NextResponse('Access Denied', { status: 403 });
    }
  }

  // 8. Protection contre les attaques par injection
  const contentType = request.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    // Vérifier la taille du body pour éviter les attaques par déni de service
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1000000) { // 1MB max
      return new NextResponse('Payload Too Large', { status: 413 });
    }
  }

  // 9. Headers de sécurité pour toutes les autres requêtes
  const response = NextResponse.next();
  
  // Ajouter tous les headers de sécurité
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};