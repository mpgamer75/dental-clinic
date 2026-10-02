'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useWatch, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formCommon } from '@/lib/data';
import type { Language } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ============================================================================
   Field chrome shared by the three public forms
   ----------------------------------------------------------------------------
   The appointment form had been brought onto the design system's own border
   tokens while the contact and testimonial forms still drew every control with
   `border-2 border-muted-foreground/20` — a hand-mixed grey at double weight
   that matched nothing else on the site. A patient who sent a question and then
   booked saw two different-looking forms from the same clinic.

   The invalid border keys off `aria-invalid`, which <FormControl> sets from the
   field's error state, so the attribute a screen reader reads and the colour a
   sighted user sees cannot disagree. Colour is never the only signal: the
   message under the field carries the same information.

   No ring-offset here: it has to match the ground the form sits on, so each
   form adds its own (`ring-offset-card` on the booking page's card).
   ========================================================================== */

const invalidClass =
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive';

export const fieldClass = cn(
  'h-12 text-base transition-colors duration-fast focus-visible:border-primary',
  invalidClass,
);

export const textareaClass = cn(
  'min-h-[9rem] resize-y text-base leading-relaxed transition-colors duration-fast focus-visible:border-primary',
  invalidClass,
);

export const fieldLabelClass = 'text-base font-medium text-ink';

/**
 * The visual asterisk on a required field.
 *
 * Visual only. Requiredness reaches assistive technology through
 * `aria-required` on the control; an sr-only "(obligatorio)" here would fold it
 * into the accessible NAME as well and be announced twice.
 */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-primary">
      {' *'}
    </span>
  );
}

/** The line that explains the asterisk, placed BEFORE the fields it governs. */
export function RequiredFieldsNote({ lang }: { lang: Language }) {
  return (
    <p className="text-small text-ink-soft">
      <span aria-hidden="true" className="font-medium text-primary">
        *
      </span>{' '}
      {formCommon[lang].requiredFields}
    </p>
  );
}

/**
 * A textarea's character counter, hidden until the last fifth of the allowance.
 *
 * A counter sitting at "0 / 1000" from the moment the page loads is not
 * feedback, it is a target — and the contact form's old one was also the
 * field's `FormDescription`, so a screen reader read "0 / 1000" as the
 * description of the message box. It counts DOWN, because remaining budget is
 * the thing being decided, and it is `aria-hidden`: the limit is stated once,
 * calmly, by an sr-only note in the field description, and `maxLength` makes an
 * overrun impossible rather than merely reported.
 *
 * Its own component so `useWatch` re-renders this <span> and nothing else.
 * A `watch()` in the form body re-rendered every control on every keystroke.
 */
export function CharacterCounter<TValues extends FieldValues>({
  control,
  name,
  max,
  remainingLabel,
  limitLabel,
}: {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  max: number;
  /** Carries `{{count}}`. */
  remainingLabel: string;
  limitLabel: string;
}) {
  const value: unknown = useWatch({ control, name });
  const length = typeof value === 'string' ? value.length : 0;
  if (length < Math.floor(max * 0.8)) return null;

  const remaining = max - length;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 tabular',
        // Weight and wording carry "you are at the ceiling", not colour:
        // `text-warning` does not clear 4.5:1 on the light grounds.
        remaining <= 0 ? 'font-medium text-ink' : 'text-ink-soft',
      )}
    >
      {remaining <= 0 ? limitLabel : remainingLabel.replace('{{count}}', String(remaining))}
    </span>
  );
}

/**
 * Persistent, reassuring success panel shown in place of a form after a
 * successful submission (calmer than a toast that vanishes).
 *
 * It takes focus on mount. Without that, submitting the form leaves focus on a
 * button that no longer exists: the browser drops focus to <body>, so a
 * keyboard user's next Tab restarts from the top of the document and a screen
 * reader user is left wherever they were. The panel replaced the entire form,
 * which is a context change large enough that focus has to follow it.
 */
export function FormSuccess({
  title,
  message,
  responseTime,
  resetLabel,
  onReset,
}: {
  title: string;
  message: string;
  responseTime?: string;
  resetLabel?: string;
  onReset?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // `preventScroll` then an explicit centred scroll: the default focus scroll
    // jumps the panel flush under the sticky header.
    panelRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div
      ref={panelRef}
      // Deliberately NOT a live region. It is already a focus target (see the
      // effect above), and a container that is both announces its contents
      // twice on most screen readers — once on insertion, once on focus.
      // `aria-labelledby` gives the focused container a name so the single
      // announcement is meaningful.
      aria-labelledby="form-success-title"
      tabIndex={-1}
      className="flex animate-fade-up flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/5 p-8 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>
      <h3 id="form-success-title" className="font-heading text-h3 font-medium text-ink">
        {title}
      </h3>
      <p className="max-w-measure text-ink-soft">{message}</p>
      {responseTime ? <p className="text-small font-medium text-success">{responseTime}</p> : null}
      {onReset && resetLabel ? (
        <Button variant="outline" onClick={onReset} className="mt-2">
          {resetLabel}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Brief privacy/consent microcopy placed under a form's submit button, with a
 * link to the privacy policy. Required trust signal for a healthcare site.
 */
export function ConsentNotice({ lang, className }: { lang: Language; className?: string }) {
  const c = formCommon[lang];
  return (
    // `mx-auto max-w-measure-tight`: this notice had no measure cap at all, so
    // on a wide form it ran to 131–145 characters per line — by some distance
    // the worst line length on the site, and on the one piece of text that is
    // a consent statement.
    <p
      className={cn(
        'mx-auto max-w-measure-tight text-center text-small leading-relaxed text-ink-soft',
        className,
      )}
    >
      {c.consentBefore}
      <Link
        href={`/${lang}/privacidad`}
        className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
      >
        {c.privacyLinkLabel}
      </Link>
      {c.consentAfter}
    </p>
  );
}
