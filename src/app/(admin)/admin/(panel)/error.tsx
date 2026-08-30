'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * The last resort for this segment.
 *
 * Reached only when a page threw outside the query wrappers — every read in
 * _lib/queries.ts already returns a `QueryOutcome` and every page renders its
 * own failure state, so this is for the genuinely unexpected.
 *
 * `error.message` is not shown. In production Next replaces it with a digest,
 * and in development it can carry a query with its bound parameters — which for
 * these tables means a patient's email address on screen and in a screenshot.
 * The digest is what a developer needs to find the matching server log anyway.
 */
export default function AdminPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] unhandled render error (digest %s)', error.digest ?? 'none');
  }, [error.digest]);

  return (
    <div className="mx-auto max-w-lg py-12">
      <h1 className="font-heading text-h3 text-ink">Algo ha fallado en esta pantalla</h1>
      <p className="mt-2 text-body text-ink-soft">
        No se ha modificado ningún dato. Vuelva a cargar la sección; si el problema continúa, avise
        a quien administra el sitio con el código de abajo.
      </p>

      {error.digest && (
        <p className="tabular mt-4 rounded-lg bg-canvas-sunk px-3 py-2 text-small text-ink-faint">
          Código del incidente: {error.digest}
        </p>
      )}

      <Button type="button" variant="outline" size="sm" className="mt-6" onClick={reset}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Volver a intentarlo
      </Button>
    </div>
  );
}
