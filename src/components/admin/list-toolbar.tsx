'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { Loader2, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PARAM, buildListHref, type RawSearchParams } from '@/app/admin/_lib/list-href';

/* ============================================================================
   SEARCH, FILTER, SORT — written into the URL
   ----------------------------------------------------------------------------
   Every control here navigates. Nothing is filtered in the browser, because
   nothing beyond the current page has been sent to it: the server holds the
   whole table and returns twenty rows and a count.

   The text search submits rather than firing on every keystroke. A debounce
   would put a navigation behind each pause in someone's typing, and on the
   3G-over-LTE the clinic actually has, a half-typed surname produces a page of
   results that is replaced twice before it can be read. Enter, or the button,
   and the query goes exactly once.
   ========================================================================== */

/** Radix's Select cannot hold the empty string as a value — it is reserved for
 *  "nothing selected" — so "todos" needs a sentinel that is translated back to
 *  an absent parameter on the way into the URL. */
const ALL = '__todos__';

export interface ToolbarOption {
  value: string;
  label: string;
}

export function ListToolbar({
  pathname,
  current,
  searchLabel,
  searchPlaceholder,
  statusOptions,
  statusLabel,
  sortOptions,
}: {
  pathname: string;
  current: RawSearchParams;
  searchLabel: string;
  searchPlaceholder: string;
  statusLabel: string;
  statusOptions: readonly ToolbarOption[];
  sortOptions: readonly ToolbarOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const searchId = useId();
  const statusId = useId();
  const sortId = useId();

  /* Read through PARAM rather than by literal key. The names are Spanish and
     the temptation to type `current.estado` inline is exactly how a renamed
     parameter ends up written in one place and read in another. */
  const rawSearch = current[PARAM.search];
  const rawStatus = current[PARAM.status];
  const rawSort = current[PARAM.sort];

  const currentSearch = typeof rawSearch === 'string' ? rawSearch : '';
  const currentStatus = typeof rawStatus === 'string' ? rawStatus : ALL;
  const currentSort = typeof rawSort === 'string' ? rawSort : sortOptions[0].value;

  const [draft, setDraft] = useState(currentSearch);

  /* The input is uncontrolled by the URL while it is being typed in, but it has
     to follow the URL when the URL changes for another reason — a cleared
     filter, the back button. Without this, pressing back leaves the box showing
     a term that is no longer being searched for. */
  useEffect(() => {
    setDraft(currentSearch);
  }, [currentSearch]);

  const go = (change: Parameters<typeof buildListHref>[2]) => {
    startTransition(() => {
      router.replace(buildListHref(pathname, current, change), { scroll: false });
    });
  };

  return (
    <div className="mb-4 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            go({ search: draft.trim() || null });
          }}
        >
          <Label htmlFor={searchId} className="mb-1.5 block text-small text-ink-soft">
            {searchLabel}
          </Label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <Input
                id={searchId}
                type="search"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
                autoComplete="off"
              />
              {currentSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft('');
                    go({ search: null });
                  }}
                  aria-label="Borrar la búsqueda"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint transition-colors duration-fast hover:bg-canvas-sunk hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <Button type="submit" variant="outline" size="sm">
              Buscar
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:w-auto">
          <div className="min-w-0 sm:w-52">
            <Label htmlFor={statusId} className="mb-1.5 block text-small text-ink-soft">
              {statusLabel}
            </Label>
            <Select
              value={currentStatus}
              onValueChange={(value) => go({ status: value === ALL ? null : value })}
            >
              <SelectTrigger id={statusId} className="text-[0.95rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 sm:w-64">
            <Label htmlFor={sortId} className="mb-1.5 block text-small text-ink-soft">
              Orden
            </Label>
            <Select value={currentSort} onValueChange={(value) => go({ sort: value })}>
              <SelectTrigger id={sortId} className="text-[0.95rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Announced, not just spun. A filter change reloads the table below and
          a screen-reader user gets no other signal that it is happening. */}
      <p aria-live="polite" className="sr-only">
        {pending ? 'Actualizando la lista' : ''}
      </p>
      {pending && (
        <p className="mt-3 flex items-center gap-2 text-small text-ink-faint">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Actualizando…
        </p>
      )}
    </div>
  );
}
