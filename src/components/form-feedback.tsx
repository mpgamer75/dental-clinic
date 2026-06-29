'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formCommon } from '@/lib/data';
import type { Language } from '@/lib/types';

/**
 * Persistent, reassuring success panel shown in place of a form after a
 * successful submission (calmer than a toast that vanishes).
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
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/5 p-8 text-center animate-scale-in"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>
      <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-muted-foreground">{message}</p>
      {responseTime ? <p className="text-sm font-medium text-success">{responseTime}</p> : null}
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
    <p className={`text-center text-xs leading-relaxed text-muted-foreground ${className ?? ''}`}>
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
