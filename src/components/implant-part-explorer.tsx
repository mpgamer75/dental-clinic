'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RevealGroup, RevealItem } from '@/components/reveal';
import { TiltCard } from '@/components/tilt-card';
import type { ImplantPartDetail, ImplantPartKey, ImplantPartsUi } from '@/lib/data';
import { cn } from '@/lib/utils';

/* ───────────────────────────────────────────────────────────────────────────
   The implant parts, and the explanation behind each

   Four cards, one per piece of an implant. Each used to carry a single
   sentence and do nothing; pressing one now opens the full explanation of that
   piece: what it is made of, what it does, how it is placed, what the patient
   notices, the two questions people ask about it, and where the implant guide
   goes further.

   The copy never enters this file as an import. `data.ts` is read by the
   server component, which hands the active language's text down as props, so
   it is serialised once into the page and the other language is not shipped.
   The card faces arrive the same way, already rendered (`face`): this file
   adds only what needs a browser, the press and the dialog.
   ─────────────────────────────────────────────────────────────────────────── */

export interface ImplantPartItem {
  key: ImplantPartKey;
  label: string;
  /** The card's face (render, number, name, one-liner), rendered on the server. */
  face: ReactNode;
}

interface ImplantPartExplorerProps {
  /** In assembly order, which is also the order prev/next walks. */
  items: ImplantPartItem[];
  details: Record<ImplantPartKey, ImplantPartDetail>;
  ui: ImplantPartsUi;
  /** Each part's page in the implant guide, resolved on the server. */
  guideHrefs: Record<ImplantPartKey, string>;
  appointmentHref: string;
  ctaLabel: string;
}

function fillTokens(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    key in vars ? String(vars[key]) : '',
  );
}

