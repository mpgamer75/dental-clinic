import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { buildListHref, type RawSearchParams } from '@/app/(admin)/admin/_lib/list-href';
import { cn } from '@/lib/utils';

/* ============================================================================
   PAGING
   ----------------------------------------------------------------------------
   Real LIMIT/OFFSET paging over a real `count(*)`, rendered as links rather
   than buttons: a page of a list is a place, and it should be reachable with
   the back button, a middle click and a bookmark.

   The caption states the range AND the total, which is the sentence the old
   panel could not say honestly. "Mostrando 1–20 de 137" tells the reader both
   that there are more and exactly how many more; "de 45 totales" under ten rows
   told them neither.
   ========================================================================== */

const linkClasses =
  'inline-flex h-11 items-center gap-1.5 rounded-lg border border-line-strong px-3.5 text-small font-medium transition-colors duration-fast ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

export function PaginationBar({
  pathname,
  current,
  page,
  pageSize,
  total,
}: {
  pathname: string;
  current: RawSearchParams;
  page: number;
  pageSize: number;
  total: number;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const hasPrevious = page > 1;
  const hasNext = page < lastPage;

  return (
    <nav
      aria-label="Paginación de la lista"
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="tabular text-small text-ink-soft">
        {total === 0 ? (
          'Sin resultados'
        ) : (
          <>
            Mostrando <span className="font-medium text-ink">{first}</span>–
            <span className="font-medium text-ink">{last}</span> de{' '}
            <span className="font-medium text-ink">{total}</span>
            {' · '}
            página {page} de {lastPage}
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        {/* A disabled edge is rendered as a span, not a dead link. An <a> with
            no href is not focusable and announces as nothing; this announces as
            text and skips the tab stop honestly. */}
        {hasPrevious ? (
          <Link
            href={buildListHref(pathname, current, { page: String(page - 1) })}
            className={cn(linkClasses, 'text-ink hover:border-primary/50 hover:bg-primary-soft')}
            rel="prev"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </Link>
        ) : (
          <span className={cn(linkClasses, 'cursor-default text-ink-faint opacity-60')} aria-hidden="true">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </span>
        )}

        {hasNext ? (
          <Link
            href={buildListHref(pathname, current, { page: String(page + 1) })}
            className={cn(linkClasses, 'text-ink hover:border-primary/50 hover:bg-primary-soft')}
            rel="next"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className={cn(linkClasses, 'cursor-default text-ink-faint opacity-60')} aria-hidden="true">
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
