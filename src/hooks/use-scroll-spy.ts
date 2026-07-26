'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A nav entry and the page sections it owns.
 *
 * Sections outnumber nav items on this page (eleven bands, five links), so each
 * link claims a *range* of the page rather than a single anchor. That is what
 * keeps exactly one item lit the whole way down instead of the indicator
 * blinking off in the gaps.
 */
export interface SpyGroup {
  key: string;
  /** Element ids, in document order. The first is the link's own anchor. */
  sections: string[];
}

/** Minimum hold after a nav click. */
const PIN_MS = 600;
/** Each crossing seen while pinned pushes the release out by this much. */
const PIN_EXTEND = 250;
/** Absolute cap, so a pin can never outlive the navigation that caused it. */
const PIN_CEILING = 2400;

/**
 * Scrollspy.
 *
 * The band: `rootMargin: '-45% 0px -50% 0px'` collapses the observer root to a
 * 5%-tall strip across the middle of the viewport. Because the strip is thinner
 * than any section, at most one section can ever be inside it — which is the
 * whole trick. A plain `threshold: 0.5` observer instead lights two or three
 * items at once wherever sections are shorter than the viewport.
 *
 * Three edge cases, each of which breaks a naive implementation:
 *
 *  1. *Clicking a link.* Smooth scrolling drags the band through every section
 *     between here and the target, so the indicator strobes down the bar.
 *     `pin()` sets the destination immediately and ignores observer output
 *     while the journey lasts, then re-derives from the state the observer
 *     recorded meanwhile.
 *
 *     A flat timeout is not enough: the trip from the hero to the last section
 *     is 11,700px here and outlasts any figure short enough to feel responsive
 *     on a neighbouring link — measured, a 600ms pin let the indicator strobe
 *     through two intermediate sections before settling. So the pin is *held
 *     open by the crossings themselves*: every callback that arrives while
 *     pinned pushes the release out another 250ms, up to a hard ceiling. The
 *     band going quiet is the signal that the scroll has arrived, and it needs
 *     neither a `scroll` listener nor `scrollend` (which Safari lacks).
 *
 *  2. *An empty band.* Between two tracked ranges, or over the hero, nothing
 *     intersects. Clearing the active item there makes the bar flicker, so the
 *     last resolved value is held. The caller decides when "nothing" is the
 *     honest answer (this navbar clears it at the top of the page, where the
 *     hero is on screen and no section is).
 *
 *  3. *The last section.* If it is shorter than the distance from the band to
 *     the foot of the document it can never reach the band, so it would never
 *     activate. A second observer whose root is a thin strip pinned to the
 *     BOTTOM of the viewport catches this: the last section stops intersecting
 *     that strip exactly when its own bottom edge rises into view, i.e. when
 *     the end of the content is on screen. Still no scroll listener.
 */
export function useScrollSpy(groups: SpyGroup[], resetKey = '') {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // The array identity changes every render; the observer must not.
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  // `resetKey` is the route: the observers hold element references, and a
  // client-side navigation replaces every one of them. Without it, arriving at
  // the homepage from another page leaves the spy watching detached nodes and
  // the bar never lights up again.
  const signature = `${resetKey}::${groups.map((g) => `${g.key}:${g.sections.join('|')}`).join(',')}`;

  const pinnedUntil = useRef(0);
  const pinCeiling = useRef(0);
  const pinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  // Re-checks when the pin is due to lift, rescheduling itself if a crossing
  // pushed the deadline out in the meantime.
  const scheduleRelease = useCallback(() => {
    if (pinTimer.current) clearTimeout(pinTimer.current);
    pinTimer.current = setTimeout(
      () => {
        pinTimer.current = null;
        if (Date.now() < pinnedUntil.current) {
          scheduleRelease();
          return;
        }
        resolveRef.current?.();
      },
      Math.max(0, pinnedUntil.current - Date.now()) + 20,
    );
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const currentGroups = groupsRef.current;
    const keyForSection = new Map<string, string>();
    const ordered: HTMLElement[] = [];

    currentGroups.forEach((group) => {
      group.sections.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        keyForSection.set(id, group.key);
        ordered.push(el);
      });
    });

    // Not the homepage (or the sections were renamed): no spy, no active item.
    if (ordered.length === 0) {
      setActiveKey(null);
      return;
    }

    const inBand = new Map<string, boolean>();
    let atEnd = false;

    const resolve = () => {
      if (Date.now() < pinnedUntil.current) return;

      if (atEnd) {
        const last = currentGroups[currentGroups.length - 1];
        if (last) setActiveKey(last.key);
        return;
      }

      for (const el of ordered) {
        if (inBand.get(el.id)) {
          setActiveKey(keyForSection.get(el.id) ?? null);
          return;
        }
      }
      // Band empty — hold the previous value. See (2) above.
    };
    resolveRef.current = resolve;

    const bandObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => inBand.set(entry.target.id, entry.isIntersecting));

        // Still travelling to a clicked target: record where we are, show
        // nothing of it, and hold the pin open a little longer.
        if (Date.now() < pinnedUntil.current) {
          // Math.max against the CURRENT pin, not a bare assignment.
          // Assigning let an early crossing (~40ms into a smooth scroll) cut
          // the 600ms floor down to ~290ms, so the pin could lift mid-flight
          // and light an intermediate section — the exact strobe this is here
          // to prevent.
          pinnedUntil.current = Math.min(
            pinCeiling.current,
            Math.max(pinnedUntil.current, Date.now() + PIN_EXTEND),
          );
          scheduleRelease();
          return;
        }

        resolve();
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    ordered.forEach((el) => bandObserver.observe(el));

    const lastEl = ordered[ordered.length - 1];
    const endObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        // Root is a 4%-tall strip at the foot of the viewport. Leaving it
        // upwards (rect bottom above the strip's top) means the end of the
        // content is on screen; leaving it downwards means we are still above.
        const stripTop = entry.rootBounds?.top ?? window.innerHeight * 0.96;
        atEnd = !entry.isIntersecting && entry.boundingClientRect.bottom <= stripTop;
        resolve();
      },
      { rootMargin: '-96% 0px 0px 0px', threshold: 0 },
    );
    endObserver.observe(lastEl);

    return () => {
      bandObserver.disconnect();
      endObserver.disconnect();
      resolveRef.current = null;
    };
    // `scheduleRelease` is stable (useCallback with no deps); it is listed only
    // so the effect never silently drifts out of date if that changes.
  }, [signature, scheduleRelease]);

  useEffect(
    () => () => {
      if (pinTimer.current) clearTimeout(pinTimer.current);
    },
    [],
  );

  /** Call when a nav link is followed. See (1) above. */
  const pin = useCallback(
    (key: string) => {
      setActiveKey(key);
      const now = Date.now();
      pinnedUntil.current = now + PIN_MS;
      pinCeiling.current = now + PIN_CEILING;
      scheduleRelease();
    },
    [scheduleRelease],
  );

  return { activeKey, pin };
}
