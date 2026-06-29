/**
 * Single source of truth for the public site origin.
 *
 * Reads NEXT_PUBLIC_SITE_URL and NORMALIZES it so a misconfigured value can
 * never corrupt canonical / OpenGraph / sitemap URLs:
 *   - strips trailing slashes and any accidental `/es` or `/en` locale suffix
 *     (the deploy env historically held `https://…vercel.app/es`)
 *   - rejects non-absolute values
 *   - in production, refuses a localhost origin (the historical cause of the
 *     `http://localhost:3000` URLs leaking into production metadata)
 *
 * Falls back to the real production domain.
 *
 * To point the site at production, set in Vercel (no trailing slash, no path):
 *   NEXT_PUBLIC_SITE_URL=https://drfrancisvaleriop.com
 */
const PRODUCTION_SITE_URL = 'https://drfrancisvaleriop.com';

function normalizeSiteUrl(raw: string | undefined): string {
  if (!raw) return PRODUCTION_SITE_URL;

  let value = raw.trim().replace(/\/+$/, ''); // drop trailing slashes
  value = value.replace(/\/(es|en)$/i, ''); // drop accidental locale suffix

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return PRODUCTION_SITE_URL;
    }
    const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(url.hostname);
    if (process.env.NODE_ENV === 'production' && isLocal) {
      return PRODUCTION_SITE_URL;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export { PRODUCTION_SITE_URL };

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
