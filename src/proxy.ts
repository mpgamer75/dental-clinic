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

/** Copies the security headers onto a response. Redirects need this too — see
 *  the call sites below. */
function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Resolve the active locale from the path and forward it to the server via a
  // request header, so the root layout can render the correct <html lang>.
  const activeLang = pathname.startsWith('/en/') || pathname === '/en' ? 'en' : DEFAULT_LANGUAGE;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-lang', activeLang);

  const res = withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
  );

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

  // Locale handling for public routes.
  //
  // `req.nextUrl` is cloned rather than rebuilt from a string so the query
  // string survives the redirect. Building `new URL('/es' + pathname)` dropped
  // it, which silently destroyed every campaign parameter: a visitor arriving
  // on /?utm_source=facebook or /agendar-cita?gclid=… landed on the right page
  // with the attribution stripped.
  // NOTE: the redirects below carry the security headers too. `/` is the site's
  // canonical entry point, so without this the very first response a visitor
  // receives — the one that establishes HSTS — shipped with no HSTS at all.
  if (pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}`;
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  const hasLangPrefix = SUPPORTED_LANGUAGES.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`,
  );

  if (!hasLangPrefix) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`;
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};