'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin] Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-semibold text-destructive">Se ha producido un error en el panel de administración</h2>
      <p className="mt-2 mb-6 text-muted-foreground">
        Ha ocurrido un problema al cargar esta sección del panel de administración. Por favor, intente de nuevo.
      </p>
      <Button
        onClick={() => reset()}
        variant="default"
      >
        Reintentar
      </Button>
    </div>
  )
} 