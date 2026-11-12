import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * `/admin` is deliberately NOT disallowed here, and that is the fix, not an
 * oversight.
 *
 * It used to be, and the public footer links to it. That combination is the
 * textbook recipe for a URL-only index entry: `Disallow` stops Googlebot
 * FETCHING the page, it does not stop it INDEXING the URL. A blocked page that
 * something links to gets indexed on the strength of the link alone, with no
 * title and no snippet — "No information is available for this page" — and
 * because the crawler is forbidden from fetching it, it can never see a
 * `noindex` and can never drop it again. The robots block was the thing keeping
 * it in the index.
 *
 * Letting the crawler in is what allows `/admin` to say `noindex` for itself.
 * That header must exist in the route's own metadata; this file cannot supply
 * it. See the admin page's `robots: { index: false, follow: false }`.
 *
 * `/api` stays disallowed: it is linked from nowhere, so there is no link
 * equity to index a URL on, and there is nothing there a crawler should spend
 * budget fetching. `/admin-dashboard` was dropped from the list because that
 * route does not exist.
 *
 * The AI crawlers are named, although `*` already lets them in. Several of
 * them (GPTBot, ClaudeBot, Google-Extended) look for a rule addressed to them
 * by name and some site owners' tooling adds a blanket block for exactly these
 * agents; an explicit `allow` is the unambiguous statement that this clinic
 * WANTS to be read by the assistants its patients ask. The site's own summary
 * for them is /llms.txt.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
        crawlDelay: 0,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
