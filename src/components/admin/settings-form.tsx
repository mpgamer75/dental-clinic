'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, useTransition, type FormEvent } from 'react';
import { CalendarDays, MailQuestion, MessageSquareQuote, TriangleAlert } from 'lucide-react';

import { updateSiteSettings } from '@/app/(admin)/admin/_actions/settings';
import { SETTINGS_FIELDS } from '@/app/(admin)/admin/_lib/form-contracts';
import type { SiteSettingsView } from '@/app/(admin)/admin/_lib/queries';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { CsrfInput, useCsrf } from './csrf-provider';

/* ============================================================================
   SITE SETTINGS
   ----------------------------------------------------------------------------
   Four booleans that have existed in `app.site_settings` since the first
   migration and that nothing has ever read or written. These are the controls.

   Each toggle says what happens to a VISITOR when it is off, not what the
   column is called. "allow_appointments" is a schema name; "los pacientes no
   podrán solicitar cita desde el sitio" is the decision someone is actually
   making, and it is the difference between a switch people use and a switch
   people are afraid of.

   Save is disabled until something changes. Not for tidiness — a save button
   that is always live invites a click that writes the same row again, and each
   of those is an audit entry saying a change was made when none was.
   ========================================================================== */

type Flags = Pick<
  SiteSettingsView,
  'maintenanceMode' | 'allowAppointments' | 'allowTestimonials' | 'allowContactForm'
>;

interface ToggleSpec {
  key: keyof Flags;
  field: string;
  label: string;
  /** What the visitor experiences when the switch is OFF. */
  offEffect: string;
  icon: typeof CalendarDays;
}

const TOGGLES: readonly ToggleSpec[] = [
  {
    key: 'allowAppointments',
    field: SETTINGS_FIELDS.allowAppointments,
    label: 'Solicitudes de cita',
    offEffect:
      'Con esta opción desactivada, el formulario de citas deja de aceptar solicitudes y se invita al paciente a llamar por teléfono.',
    icon: CalendarDays,
  },
  {
    key: 'allowContactForm',
    field: SETTINGS_FIELDS.allowContactForm,
    label: 'Formulario de contacto',
    offEffect:
      'Con esta opción desactivada, el sitio deja de recibir mensajes escritos y solo se muestran el teléfono y la dirección.',
    icon: MailQuestion,
  },
  {
    key: 'allowTestimonials',
    field: SETTINGS_FIELDS.allowTestimonials,
    label: 'Envío de testimonios',
    offEffect:
      'Con esta opción desactivada, los pacientes no pueden enviar testimonios nuevos. Los ya publicados siguen visibles.',
    icon: MessageSquareQuote,
  },
];

export function SettingsForm({ settings }: { settings: SiteSettingsView }) {
  const router = useRouter();
  const { toast } = useToast();
  const { ready } = useCsrf();
  const [pending, startTransition] = useTransition();
  const maintenanceId = useId();

  const initial: Flags = {
    maintenanceMode: settings.maintenanceMode,
    allowAppointments: settings.allowAppointments,
    allowTestimonials: settings.allowTestimonials,
    allowContactForm: settings.allowContactForm,
  };

  const [saved, setSaved] = useState<Flags>(initial);
  const [draft, setDraft] = useState<Flags>(initial);

  const dirty = (Object.keys(draft) as (keyof Flags)[]).some((key) => draft[key] !== saved[key]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateSiteSettings(formData);

      toast({
        title: result.ok ? 'Configuración guardada' : 'No se guardó la configuración',
        description: result.message,
        variant: result.ok ? 'success' : 'destructive',
      });

      if (result.ok) {
        /* The saved baseline moves only on a confirmed write, so a failure
           leaves the form dirty and the button live — the change is still
           there to be retried rather than silently discarded. */
        setSaved(draft);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <CsrfInput />

      {/* Maintenance sits apart because it is the only switch that changes what
          every visitor sees rather than what one form does. */}
      <div
        className={cn(
          'rounded-xl border bg-surface p-5 transition-colors duration-base ease-out-quart',
          draft.maintenanceMode ? 'border-destructive/30' : 'border-line',
        )}
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              draft.maintenanceMode
                ? 'bg-destructive/10 text-destructive'
                : 'bg-canvas-sunk text-ink-soft',
            )}
          >
            <TriangleAlert className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <label htmlFor={maintenanceId} className="font-heading text-h4 text-ink">
              Modo mantenimiento
            </label>
            <p className="mt-1 max-w-measure text-body text-ink-soft">
              Cuando está activo, el sitio público muestra un aviso de mantenimiento en lugar del
              contenido habitual. Úselo solo mientras se trabaja en el sitio.
            </p>
            {draft.maintenanceMode && (
              <p
                role="status"
                className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-small font-medium text-destructive"
              >
                Al guardar, el sitio público dejará de estar disponible para los pacientes.
              </p>
            )}
          </div>

          <Switch
            id={maintenanceId}
            name={SETTINGS_FIELDS.maintenanceMode}
            checked={draft.maintenanceMode}
            onCheckedChange={(checked) =>
              setDraft((current) => ({ ...current, maintenanceMode: checked }))
            }
            aria-describedby={`${maintenanceId}-help`}
          />
          <span id={`${maintenanceId}-help`} className="sr-only">
            Activa el aviso de mantenimiento en el sitio público.
          </span>
        </div>
      </div>

      <div className="divide-y divide-line rounded-xl border border-line bg-surface">
        {TOGGLES.map((toggle) => {
          const Icon = toggle.icon;
          const inputId = `setting-${toggle.field}`;

          return (
            <div key={toggle.field} className="flex items-start gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-canvas-sunk text-ink-soft">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <label htmlFor={inputId} className="font-medium text-ink">
                  {toggle.label}
                </label>
                <p id={`${inputId}-help`} className="mt-1 max-w-measure text-small text-ink-soft">
                  {toggle.offEffect}
                </p>
              </div>

              <Switch
                id={inputId}
                name={toggle.field}
                checked={draft[toggle.key]}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({ ...current, [toggle.key]: checked }))
                }
                aria-describedby={`${inputId}-help`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-ink-faint">
          Última modificación: {settings.updatedAtLabel}
          {settings.updatedBy ? ` por ${settings.updatedBy}` : ''}
        </p>

        <div className="flex items-center gap-2">
          {dirty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setDraft(saved)}
            >
              Descartar
            </Button>
          )}
          <Button type="submit" size="sm" loading={pending} disabled={!dirty || !ready}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </form>
  );
}
