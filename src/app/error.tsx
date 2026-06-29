'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

const STRINGS = {
  es: {
    title: 'Algo salió mal',
    body: 'Ocurrió un error al cargar esta página. Por favor, inténtalo de nuevo.',
    retry: 'Reintentar',
  },
  en: {
    title: 'Something went wrong',
    body: 'An error occurred while loading this page. Please try again.',
    retry: 'Try again',
  },
} as const

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  const lang =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/en') ? 'en' : 'es'
  const t = STRINGS[lang]

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-semibold text-destructive">{t.title}</h2>
      <p className="mt-2 mb-6 max-w-md text-muted-foreground">{t.body}</p>
      <Button onClick={() => reset()} variant="default">
        {t.retry}
      </Button>
    </div>
  )
}
