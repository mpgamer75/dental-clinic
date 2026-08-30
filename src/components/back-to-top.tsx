'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

/** How far down the page the control earns its place, in CSS pixels. */
const REVEAL_AFTER = 400;

export function BackToTop() {
  const { lang } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const label = lang === 'es' ? 'Volver arriba' : 'Back to top';

  /**
   * Visibility comes from an IntersectionObserver sentinel, not a scroll
   * handler.
   *
   * The handler this replaces was registered without `{ passive: true }`, so
   * the browser had to wait for it to return before it could commit each
   * scroll — on a touch device that is the difference between a scroll that
   * tracks the finger and one that stutters. It also called `setState` on
   * every single scroll event rather than on the two moments the answer
   * actually changes.
   *
   * The sentinel is a zero-size marker parked 400px down the document. The
   * observer fires exactly twice per crossing and never runs on the main
   * thread during the scroll itself. `boundingClientRect.top` disambiguates
   * the two ways of not intersecting: scrolled past it (above the viewport,
   * negative) versus not yet reached (below it).
   */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(([entry]) => {
      setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* No positioned ancestor, so this resolves against the initial
          containing block — i.e. exactly REVEAL_AFTER pixels below the top of
          the document, which is the measurement we want. Out of flow and
          zero-size, so it costs the layout nothing. */}
      <span
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 h-px w-px"
        style={{ top: `${REVEAL_AFTER}px` }}
      />

      <Button
        onClick={scrollToTop}
        size="icon"
        /*
         * Removed from the tab order and the accessibility tree while hidden.
         *
         * The button was only visually hidden (opacity 0 + pointer-events-none),
         * so it stayed focusable: a keyboard user tabbing through the page hit an
         * invisible control announced as "Volver arriba". Opacity is not a
         * focus-management tool.
         */
        inert={!isVisible}
        className={cn(
          // Desktop only, still. The fixed MobileActionBar that used to own this
          // corner is gone, so the space is free — but a floating control on a
          // phone is `fixed`, which means it sits over the text column wherever
          // it lands. Enabling it here put a 48px navy disc squarely on top of
          // the implant legend's second step, mid-sentence. A long page is a
          // real argument for the button; covering the content the reader came
          // for is a better argument against it.
          'fixed bottom-8 right-8 z-sticky hidden h-12 w-12 rounded-full shadow-e3 lg:flex',
          'bg-primary text-primary-foreground hover:bg-primary-hover',
          // Every property in this list is compositor- or paint-only. The
          // hover state used to raise the button to `shadow-e4` as well, which
          // is not in the list and so snapped between elevations in one frame
          // — and could not simply be added to it, because a box-shadow
          // transition repaints the blurred spread every frame. The hover
          // signal is carried by the fill and the arrow's nudge instead.
          'transition-[opacity,transform,background-color] duration-base ease-out-quart',
          'group',
          isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        )}
        aria-label={label}
        title={label}
      >
        <ArrowUp
          className="h-5 w-5 transition-transform duration-base group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </Button>
    </>
  );
}