const FOCUS_ON_SURFACE =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function ImplantPartExplorer({
  items,
  details,
  ui,
  guideHrefs,
  appointmentHref,
  ctaLabel,
}: ImplantPartExplorerProps) {
  /* `open` and `index` are separate so the dialog keeps its content while it
     fades out. With a single nullable index the panel emptied the instant it
     was dismissed and the exit animation played on a blank sheet. */
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  const openAt = useCallback((next: number) => {
    setIndex(next);
    setOpen(true);
  }, []);

  const total = items.length;
  const item = items[index];
  const detail = item ? details[item.key] : undefined;

  const step = (direction: 1 | -1) => setIndex((current) => (current + direction + total) % total);

  return (
    <>
      <RevealGroup as="ol" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((part, i) => (
          <RevealItem key={part.key} as="li" index={i} className="h-full">
            {/* The whole card answers a click or a tap, and the pill at its
                foot is the real control: a <button> a keyboard can reach and a
                screen reader names. It has no handler of its own on purpose —
                its click bubbles to the card's, so there is one code path and
                a press on the pill cannot open the dialog twice. */}
            <TiltCard
              className="group/part h-full cursor-pointer rounded-2xl border border-line bg-surface"
              onClick={() => openAt(i)}
            >
              <div className="tilt-layer flex h-full flex-col p-6">
                {part.face}
                {/* Always drawn, not revealed on hover: most visitors are on
                    phones, where there is no hover to tell them the card
                    opens. */}
                <div className="mt-auto pt-5">
                  <button
                    ref={(node) => {
                      triggers.current[i] = node;
                    }}
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={fillTokens(ui.openLabel, { label: part.label })}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-border bg-primary-soft py-2 pl-4 pr-3 font-medium text-primary transition-colors duration-base ease-out-quart group-hover/part:border-primary group-hover/part:bg-primary group-hover/part:text-primary-foreground',
                      FOCUS_ON_SURFACE,
                    )}
                  >
                    {ui.learnMore}
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Built on the Radix primitive, like the diploma lightbox, and for the
          same reasons: focus trapping, Escape, inerting the page and scroll
          locking are what a hand-rolled overlay gets wrong, and `ui/dialog` is
          a centred max-w-lg card where this is a reader: the full screen on a
          phone, a two-column panel on a wide one.

          One Root serves all four cards so prev/next can walk between them.
          That means no <Dialog.Trigger>, so Radix cannot return focus by
          itself; `onCloseAutoFocus` sends it to the card of the part that was
          being read when the dialog closed. */}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-overlay bg-drench-deep/80 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <DialogPrimitive.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              triggers.current[index]?.focus({ preventScroll: true });
            }}
            onKeyDown={(event) => {
              if (total < 2) return;
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                step(1);
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                step(-1);
              }
            }}
            /* Centred on wide screens with `m-auto` inside `inset-0`, not with
               a translate: the enter animation is itself a transform, and the
               two must not have to be composed to keep the panel in place. */
            className="fixed inset-0 z-modal flex flex-col bg-surface text-ink focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 lg:m-auto lg:h-[min(46rem,90dvh)] lg:w-[min(66rem,92vw)] lg:overflow-hidden lg:rounded-2xl lg:shadow-e5"
          >
            {item && detail && (
              <>
                {/* The numbers are the index and a way around it; the close
                    control is spelled out as a word, at full tap size, because
                    a bare × in a corner is the control older readers miss. */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5">
                  <nav aria-label={ui.partsNav}>
                    <ol className="flex items-center gap-1">
                      {items.map((part, i) => {
                        const current = i === index;
                        return (
                          <li key={part.key}>
                            <button
                              type="button"
                              onClick={() => setIndex(i)}
                              aria-label={part.label}
                              aria-current={current ? 'step' : undefined}
                              className={cn(
                                'tabular flex h-11 w-11 items-center justify-center rounded-full text-small font-semibold transition-colors duration-fast ease-out-quart',
                                FOCUS_ON_SURFACE,
                                current
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-ink-soft hover:bg-primary-soft hover:text-primary',
                              )}
                            >
                              {String(i + 1).padStart(2, '0')}
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                  <DialogPrimitive.Close
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong py-2 pl-4 pr-3 font-medium text-ink transition-colors duration-fast ease-out-quart hover:bg-canvas-sunk',
                      FOCUS_ON_SURFACE,
                    )}
                  >
                    {ui.close}
                    <X className="h-5 w-5" aria-hidden="true" />
                  </DialogPrimitive.Close>
                </div>

                {/* Keyed by part: stepping remounts this region, which returns
                    the scroll to the top (the reader was at the foot of the
                    last part) and replays the short entrance. On a phone the
                    whole region scrolls and the blue header leaves with it; on
                    a wide screen the header stands still and only the text
                    column scrolls. */}
                <div
                  key={item.key}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:overflow-hidden"
                >
                  <header className="bg-drench px-6 py-7 text-drench-on sm:px-8 lg:flex lg:flex-col lg:justify-center lg:overflow-y-auto lg:px-10 lg:py-10">
                    <div className="flex items-center gap-5 lg:block">
                      <span className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-36 sm:w-36 lg:h-56 lg:w-56">
                        <span aria-hidden="true" className="icon-plinth icon-plinth-on-drench" />
                        {/* Decorative: the title beside it names the part. */}
                        <Image
                          src={`/images/icons/${item.key}.webp`}
                          alt=""
                          width={224}
                          height={224}
                          sizes="(min-width: 1024px) 224px, 144px"
                          className="relative h-24 w-24 object-contain duration-500 ease-out-quint animate-in fade-in-0 zoom-in-90 sm:h-32 sm:w-32 lg:h-48 lg:w-48"
                        />
                      </span>
                      <div className="min-w-0 lg:mt-7">
                        <p className="tabular text-small font-medium text-brass-lift">
                          {fillTokens(ui.counter, { index: index + 1, total })}
                        </p>
                        <DialogPrimitive.Title className="mt-1 font-heading text-h3 font-semibold text-drench-on lg:text-h2">
                          {item.label}
                        </DialogPrimitive.Title>
                      </div>
                    </div>
                    <DialogPrimitive.Description className="mt-5 leading-relaxed text-drench-on/80 lg:mt-4">
                      {detail.definition}
                    </DialogPrimitive.Description>
                  </header>

                  <div className="px-6 py-7 duration-300 ease-out-quart animate-in fade-in-0 slide-in-from-bottom-2 sm:px-8 lg:overflow-y-auto lg:overscroll-contain lg:px-10 lg:py-9">
                    <section>
                      <h3 className="font-body text-small font-semibold text-brass-ink">{ui.factsTitle}</h3>
                      <dl className="mt-3 divide-y divide-line rounded-xl border border-line bg-canvas-sunk">
                        {detail.facts.map((fact) => (
                          <div key={fact.term} className="grid gap-x-6 gap-y-0.5 px-4 py-3 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
                            <dt className="text-small text-ink-faint sm:pt-0.5">{fact.term}</dt>
                            <dd className="font-medium text-ink">{fact.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>

                    <div className="mt-8 space-y-7">
                      {detail.sections.map((section) => (
                        <section key={section.heading}>
                          <h3 className="font-heading text-h4 font-semibold text-ink">{section.heading}</h3>
                          <p className="mt-2 max-w-measure leading-relaxed text-ink-soft">{section.body}</p>
                        </section>
                      ))}
                    </div>

                    {/* Shown open, not as an accordion: there are two, and a
                        collapsed answer is one more tap between a patient and
                        the thing they came to read. */}
                    <section className="mt-9 rounded-xl bg-primary-soft p-5 sm:p-6">
                      <h3 className="font-body text-small font-semibold text-brass-ink">{ui.faqTitle}</h3>
                      <dl className="mt-3 space-y-5">
                        {detail.faq.map((entry) => (
                          <div key={entry.question}>
                            <dt className="font-semibold text-ink">{entry.question}</dt>
                            <dd className="mt-1.5 max-w-measure leading-relaxed text-ink-soft">{entry.answer}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>

                    <div className="mt-9 border-t border-line pt-6">
                      <p className="text-small text-ink-faint">{ui.guideLead}</p>
                      <Link
                        href={guideHrefs[item.key]}
                        className={cn(
                          'group/guide mt-1 inline-flex min-h-11 items-center gap-2 rounded-sm font-medium text-primary underline-offset-4 hover:underline',
                          FOCUS_ON_SURFACE,
                        )}
                      >
                        {detail.guideLabel}
                        <ArrowRight
                          className="h-4 w-4 shrink-0 transition-transform duration-base ease-out-quart group-hover/guide:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </Link>
                      <div className="mt-5">
                        <Button asChild size="lg">
                          <Link href={appointmentHref}>{ctaLabel}</Link>
                        </Button>
                      </div>
                      <p className="mt-6 max-w-measure text-small text-ink-faint">{ui.disclaimer}</p>
                    </div>
                  </div>
                </div>

                {/* Outside the scrolling region, so the way to the next part
                    is on screen wherever the reader has got to. It wraps round
                    rather than disabling at the ends: a button that goes
                    disabled under the finger that pressed it drops keyboard
                    focus out of the dialog. */}
                {total > 1 && (
                  <div className="flex shrink-0 gap-3 border-t border-line px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
                    <StepButton
                      direction="prev"
                      hint={ui.prev}
                      label={items[(index - 1 + total) % total]?.label ?? ''}
                      onClick={() => step(-1)}
                    />
                    <StepButton
                      direction="next"
                      hint={ui.next}
                      label={items[(index + 1) % total]?.label ?? ''}
                      onClick={() => step(1)}
                    />
                  </div>
                )}

                {/* Stepping changes content the dialog already announced. */}
                <p role="status" aria-live="polite" className="sr-only">
                  {fillTokens(ui.counter, { index: index + 1, total })} — {item.label}
                </p>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

/** Names the part it leads to, so "next" is never a blind step. */
function StepButton({
  direction,
  hint,
  label,
  onClick,
}: {
  direction: 'prev' | 'next';
  hint: string;
  label: string;
  onClick: () => void;
}) {
  const next = direction === 'next';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 transition-colors duration-fast ease-out-quart sm:px-4',
        FOCUS_ON_SURFACE,
        next
          ? 'flex-row-reverse border-primary bg-primary text-right text-primary-foreground hover:bg-primary-hover'
          : 'border-line-strong text-left text-ink hover:bg-canvas-sunk',
      )}
    >
      {next ? (
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
      ) : (
        <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
      <span className="min-w-0">
        <span className="block text-small">{hint}</span>
        <span className="block truncate font-semibold">{label}</span>
      </span>
    </button>
  );
}
