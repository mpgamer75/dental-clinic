
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals, API routes, and admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/admin') || // Exempt /admin and its sub-paths
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathnameHasLang = SUPPORTED_LANGUAGES.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
  );

  if (pathnameHasLang) {
    return NextResponse.next();
  }

  // Redirect / to /es (default language homepage)
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${DEFAULT_LANGUAGE}${request.nextUrl.search}`, request.url));
  }
  
  // For any other path without a language prefix, redirect to the default language version
  // This should NOT apply to /admin paths due to the check above.
  return NextResponse.redirect(new URL(`/${DEFAULT_LANGUAGE}${pathname}${request.nextUrl.search}`, request.url));
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // This ensures the middleware runs on all page routes.
    // The '/admin' exemption is handled inside the middleware function itself.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)', // Excludes files with extensions
    '/', // Explicitly include the root path
  ],
};
