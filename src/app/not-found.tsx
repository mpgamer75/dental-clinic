import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="mt-2 text-2xl font-semibold">Page non trouvée</h2>
      <p className="mt-4 mb-8 max-w-md text-muted-foreground">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Button asChild>
        <Link href="/">
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  )
} 