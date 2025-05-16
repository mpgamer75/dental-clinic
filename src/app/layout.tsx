import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Updated to correct filename
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Métadonnées de base, les métadonnées spécifiques à la langue seront dans [lang]/layout.tsx
export const metadata: Metadata = {
  title: 'Orthoprotesis Dental Clinic', // Titre par défaut
  description: 'Clínica dental especializada Orthoprotesis. Specialized dental clinic Orthoprotesis.', // Description par défaut
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans flex flex-col min-h-screen bg-background text-foreground">
        {children}
        <Toaster /> {/* Toaster global */}
      </body>
    </html>
  );
}