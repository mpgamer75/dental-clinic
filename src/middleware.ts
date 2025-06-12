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
const PROTECTED_ROUTES = ['/admin'];
const PUBLIC_ROUTES = ['/', '/es', '/en', '/agendar-cita', '/contacto', '/servicios', '/testimonios', '/preguntas-frecuentes'];

// Fonction pour vérifier si une route est publique
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || 
         pathname.startsWith('/images/') ||
         pathname.startsWith('/_next/') ||
         pathname.startsWith('/favicon.ico');
}

// Fonction pour vérifier si une route est protégée
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
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

  // 3. Gestion des routes admin
  if (pathname.startsWith('/admin')) {
    console.log(`Middleware: Requête pour admin: ${pathname}`);
    const adminPathMatch = pathname.match(/^\/(es|en)(\/admin.*)$/);
    if (adminPathMatch) {
      const adminSubPath = adminPathMatch[2];
      url.pathname = adminSubPath;
      console.log(`Middleware: Redirection admin de ${pathname} vers ${url.pathname}`);
      return NextResponse.redirect(url);
    }
    
    const validAdminRoutes = ['/admin', '/admin/login', '/admin/appointments', '/admin/messages', '/admin/testimonials', '/admin/dashboard', '/admin/settings'];
    const isValidAdminRoute = validAdminRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
    
    if (!isValidAdminRoute) {
      url.pathname = '/admin/login';
      console.log(`Middleware: Route admin invalide, redirection vers ${url.pathname}`);
      return NextResponse.redirect(url);
    }
    
    console.log(`Middleware: Continuer avec la route admin valide: ${pathname}`);
    return NextResponse.next();
  }

  // 4. Gestion des langues pour les routes publiques
  if (pathname === '/') {
    console.log(`Middleware: Requête pour la racine, redirection vers /${DEFAULT_LANGUAGE}`);
    url.pathname = `/${DEFAULT_LANGUAGE}`;
    return NextResponse.redirect(url);
  }

  // 5. Gestion des erreurs 404 pour les routes publiques inexistantes
  if (!isPublicRoute(pathname) && !isProtectedRoute(pathname) && !hasLanguagePrefix(pathname)) {
    console.log(`Middleware: Route publique inexistante: ${pathname}, redirection vers /${DEFAULT_LANGUAGE}`);
    url.pathname = `/${DEFAULT_LANGUAGE}`;
    return NextResponse.redirect(url);
  }

  // 6. Protection contre les attaques par force brute
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

  // 7. Rate limiting basique (peut être amélioré avec Redis)
  const rateLimitKey = `rate_limit:${clientIP}`;
  // Ici on pourrait implémenter un vrai rate limiting avec Redis

  // 8. Headers de sécurité
  const response = NextResponse.next();
  
  // Ajouter tous les headers de sécurité
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 9. Headers spécifiques pour les images
  if (pathname.startsWith('/images/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  // 10. Headers pour les assets statiques
  if (pathname.startsWith('/_next/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // 11. Protection contre les attaques par injection
  const contentType = request.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    // Vérifier la taille du body pour éviter les attaques par déni de service
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1000000) { // 1MB max
      return new NextResponse('Payload Too Large', { status: 413 });
    }
  }

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
