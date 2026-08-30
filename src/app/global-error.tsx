'use client'

import { useEffect } from 'react'

/* ============================================================================
   THE ONE FILE THAT CANNOT USE THE DESIGN TOKENS
   ----------------------------------------------------------------------------
   `global-error.tsx` REPLACES the root layout when it renders — that is the
   whole point of it, since the thing that failed may well be the layout. So it
   renders its own <html> and <body>, `globals.css` is never loaded, and no
   custom property, Tailwind class or font variable resolves. Every colour here
   has to be an inline literal.

   That makes it the one surface a recolour cannot reach automatically, and the
   one that will silently keep the old brand. These are the current palette,
   converted from the OKLCH tokens in globals.css:

       #004D91  --primary-base   0.42  0.13  253
       #F3F6FA  --canvas         0.972 0.006 250
       #E8EDF2  --canvas-sunk    0.943 0.009 250
       #111B28  --ink            0.22  0.03  255
       #485463  --ink-soft       0.442 0.028 253
       #717B87  --ink-faint      0.578 0.022 253
       #B9C1C9  --line-strong    0.806 0.014 250

   If the palette moves again, re-run:
       node scripts/contrast.mjs
   and convert the tokens above by hand. There is no way to make this automatic
   without shipping a second stylesheet for a page that exists precisely because
   the first one may be unavailable.
   ========================================================================== */

const STRINGS = {
  es: {
    title: 'Error inesperado',
    body: 'Ocurrió un error inesperado. Lamentamos las molestias.',
    retry: 'Reintentar',
    home: 'Volver al inicio',
    ref: 'Referencia del error',
  },
  en: {
    title: 'Unexpected error',
    body: 'An unexpected error occurred. We apologize for the inconvenience.',
    retry: 'Try again',
    home: 'Back to home',
    ref: 'Error reference',
  },
} as const

/**
 * Root-level error boundary.
 *
 * This component REPLACES the root layout when it renders, so `globals.css` is
 * never loaded and no Tailwind class, CSS variable or web font is available.
 * The previous version was written entirely in Tailwind utilities, which meant
 * the one page a visitor sees when the site has already failed rendered as
 * unstyled black-on-white text.
 *
 * Everything below is therefore inline, self-contained, and uses only system
 * fonts and literal colours. Do not "tidy" this into Tailwind classes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global application error:', error)
  }, [error])

  const lang =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/en') ? 'en' : 'es'
  const t = STRINGS[lang]

  const button: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '3rem',
    padding: '0 1.75rem',
    borderRadius: '0.5rem',
    border: '1px solid transparent',
    background: '#004D91',
    color: '#F3F6FA',
    font: 'inherit',
    fontWeight: 500,
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'none',
  }

  return (
    <html lang={lang}>
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.25rem',
            textAlign: 'center',
            background: '#E8EDF2',
            color: '#111B28',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            lineHeight: 1.6,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {t.title}
          </h1>

          <p style={{ margin: '1rem 0 2rem', maxWidth: '38ch', color: '#485463' }}>{t.body}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" onClick={() => reset()} style={button}>
              {t.retry}
            </button>
            <a
              href={`/${lang}`}
              style={{
                ...button,
                background: 'transparent',
                color: '#111B28',
                borderColor: '#B9C1C9',
              }}
            >
              {t.home}
            </a>
          </div>

          {/* The digest is what Vercel's logs key on; showing it lets a patient
              quote something actionable when they phone the clinic. */}
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.8125rem', color: '#717B87' }}>
              {t.ref}: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
