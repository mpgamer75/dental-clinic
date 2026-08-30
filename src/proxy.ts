import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { auth } from '@/lib/auth/server';

/**
 * The auth service's origin, for `connect-src`.
 *
 * The browser reaches Neon Auth through the same-origin /api/auth proxy, so
 * `'self'` already covers the normal path and this is belt-and-braces for any
 * SDK call that addresses the service directly. Derived from the environment
 * rather than written out, because a hardcoded backend hostname in this file is
 * exactly what went wrong last time — see the note on `connect-src` below.
 */
function authOrigin(): string {
  const raw = process.env.NEON_AUTH_BASE_URL;
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
}

const SECURITY_HEADERS = {
  // 0, not "1; mode=block". The legacy XSS auditor is removed from every
  // current browser, and where it does still exist its blocking mode is itself
  // an information-disclosure vector. `0` disables it explicitly; the CSP below
  // is the actual defence.
  'X-XSS-Protection': '0',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    // 'unsafe-eval' is gone: it was never needed in a production build, and it
    // is the single directive that most weakens the rest of this policy.
    // 'unsafe-inline' has to stay until Next's bootstrap script is served with
    // a nonce — it is a known gap, not an accepted one.
    "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    // This used to allow-list a Supabase project host, and kept allow-listing it
    // after the migration removed every call to it. A stale entry here is worse
    // than clutter: a released Supabase project ref can be claimed by someone
    // else, and the policy would still have been authorising any injected script
    // to send the patient data on /admin straight to it.
    ['connect-src', "'self'", authOrigin(), 'https://vercel.live', 'https://va.vercel-scripts.com']
      .filter(Boolean)
      .join(' '),
    "frame-src 'self' https://www.google.com https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; '),
};

const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';

/**
 * The admin guard, as defence in depth.
 *
 * This file used to skip /admin outright, which meant the panel's only
 * authentication was a `useState` in a client component — the markup, the
 * patient rows and the database credential were all served before anything
 * asked who was asking. The real boundary is now the server layout at
 * src/app/(admin)/admin/(panel)/layout.tsx, which will not render a byte of the panel
 * without a session. This is the second lock: it turns an unauthenticated
 * request into a redirect at the edge, before a route is even resolved, and it
 * refreshes a session that is close to expiring so a working day does not end
 * in a surprise sign-out.
 *
 * Scoped to /admin by the call site below, and that scoping is load-bearing:
 * `auth.middleware` protects EVERY path it is handed except its own skip list,
 * so running it over the matcher would put the clinic's public site behind a
 * login form.
 *
 * `loginUrl` must stay in step with ADMIN_LOGIN_PATH in
 * src/app/(admin)/admin/_lib/session.ts. If the two disagree, an anonymous visitor is
 * bounced between a middleware that sends them to one URL and a layout that
 * sends them to the other.
 */
const guardAdminRoutes = auth.middleware({ loginUrl: '/admin/login' });

/** Copies the security headers onto a response. Redirects need this too — see
 *  the call sites below. */
function withSecurityHeaders(res: NextResponse, req?: NextRequest): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    /* HSTS is withheld on plain HTTP, which in practice means localhost.
       It is a per-host instruction the browser REMEMBERS: send it once over
       http://localhost:9003 and that browser will force https://localhost:9003
       for a year, on every project served from that port, with no way for the
       site to take it back. `npm run dev` then fails to load anything and the
       developer has to clear the entry by hand in chrome://net-internals.
       Found by hitting exactly that during mobile testing.

       Withholding it costs nothing where it matters: production is HTTPS, so
       the header still ships on every response a real visitor sees. */
    if (key === 'Strict-Transport-Security' && req?.nextUrl.protocol !== 'https:') {
      continue;
    }
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
    req,
  );

  // Skip static assets. /api/ included: a sign-in POST rewritten to
  // /es/api/auth/... arrives as a 404 and the admin can no longer log in.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return res;
  }

  // Admin routes are not locale-prefixed — the panel is Spanish-only, and
  // `activeLang` above already resolved to the default for them — so they skip
  // the locale block below and go through the auth guard instead.
  //
  // The guard builds its own response (it may need to attach refreshed session
  // cookies, or redirect), so the security headers are applied to whatever it
  // returns rather than to `res`. Without that, every admin response — the
  // redirect to the login form included — would ship with no CSP and no HSTS.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return withSecurityHeaders(await guardAdminRoutes(req), req);
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
    return withSecurityHeaders(NextResponse.redirect(url), req);
  }

  const hasLangPrefix = SUPPORTED_LANGUAGES.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`,
  );

  if (!hasLangPrefix) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`;
    return withSecurityHeaders(NextResponse.redirect(url), req);
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};