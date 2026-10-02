import { notFound } from 'next/navigation';

/**
 * Every unknown path under /es and /en.
 *
 * `[lang]/not-found.tsx` only renders when something inside the [lang] segment
 * calls `notFound()`. A URL that matched no route at all — a mistyped link, an
 * old bookmark, `/es/nope` — never reached it: with two root layouts and no
 * app-level layout, Next fell back to its built-in page, unstyled, in English,
 * with no header, no footer and no way back. Unprefixed paths are prefixed by
 * src/proxy.ts first, so they land here too.
 *
 * Matching everything and calling `notFound()` routes all of them through the
 * bilingual not-found page inside the site's own layout.
 *
 * Deliberately NOT given `generateStaticParams`: with it, every path a bot
 * probes would be rendered once and stored as its own cached 404. Without it
 * this one route renders on request and caches nothing, while every real page
 * stays prerendered. `dynamicParams` overrides the layout's `false` for this
 * segment only, so unknown paths reach the page instead of the built-in 404.
 */
export const dynamicParams = true;

export default function UnknownPage(): never {
  notFound();
}
