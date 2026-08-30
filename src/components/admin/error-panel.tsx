'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * A read that failed, said out loud.
 *
 * Split from states.tsx because the retry needs `useRouter`, and that one hook
 * would otherwise make the whole module a client module — which would stop
 * `EmptyState` from being handed a Lucide icon by a Server Component.
 *
 * `detail` is the SQLSTATE-level description from `formatDatabaseFailure`: no
 * patient data, no query text, no bound parameters. It is shown rather than
 * hidden because the person reading it is the one who will be on the phone to
 * whoever can fix it, and "sqlstate 42501 on app.appointments" ends that call in
 * a minute where "algo salió mal" starts an afternoon.
 *
 * Only the props are strings, so this stays safe to render from a server page.
 */
export function ErrorPanel({
  title,
  detail,
  className,
}: {
  title: string;
  detail?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-5 sm:flex-row sm:items-start',
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-1 text-small text-ink-soft">
          No se ha modificado nada. Vuelva a intentarlo; si continúa, avise a quien administra el
          sitio.
        </p>
        {detail && (
          <p className="tabular mt-2 break-words text-small text-ink-faint">
            Detalle técnico: {detail}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending}
        className="shrink-0"
        onClick={() => startTransition(() => router.refresh())}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}
