import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ============================================================================
   LOADING, EMPTY — the two states a list is in when it has no rows and nothing
   has gone wrong
   ----------------------------------------------------------------------------
   The third, a read that failed, lives in error-panel.tsx because it needs a
   retry button and therefore a client hook. These do not, and the distinction
   is load-bearing rather than tidy: `EmptyState` takes a Lucide icon as a prop,
   and a component reference cannot be serialised from a Server Component into a
   client one — React refuses it as "functions cannot be passed directly to
   Client Components". Keeping this file server-safe is what lets the pages hand
   it an icon at all.

   All three states existed as the same thing in the panel this replaces:
   nothing, or a spinner. That is the most misleading pattern an operational
   screen can have, because "no hay citas" and "no pudimos leer las citas" look
   identical and only one of them means the clinic can stop worrying.
   ========================================================================== */

/**
 * Rows shaped like the rows they stand in for.
 *
 * `.skeleton` (globals.css) animates `background-position` on a gradient — a
 * paint-only property, and it stops entirely under `prefers-reduced-motion` via
 * the global rule at the bottom of that file.
 */
export function TableSkeleton({ rows = 6, label }: { rows?: number; label: string }) {
  return (
    <div
      className="divide-y divide-line rounded-xl border border-line bg-surface"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-4 w-2/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
          <div className="skeleton hidden h-6 w-24 rounded-full sm:block" />
          <div className="skeleton h-9 w-9 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-live="polite">
      <span className="sr-only">Cargando las cifras del panel</span>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="rounded-xl border border-line bg-surface p-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-4 h-9 w-16" />
          <div className="skeleton mt-4 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Nothing to show, and why that is fine.
 *
 * `clearHref` distinguishes the two empties that matter: a table with no rows
 * at all, and a table whose rows were all filtered out by the controls above
 * it. The second one needs a way back, or the reader concludes the data is
 * gone.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  clearHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  clearHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas-sunk text-ink-faint">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-heading text-h4 text-ink">{title}</p>
      <p className="mt-2 max-w-measure text-body text-ink-soft">{description}</p>
      {clearHref && (
        <Button variant="outline" size="sm" className="mt-5" asChild>
          <Link href={clearHref}>Quitar los filtros</Link>
        </Button>
      )}
    </div>
  );
}

/** A card wrapper used by every list and chart panel, so the panel has one
 *  surface treatment rather than six. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-line bg-surface shadow-e1', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-heading text-h4 text-ink">{title}</h2>
          {description && <p className="mt-1 text-small text-ink-soft">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export { ErrorPanel } from './error-panel';
