'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
          <h1 className="text-3xl font-bold text-destructive">Erreur inattendue</h1>
          <p className="mt-4 mb-8 max-w-md text-muted-foreground">
            Une erreur inattendue s'est produite. Nous nous excusons pour ce désagrément.
          </p>
          <Button
            onClick={() => reset()}
            variant="default"
            size="lg"
          >
            Réessayer
          </Button>
        </div>
      </body>
    </html>
  )
} 