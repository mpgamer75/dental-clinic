'use client'

import { useEffect } from 'react'

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
    background: '#9C4A2F',
    color: '#FDFBF9',
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
            background: '#F1ECE8',
            color: '#241C17',
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

          <p style={{ margin: '1rem 0 2rem', maxWidth: '38ch', color: '#5D514B' }}>{t.body}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" onClick={() => reset()} style={button}>
              {t.retry}
            </button>
            <a
              href={`/${lang}`}
              style={{
                ...button,
                background: 'transparent',
                color: '#241C17',
                borderColor: '#C8BEB6',
              }}
            >
              {t.home}
            </a>
          </div>

          {/* The digest is what Vercel's logs key on; showing it lets a patient
              quote something actionable when they phone the clinic. */}
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.8125rem', color: '#837A74' }}>
              {t.ref}: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
