import type { ReactNode } from 'react';

/**
 * The title block every admin page opens with.
 *
 * The eyebrow is not decoration: below `lg` the navigation rail is behind a
 * drawer, so this line is the only thing on screen that says which part of the
 * panel is being looked at.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-eyebrow font-semibold uppercase tracking-[0.09em] text-ink-faint">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-heading text-h3 text-ink">{title}</h1>
        <p className="mt-2 max-w-measure text-body text-ink-soft">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
