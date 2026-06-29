'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

const STRINGS = {
  es: {
    title: 'Error inesperado',
    body: 'Ocurrió un error inesperado. Lamentamos las molestias.',
    retry: 'Reintentar',
  },
  en: {
    title: 'Unexpected error',
    body: 'An unexpected error occurred. We apologize for the inconvenience.',
    retry: 'Try again',
  },
} as const

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

  return (
    <html lang={lang}>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
          <h1 className="text-3xl font-bold text-destructive">{t.title}</h1>
          <p className="mt-4 mb-8 max-w-md text-muted-foreground">{t.body}</p>
          <Button onClick={() => reset()} variant="default" size="lg">
            {t.retry}
          </Button>
        </div>
      </body>
    </html>
  )
}
