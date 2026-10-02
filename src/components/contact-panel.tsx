'use client';

import dynamic from 'next/dynamic';
import { useId, useState } from 'react';
import { ChevronDown, PenLine } from 'lucide-react';

import { cn } from '@/lib/utils';

/* Loaded only when the panel opens (and prefetched when the pointer or focus
   reaches the toggle). The form and its validation stack were part of the
   homepage's initial JavaScript for a panel at the very bottom of the page. */
const loadForm = () => import('@/components/contact-form');
const ContactForm = dynamic(() => loadForm().then((m) => m.ContactForm), {
  loading: () => <div className="skeleton h-96 w-full" aria-hidden="true" />,
});

interface ContactPanelProps {
  title: string;
  lead: string;
  toggleLabel: string;
}

/**
 * The general-questions form, folded.
 *
 * It used to be a full band of its own, with a heading of its own, after the
 * booking band — a second form competing with the appointment request for the
 * same visitor, and the last thing the page said. It is still here for the
 * patient who wants to ask about insurance before booking anything, one press
 * away, and the admin's Mensajes inbox keeps receiving it.
 */
export function ContactPanel({ title, lead, toggleLabel }: ContactPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const prefetch = () => void loadForm();

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-x-8 gap-y-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-heading text-h4 font-medium text-ink">{title}</h3>
          <p className="mt-1.5 max-w-measure text-small leading-relaxed text-ink-soft">{lead}</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          onPointerEnter={prefetch}
          onFocus={prefetch}
          className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-lg border border-line-strong px-4 text-small font-medium text-ink transition-colors duration-fast ease-out-quart hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:self-auto"
        >
          <PenLine className="h-4 w-4" aria-hidden="true" />
          {toggleLabel}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-base ease-out-quart', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>

      <div id={panelId} hidden={!open} className="mt-7 border-t border-line pt-7">
        {open && <ContactForm />}
      </div>
    </div>
  );
}
