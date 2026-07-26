'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formCommon } from '@/lib/data';
import type { Language } from '@/lib/types';

/**
 * Persistent, reassuring success panel shown in place of a form after a
 * successful submission (calmer than a toast that vanishes).
 *
 * It takes focus on mount. Without that, submitting the form leaves focus on a
 * button that no longer exists: the browser drops focus to <body>, so a
 * keyboard user's next Tab restarts from the top of the document and a screen
 * reader user is left wherever they were. The panel replaced the entire form,
 * which is a context change large enough that focus has to follow it.
 */
export function FormSuccess({
  title,
  message,
  responseTime,
  resetLabel,
  onReset,
}: {
  title: string;
  message: string;
  responseTime?: string;
  resetLabel?: string;
  onReset?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `preventScroll` then an explicit centred scroll: the default focus scroll
    // jumps the panel flush under the sticky header.
    panelRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div
      ref={panelRef}
      // Deliberately NOT a live region. It is already a focus target (see the
      // effect above), and a container that is both announces its contents
      // twice on most screen readers — once on insertion, once on focus.
      // `aria-labelledby` gives the focused container a name so the single
      // announcement is meaningful.
      aria-labelledby="form-success-title"
      tabIndex={-1}
      className="flex animate-fade-up flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/5 p-8 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>
      <h3 id="form-success-title" className="font-heading text-h3 font-medium text-ink">
        {title}
      </h3>
      <p className="max-w-measure text-ink-soft">{message}</p>
      {responseTime ? <p className="text-small font-medium text-success">{responseTime}</p> : null}
      {onReset && resetLabel ? (
        <Button variant="outline" onClick={onReset} className="mt-2">
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Brief privacy/consent microcopy placed under a form's submit button, with a
 * link to the privacy policy. Required trust signal for a healthcare site.
 */
export function ConsentNotice({ lang, className }: { lang: Language; className?: string }) {
  const c = formCommon[lang];
  return (
    // `mx-auto max-w-measure-tight`: this notice had no measure cap at all, so
    // on a wide form it ran to 131–145 characters per line — by some distance
    // the worst line length on the site, and on the one piece of text that is
    // a consent statement.
    <p
      className={`mx-auto max-w-measure-tight text-center text-xs leading-relaxed text-muted-foreground ${className ?? ''}`}
    >
      {c.consentBefore}
      <Link
        href={`/${lang}/privacidad`}
        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {c.privacyLinkLabel}
      </Link>
      {c.consentAfter}
    </p>
  );
}
