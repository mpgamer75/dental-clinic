import {
  AlertTriangle,
  Archive,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Inbox,
  MailOpen,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  AppointmentStatus,
  ContactMessageStatus,
  TestimonialStatus,
} from '@/lib/schema';

/* ============================================================================
   STATUS, SHOWN THREE WAYS
   ----------------------------------------------------------------------------
   Every badge carries a Spanish word AND a shape AND a colour. Colour alone
   fails about one man in twelve, and it fails everyone on the phone screen a
   dentist is reading in a bright surgery — but it is also the fastest signal
   there is, so this keeps all three rather than dropping to a plain label.

   Pairings are taken from the palette's safe combinations rather than picked by
   eye. `--warn` and `--brass` are mid-light and carry ink as their on-colour
   (see the note at the top of globals.css), so "needs attention" uses
   `text-brass-ink` on `bg-brass-soft` — both tuned as a text pair in both
   themes — instead of the `text-warning` that would look right in light mode
   and fail contrast the moment the page is read outdoors.

   'active' uses the shadcn semantic pair `bg-accent` / `text-accent-foreground`
   rather than a brand-specific hue, and that is a deliberate hedge. This file
   first reached for `petrol`, which the palette had at the time and no longer
   does — it was renamed on the way to the clinical navy. A missing Tailwind
   colour is not a build error: the class is simply dropped, so a renamed token
   leaves a status badge with no background and no colour and nothing warns
   anybody. `accent` and `accent-foreground` are part of the shadcn contract and
   are re-pointed by a recolour rather than renamed by one.
   ========================================================================== */

export type StatusTone = 'attention' | 'active' | 'done' | 'stopped' | 'muted';

const TONE_CLASSES: Record<StatusTone, string> = {
  attention: 'border-brass/30 bg-brass-soft text-brass-ink',
  active: 'border-primary/30 bg-accent text-accent-foreground',
  done: 'border-success/30 bg-success/10 text-success',
  stopped: 'border-destructive/30 bg-destructive/10 text-destructive',
  muted: 'border-line bg-muted text-ink-soft',
};

interface StatusMeta {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
}

export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  pending: { label: 'Pendiente', tone: 'attention', icon: Clock3 },
  confirmed: { label: 'Confirmada', tone: 'active', icon: CalendarCheck },
  completed: { label: 'Completada', tone: 'done', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', tone: 'stopped', icon: XCircle },
};

export const MESSAGE_STATUS_META: Record<ContactMessageStatus, StatusMeta> = {
  unread: { label: 'Sin leer', tone: 'attention', icon: Inbox },
  read: { label: 'Leído', tone: 'active', icon: MailOpen },
  archived: { label: 'Archivado', tone: 'muted', icon: Archive },
};

export const TESTIMONIAL_STATUS_META: Record<TestimonialStatus, StatusMeta> = {
  pending_approval: { label: 'Por revisar', tone: 'attention', icon: Clock3 },
  approved: { label: 'Publicado', tone: 'done', icon: ShieldCheck },
  rejected: { label: 'Rechazado', tone: 'stopped', icon: XCircle },
};

export function StatusBadge({
  meta,
  className,
}: {
  meta: StatusMeta;
  className?: string;
}) {
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1',
        'text-[0.72rem] font-semibold leading-none tracking-wide',
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

/**
 * The urgency flag.
 *
 * A solid destructive fill rather than a tint, and never on its own: it sits
 * beside the status badge, so "urgente y pendiente" reads as two facts. This is
 * the signal the panel it replaces let eleven routine rows push off the page.
 */
export function UrgentBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full',
        'bg-destructive px-2.5 py-1 text-[0.72rem] font-semibold leading-none tracking-wide',
        'text-destructive-foreground',
        className,
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Urgente
    </span>
  );
}

/* ============================================================================
   FABRICATED ROWS, MARKED AS SUCH
   ----------------------------------------------------------------------------
   `npm run db:demo:seed` writes rows with `is_demo = true` so the dashboard's
   charts have a shape to draw on a table holding two appointments. Those rows
   sit in the same lists as real patients, and the failure that follows is one
   phone call long: an invented name and an 809 number in the queue, dialled on
   a Monday morning, belonging to nobody.

   So the chip is QUIET, not loud. It is a label and not an alarm — muted fill,
   faint ink, hairline border, smaller than the status badge beside it — because
   the row is not a problem, it just is not a patient. Anything with a warning
   colour would compete with `UrgentBadge`, which is the one mark on this screen
   that has to win.
   ========================================================================== */

/**
 * Reads the demo flag off a row without requiring it in the row's type.
 *
 * The view models in _lib/queries.ts do not carry `isDemo` yet — the column
 * exists on all three tables and `getDemoDataPresence` counts it, but the row
 * mappers do not select it through. This signature means the three tables can
 * mark their rows the moment that one field lands, with no further edit here;
 * until then it reads false, which is the same answer it gives for a real
 * patient.
 *
 * `id` is in the parameter type only to satisfy TypeScript's weak-type check:
 * a parameter whose every property is optional accepts nothing that does not
 * share at least one of them, and today none of the three row types shares
 * `isDemo`. Every row has an id, so requiring it costs nothing and keeps the
 * function honest about what it takes — a row, not an arbitrary object.
 */
export function isDemoRow(row: { id: string; isDemo?: boolean }): boolean {
  return row.isDemo === true;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-md border border-line',
        'bg-muted px-1.5 py-0.5 text-[0.68rem] font-medium leading-none tracking-wide text-ink-faint',
        className,
      )}
      title="Fila de ejemplo creada por el script de datos de demostración. No corresponde a ningún paciente."
    >
      <FlaskConical className="h-3 w-3 shrink-0" aria-hidden="true" />
      Demo
      <span className="sr-only"> — fila de ejemplo, no es un paciente real</span>
    </span>
  );
}

/**
 * The moderation score, as a number a reviewer can act on.
 *
 * It is a queue-priority hint and nothing else — no score approves anything —
 * so it is rendered as a plain figure with a band, not as a verdict. A null
 * score is a submission that was never assessed, which is why it reads
 * "sin evaluar" rather than "0".
 */
export function ModerationScore({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-muted px-2 py-1 text-[0.72rem] font-medium text-ink-soft">
        Sin evaluar
      </span>
    );
  }

  const tone: StatusTone = score < 50 ? 'stopped' : score < 75 ? 'attention' : 'done';

  return (
    <span
      className={cn(
        'tabular inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[0.72rem] font-semibold',
        TONE_CLASSES[tone],
      )}
      title="Puntuación de moderación automática (0–100). Solo ordena la cola; no aprueba nada."
    >
      {score}
      <span className="font-normal opacity-70">/100</span>
    </span>
  );
}
