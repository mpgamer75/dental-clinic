import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Enhanced security headers
const SECURITY_HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
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
  const { pathname } = req.nextUrl;

  // Resolve the active locale from the path and forward it to the server via a
  // request header, so the root layout can render the correct <html lang>.
  const activeLang = pathname.startsWith('/en/') || pathname === '/en' ? 'en' : DEFAULT_LANGUAGE;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-lang', activeLang);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // Apply security headers to every response
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Skip static assets and admin routes (admin is not locale-prefixed)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/admin')
  ) {
    return res;
  }

  // Locale handling for public routes
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${DEFAULT_LANGUAGE}`, req.url));
  }

  // If no locale prefix is present, add the default one
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