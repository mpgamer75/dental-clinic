'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'

export default function LangError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { lang } = useLanguage()
  
  const errorMessage = {
    es: {
      title: 'Ha ocurrido un problema',
      description: 'Se produjo un error al cargar esta página. Por favor, inténtelo de nuevo.',
      retry: 'Reintentar'
    },
    en: {
      title: 'Something went wrong',
      description: 'An error occurred while loading this page. Please try again.',
      retry: 'Try again'
    }
  }

  useEffect(() => {
    console.error(`[${lang}] Route error:`, error)
  }, [error, lang])

  const content = errorMessage[lang]

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-semibold text-destructive">{content.title}</h2>
      <p className="mt-2 mb-6 text-muted-foreground">
        {content.description}
      </p>
      <Button
        onClick={() => reset()}
        variant="default"
      >
        {content.retry}
      </Button>
    </div>
  )
} 