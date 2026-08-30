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

/**
 * The locales the public site is published in.
 *
 * `es` first, and that order is load-bearing: it is the x-default, and Spanish
 * is the language the practice actually sells in.
 */
export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** hreflang tag for each locale, as Google expects to see it. */
const HREFLANG: Record<Locale, string> = {
  es: 'es-DO',
  en: 'en-US',
};

/**
 * Prefixes a locale-agnostic path with its locale.
 *
 * `path` is the part AFTER the locale: `''` for the homepage,
 * `'implantes-dentales/precio'` or `'/implantes-dentales/precio'` for a page.
 * Both leading-slash forms are accepted because call sites disagree and a
 * doubled slash in a canonical URL is a duplicate-content bug, not a typo.
 */
export function localePath(lang: Locale, path = ''): string {
  const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return clean ? `/${lang}/${clean}` : `/${lang}`;
}

/**
 * The hreflang map for one page, for `Metadata.alternates.languages`.
 *
 * Every page in the site needs `es-DO`, `en-US` and `x-default` pointing at the
 * SAME document in each language, and each page was previously writing that
 * object out by hand — which is how `/agendar-cita` and `/privacidad` ended up
 * correct while anything added later was one copy-paste away from pointing at
 * the homepage. Built here once, from one path.
 *
 * Values are site-relative; Next resolves them against `metadataBase`.
 */
export function hreflangAlternates(path = ''): Record<string, string> {
  const map: Record<string, string> = {};
  for (const lang of LOCALES) map[HREFLANG[lang]] = localePath(lang, path);
  map['x-default'] = localePath('es', path);
  return map;
}

/** The same map with absolute URLs, which is what `sitemap.xml` requires. */
export function hreflangAlternatesAbsolute(path = ''): Record<string, string> {
  const relative = hreflangAlternates(path);
  return Object.fromEntries(
    Object.entries(relative).map(([tag, value]) => [tag, absoluteUrl(value)]),
  );
}
