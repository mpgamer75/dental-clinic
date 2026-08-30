'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';

import { signOutAction } from '@/app/(admin)/admin/_actions/session';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import { useMutationFormData } from './csrf-provider';

/**
 * Ends the session and returns to the login form.
 *
 * The action redirects on success, so the only result this component can
 * actually receive is a failure — and it must be shown. A sign-out button that
 * silently does nothing leaves someone believing they have logged out of a
 * clinic's patient records on a shared machine.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  const buildFormData = useMutationFormData();
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant="onDrench"
      size="sm"
      className="w-full"
      loading={pending}
      disabled={pending}
      onClick={() => {
        const formData = buildFormData({});
        if (!formData) {
          toast({
            title: 'Un momento',
            description: 'Todavía se está preparando la sesión. Inténtelo de nuevo enseguida.',
          });
          return;
        }

        startTransition(async () => {
          const result = await signOutAction(formData);
          /* Reached only when the action refused; a success redirects and this
             component is gone before it can resolve. */
          if (!result.ok) {
            toast({
              title: 'No se pudo cerrar la sesión',
              description: result.message,
              variant: 'destructive',
            });
          }
        });
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Cerrar sesión
    </Button>
  );
}
