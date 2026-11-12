import { Schibsted_Grotesk, Instrument_Sans } from 'next/font/google';

/* ============================================================================
   TYPE
   ----------------------------------------------------------------------------
   Declared once and imported by both root layouts. next/font hashes and
   preloads per call site, so instantiating these in two layout files would emit
   two @font-face sets for the same faces and preload the same bytes twice under
   different URLs.
   ========================================================================== */

/**
 * Schibsted Grotesk — headings and display.
 *
 * Replaced Newsreader in the titanium rebrand. A high-contrast display serif
 * over a navy-and-brass band was the "boutique editorial" register, and it is
 * the main reason the site read like the fashion boutique in the same plaza.
 * A compact grotesk reads as instrument and precision, which is what an
 * implant practice sells. Display sizes take negative tracking in globals.css,
 * because a grotesk set loose at 80px reads as spaced-out letters.
 *
 * Latin subset only: Latin-1 covers every Spanish character (ñ á é í ó ú ü ¿ ¡).
 */
export const fontHeading = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

/**
 * Instrument_Sans (Rodrigo Fuenzalida / Jordan Egstad) — body, UI, forms.
 *
 * Paired on the serif↔grotesk axis. Weight axis only: the `wdth` axis was
 * requested on the theory that Spanish's extra length might want a condensed
 * cut, but nothing in `src` ever set `font-stretch` or `wdth`, and the axis
 * doubled the file (57 KB → 30 KB without it) on every page, preloaded, on the
 * same connection as the hero photograph. Re-add it the day something uses it.
 */
export const fontBody = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

/** Applied to <html> by both root layouts. */
export const fontVariables = `${fontHeading.variable} ${fontBody.variable}`;
