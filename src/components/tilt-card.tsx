'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * A card that leans towards the pointer, with its picture lifting off it.
 *
 * After the React Bits "Tilted Card" (reactbits.dev), rewritten: the upstream
 * component is built on framer-motion springs, which this project keeps out of
 * the bundle, and it tilts a single image where these cards hold an icon, a
 * heading, prose and sometimes a link.
 *
 * How it works. The script does one thing: on pointer move it writes four
 * custom properties — two angles and the pointer's position — at most once a
 * frame. Everything visible is CSS reading them (`.tilt-card` in globals.css):
 *
 *   the card       rotates in 3D towards the pointer
 *   `.tilt-pop`    children marked with it rise off the surface (translateZ),
 *                  so the icon visibly parts from the card as it turns
 *   `.tilt-glare`  a pool of light under the pointer
 *   the edge       a shadow layer fades in, so the lifted card has weight
 *
 * The card is NOT `overflow: hidden`, and must not be given it: clipping
 * flattens a 3D context, and the lifted icon would be pressed back into the
 * surface. Anything that needs clipping (a background wash) goes in its own
 * absolutely positioned child with `rounded-[inherit] overflow-hidden`.
 *
 * Fine pointers only. A touch has no hover, and a card that lurches when a
 * thumb lands on it to scroll is a fault, not an effect; reduced motion skips
 * it too. In both cases the card is simply a card.
 */
export function TiltCard({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let x = 0.5;
    let y = 0.5;

    const apply = () => {
      frame = 0;
      card.style.setProperty('--tilt-rx', `${((0.5 - y) * 11).toFixed(2)}deg`);
      card.style.setProperty('--tilt-ry', `${((x - 0.5) * 13).toFixed(2)}deg`);
      card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onEnter = () => card.setAttribute('data-active', '');
    const onLeave = () => {
      card.removeAttribute('data-active');
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      card.style.setProperty('--tilt-rx', '0deg');
      card.style.setProperty('--tilt-ry', '0deg');
    };

    card.addEventListener('pointerenter', onEnter);
    card.addEventListener('pointermove', onMove, { passive: true });
    card.addEventListener('pointerleave', onLeave);
    return () => {
      card.removeEventListener('pointerenter', onEnter);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={cn('tilt-card', className)}>
      {children}
      <span aria-hidden="true" className="tilt-glare" />
    </div>
  );
}
