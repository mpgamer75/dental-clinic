/**
 * The assembly's timeline, shared by everything that has to agree about it.
 *
 * The WebGL scene and the 2D plate animate the same four phases over the same
 * scroll progress, and <ImplantStage> names the current one in its caption and
 * reports it to the legend beside the figure. These windows used to be written
 * out twice — once per visual, with a comment begging them to stay identical —
 * while the caption ignored them entirely and split the scroll into four equal
 * quarters. So it said "Pilar" from 0.25 onward while the fixture was still
 * threading into the bone until 0.46: the caption under the figure and the
 * figure itself disagreed for a fifth of the sequence.
 *
 * ORDER IS ASSEMBLY ORDER, and it is a contract with `implantEducation.parts`
 * in src/lib/data.ts (keys fixture → abutment → crown → bone): the phase the
 * figure is in lights the legend row at the same index.
 */

/** Scroll-progress window over which each part moves into place. Overlapping
 *  on purpose — the next part starts before the previous one has settled, which
 *  is what makes it read as one assembly rather than four separate events. */
export const PHASE_WINDOWS = {
  fixture: [0.06, 0.46],
  abutment: [0.42, 0.68],
  crown: [0.62, 0.86],
  /** Osseointegration: the new bone filling the thread valleys. */
  bone: [0.84, 1],
} as const;

const ORDER = ['fixture', 'abutment', 'crown', 'bone'] as const;

/**
 * Where the caption — and the legend row it lights — hands over from one part
 * to the next: halfway through the overlap of their two windows, which is the
 * moment the arriving part's motion starts to dominate the departing one's.
 * Derived, so moving a window moves the handover with it. [0.44, 0.65, 0.85]
 */
export const PHASE_HANDOVERS: readonly number[] = ORDER.slice(1).map((key, i) => {
  const departing = PHASE_WINDOWS[ORDER[i]];
  const arriving = PHASE_WINDOWS[key];
  return (arriving[0] + departing[1]) / 2;
});

/**
 * Index of the phase showing at `progress`, for a caption list of `count`.
 *
 * Four labels follow the windows above. Any other count falls back to equal
 * slices, so a caller with a different list degrades to the old behaviour
 * rather than indexing past its own array.
 */
export function phaseIndexAt(progress: number, count: number): number {
  if (count <= 1) return 0;
  if (count === ORDER.length) {
    let i = 0;
    while (i < PHASE_HANDOVERS.length && progress >= PHASE_HANDOVERS[i]) i++;
    return i;
  }
  return Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
}
