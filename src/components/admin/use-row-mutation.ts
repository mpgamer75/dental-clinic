'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { useToast } from '@/hooks/use-toast';
import type { MutationResult } from '@/app/(admin)/admin/_lib/mutation';

import { useMutationFormData } from './csrf-provider';

/* ============================================================================
   RUNNING ONE MUTATION AGAINST ONE ROW
   ----------------------------------------------------------------------------
   Every table in the panel does the same four things around a server action —
   seal the request, mark the row busy, report the outcome, reload — and getting
   any of them wrong reproduces a bug this rewrite exists to fix.

   The one that matters most is the report. The old panel toasted "Cita
   actualizada" on a write that RLS had silently refused, because it checked
   for an error object rather than for a changed row; staff believed
   appointments were confirmed that had never been touched. The actions now
   return `{ ok }` derived from an affected-row count, and this hook makes it
   impossible to render a success toast without having read it.

   `router.refresh()` only on success. Refreshing after a failure would redraw
   the row exactly as it was and make a refused write look like a race the user
   should try again — which, for a delete, is how a second confirmation dialog
   ends up deleting the wrong thing.
   ========================================================================== */

export interface RowMutation {
  /** The row currently being written to, so its controls can go quiet. */
  pendingId: string | null;
  run: (
    id: string,
    action: (formData: FormData) => Promise<MutationResult>,
    fields?: Record<string, string>,
  ) => void;
}

export function useRowMutation(): RowMutation {
  const router = useRouter();
  const { toast } = useToast();
  const buildFormData = useMutationFormData();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const run = useCallback<RowMutation['run']>(
    (id, action, fields = {}) => {
      const formData = buildFormData({ id, ...fields });

      /* No token yet — the provider is still minting one. Nothing is sent,
         because the server would only refuse it, and the user is told to try
         again rather than shown a failure they did not cause. */
      if (!formData) {
        toast({
          title: 'Un momento',
          description: 'La sesión del formulario se está preparando. Inténtelo de nuevo enseguida.',
        });
        return;
      }

      setPendingId(id);

      startTransition(async () => {
        try {
          const result = await action(formData);

          toast({
            title: result.ok ? 'Listo' : 'No se guardó el cambio',
            description: result.message,
            variant: result.ok ? 'success' : 'destructive',
          });

          if (result.ok) router.refresh();
        } catch {
          /* A rejected Server Action means the request never completed — a lost
             connection, a deploy mid-click. Saying so is the honest answer;
             the alternative is a silent no-op the user reads as success. */
          toast({
            title: 'No se pudo completar la acción',
            description:
              'La conexión con el servidor se interrumpió y no se guardó ningún cambio. Inténtelo de nuevo.',
            variant: 'destructive',
          });
        } finally {
          setPendingId(null);
        }
      });
    },
    [buildFormData, router, toast],
  );

  return { pendingId, run };
}
