import Link from 'next/link'
import { headers } from 'next/headers'
import { Button } from '@/components/ui/button'

const STRINGS = {
  es: {
    title: 'Página no encontrada',
    body: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
    home: 'Volver al inicio',
  },
  en: {
    title: 'Page not found',
    body: "Sorry, the page you're looking for doesn't exist or has been moved.",
    home: 'Back to home',
  },
} as const

export default async function NotFound() {
  const requestHeaders = await headers()
  const lang = requestHeaders.get('x-lang') === 'en' ? 'en' : 'es'
  const t = STRINGS[lang]

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-primary">404</h1>
      <h2 className="mt-2 text-2xl font-semibold">{t.title}</h2>
      <p className="mt-4 mb-8 max-w-md text-muted-foreground">{t.body}</p>
      <Button asChild>
        <Link href={`/${lang}`}>{t.home}</Link>
      </Button>
    </div>
  )
}
