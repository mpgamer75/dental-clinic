'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-semibold text-destructive">Un problème est survenu</h2>
      <p className="mt-2 mb-6 text-muted-foreground">
        Une erreur s'est produite lors du chargement de cette page. Veuillez réessayer.
      </p>
      <Button
        onClick={() => reset()}
        variant="default"
      >
        Réessayer
      </Button>
    </div>
  )
} 