'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The confirmation in front of every destructive action.
 *
 * One dialog per table, driven by state, rather than one per row: twenty rows
 * would otherwise mount twenty portals, twenty focus traps and twenty sets of
 * listeners to show at most one of them.
 *
 * `description` names the specific record — "la cita de María Rodríguez" — not
 * "este elemento". A confirmation that does not say what it is about is a
 * button people learn to click through, which is the same as not having one.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-line bg-surface">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-h4 text-ink">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-body text-ink-soft">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          {/* Cancel first in the DOM so it is the first tab stop and the
              Escape-equivalent for anyone navigating by keyboard. */}
          <AlertDialogCancel className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-0')}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(buttonVariants({ variant: 'destructive', size: 'sm' }))}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
