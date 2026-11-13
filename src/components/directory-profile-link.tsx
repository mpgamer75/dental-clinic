import { ContactRound, ExternalLink } from 'lucide-react';

import { doctorDirectoryProfile } from '@/lib/data';
import type { Language } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * "Also on Mi SaludRD" — a link out to Dr. Valerio's profile on the directory.
 *
 * Renders NOTHING while `doctorDirectoryProfile.url` is null, so the address is
 * the only thing that has to exist for the card to appear, and nothing can
 * link to a guessed profile.
 *
 * The whole card is the anchor: one target the width of the column instead of a
 * line of small text, for a visitor who is on a phone and often past sixty.
 *
 * Text and a generic lucide glyph, deliberately no logo. The mark belongs to
 * the directory; drawing it here would be this site reproducing a third
 * party's trademark, and nothing is loaded from their domain either, so the
 * CSP needs no entry for it.
 *
 * `noopener noreferrer` because the destination is a site the clinic does not
 * control, and the new tab is announced in words: a link that silently leaves
 * the page is disorienting with a screen reader, and the booking form the
 * visitor may be halfway through stays open behind it.
 */
export function DirectoryProfileLink({ lang, className }: { lang: Language; className?: string }) {
  const { url, copy } = doctorDirectoryProfile;
  if (!url) return null;
  const t = copy[lang];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-start gap-3.5 rounded-xl border border-line bg-surface p-4 shadow-e1 transition-colors duration-fast',
        'hover:border-primary/50 hover:bg-primary-soft',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brass/45 bg-brass-soft text-brass-ink"
      >
        <ContactRound className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-medium text-ink">{t.title}</span>
        <span className="mt-1 block text-small leading-relaxed text-ink-soft">{t.body}</span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-small font-medium text-primary group-hover:text-primary-hover">
          {t.cta}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only"> {t.newTab}</span>
        </span>
      </span>
    </a>
  );
}
