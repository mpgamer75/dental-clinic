import { Newsreader, Instrument_Sans } from 'next/font/google';

/* ============================================================================
   TYPE
   ----------------------------------------------------------------------------
   Declared once and imported by both root layouts. next/font hashes and
   preloads per call site, so instantiating these in two layout files would emit
   two @font-face sets for the same faces and preload the same bytes twice under
   different URLs.
   ========================================================================== */

/**
 * Newsreader (Production Type) — headings, pull-quotes, display.
 *
 * Chosen over the previous Piazzolla for one measurable reason: Piazzolla's
 * optical-size axis stops at 30, so an 88px hero headline was a 30pt TEXT
 * master scaled up, and its stroke contrast is a near-monolinear ~1.5:1 at
 * every size — at display sizes that reads as an even grey slab rather than a
 * drawn letter. Newsreader runs opsz 6–72 and its contrast modulates from
 * ~2.1:1 to ~4.6:1 as size rises, which is the whole reason display serifs
 * look expensive. Optical sizing is free via the CSS default
 * `font-optical-sizing: auto` — do NOT set `font-variation-settings: 'opsz'`,
 * which disables it and also overrides font-weight.
 *
 * Its digits are monowidth by default, which matters here: the stat counters,
 * phone numbers and diploma years all carry `.tabular`.
 *
 * SUBSETTING: `latin` only, and italic is gone. Both were costs on the LCP
 * path — six preloaded woff2 files, ~537 KB, competing with the hero image for
 * the same connection. Latin-1 covers every character Spanish needs (ñ á é í ó
 * ú ü ¿ ¡), and the italic was used once, below the fold. A name that falls
 * outside Latin-1 now renders in the fallback serif rather than costing every
 * visitor the extra subset on every page.
 */
export const fontHeading = Newsreader({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-heading',
  display: 'swap',
});

/**
 * Instrument_Sans (Rodrigo Fuenzalida / Jordan Egstad) — body, UI, forms.
 *
 * Paired on the serif↔grotesk axis. Its `wdth` 75–100 axis is genuinely useful
 * for Spanish, which runs 20–25% longer than English.
 */
export const fontBody = Instrument_Sans({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-body',
  display: 'swap',
});

/** Applied to <html> by both root layouts. */
export const fontVariables = `${fontHeading.variable} ${fontBody.variable}`;
