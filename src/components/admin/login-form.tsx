'use client';

import { useActionState, useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { signInAction } from '@/app/admin/_actions/session';
import { LOGIN_INITIAL_STATE } from '@/app/admin/_lib/form-contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * The sign-in form.
 *
 * `useActionState` rather than a fetch and a `useState`: the credentials go
 * straight to a Server Action, so no part of the exchange runs in code the
 * browser could be persuaded to run differently. The panel this replaces
 * authenticated in the browser and then asked the browser whether the person
 * was an administrator, which is a question the browser is not entitled to
 * answer.
 *
 * The error region is `aria-live` and always present in the DOM. Rendering it
 * only when there is a message means a screen reader is handed a region that
 * did not exist a moment ago, and the announcement is missed — which on a login
 * form is someone typing the same password again into a form that already told
 * them, silently, that it was wrong.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, LOGIN_INITIAL_STATE);
  const [revealed, setRevealed] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const failed = state.status === 'error';

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor={emailId}>Correo electrónico</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="username"
            required
            disabled={pending}
            className="pl-10"
            validationState={failed && state.field === 'email' ? 'error' : undefined}
            aria-describedby={errorId}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Contraseña</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <Input
            id={passwordId}
            name="password"
            type={revealed ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={pending}
            className="pl-10 pr-12"
            validationState={failed && state.field === 'password' ? 'error' : undefined}
            aria-describedby={errorId}
          />
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            disabled={pending}
            aria-pressed={revealed}
            aria-label={revealed ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint transition-colors duration-fast hover:bg-canvas-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div id={errorId} role="alert" aria-live="polite" className="min-h-0">
        {failed && (
          <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-small text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Entrar al panel
      </Button>
    </form>
  );
}
