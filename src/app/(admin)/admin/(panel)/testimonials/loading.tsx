import { TableSkeleton } from '@/components/admin/states';

/**
 * The list shell while the query runs.
 *
 * Rendered instead of the page, so the toolbar is a placeholder too — a live
 * search box above a table that has not arrived invites a second query before
 * the first has answered.
 */
export default function Loading() {
  return (
    <>
      <div className="mb-8 space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-9 w-80 max-w-full" />
        <div className="skeleton h-4 w-full max-w-lg" />
      </div>

      <div className="skeleton mb-4 h-[7.5rem] rounded-xl" />

      <TableSkeleton label="Cargando los testimonios" />
    </>
  );
}
