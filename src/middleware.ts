import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configuration de sécurité améliorée
const SECURITY_HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'nonce-{NONCE}' 'strict-dynamic' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://wyospvndshfmkqvwkefn.supabase.co https://vercel.live https://va.vercel-scripts.com wss://wyospvndshfmkqvwkefn.supabase.co",
    "frame-src 'self' https://www.google.com https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
};

const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Ajouter les headers de sécurité
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Ne pas traiter les routes statiques et admin
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/admin')
  ) {
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

  if (!hasLangPrefix) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LANGUAGE}${pathname}`, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};