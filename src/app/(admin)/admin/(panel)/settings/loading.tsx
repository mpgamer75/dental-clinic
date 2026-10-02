/**
 * The settings screen while its one row is read.
 *
 * Without this file the nearest loading boundary was the dashboard's, so
 * opening Ajustes flashed four stat cards and a table that were never going to
 * appear and then jumped to a form. This is the shape of the form itself: the
 * maintenance panel, the three switches, the save row.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando la configuración del sitio</span>

      <div className="mb-8 space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-9 w-72 max-w-full" />
        <div className="skeleton h-4 w-full max-w-lg" />
      </div>

      <div className="max-w-3xl space-y-4">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start gap-4">
            <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-5 w-48" />
              <div className="skeleton h-3 w-full max-w-md" />
              <div className="skeleton h-3 w-4/5 max-w-sm" />
            </div>
            <div className="skeleton h-6 w-11 shrink-0 rounded-full" />
          </div>
        </div>

        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start gap-4 p-5">
              <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-full max-w-md" />
              </div>
              <div className="skeleton h-6 w-11 shrink-0 rounded-full" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="skeleton h-3 w-56" />
          <div className="skeleton h-11 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
