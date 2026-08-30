import { StatSkeleton, TableSkeleton } from '@/components/admin/states';

/**
 * Shown while the dashboard's four queries are in flight.
 *
 * The shapes match what arrives — four cards, then a table — so the page does
 * not jump when the data lands. A centred spinner would reserve no space at
 * all, which is the version of "loading" that makes a page appear to leap.
 */
export default function AdminDashboardLoading() {
  return (
    <>
      <div className="mb-8 space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-9 w-72 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      <StatSkeleton />

      <div className="mt-6">
        <TableSkeleton rows={5} label="Cargando las solicitudes pendientes" />
      </div>
    </>
  );
}
