
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
// import { ToothIcon } from '@/components/icons/tooth-icon'; // Assuming this icon is available or use another
import { generalUiStrings, contactDetails } from '@/lib/data';

// Admin panel is in Spanish
const lang = 'es';
const uiStrings = generalUiStrings[lang];
const clinicName = contactDetails.clinicName[lang];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "Credenciales de inicio de sesión inválidas." : signInError.message);
      setIsLoading(false);
      return;
    }

    // Fetch user data to check for admin role after successful sign-in
    // The layout will handle the actual role check and redirect if not an admin
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // Check if the user has the admin_role in their metadata
        // This check is primarily for immediate feedback; the AdminLayout will enforce this more strictly.
        if (user.user_metadata?.role === 'admin_role') {
            router.push('/admin'); // Redirect to admin dashboard
        } else {
            // Log out the user if they are not an admin
            await supabase.auth.signOut();
            setError('Acceso denegado. No tiene permisos de administrador.');
        }
    } else {
        // Should not happen if signInWithPassword was successful, but as a fallback
        setError('No se pudo verificar el usuario después del inicio de sesión.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground p-8">
          {/* <ToothIcon className="h-12 w-12 mx-auto mb-4" /> */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 mx-auto mb-4 text-primary-foreground"
          >
            <path d="M6.2998 5.21973C5.16341 6.6043 4.50024 8.27246 4.50024 10.0098C4.50024 11.7471 5.16341 13.4153 6.2998 14.7998" />
            <path d="M17.7002 5.21973C18.8366 6.6043 19.5 8.27246 19.5 10.0098C19.5 11.7471 18.8366 13.4153 17.7002 14.7998" />
            <path d="M6.2998 14.7998C7.16317 15.7798 8.24619 16.5698 9.4698 17.1098" />
            <path d="M17.7002 14.7998C16.8368 15.7798 15.7538 16.5698 14.5302 17.1098" />
            <path d="M9.46973 17.1099C10.1815 17.4487 10.9675 17.63 11.78 17.63H12.22C13.0325 17.63 13.8185 17.4487 14.5303 17.1099" />
            <path d="M12 21.5098V17.6398" />
            <path d="M12 17.63C12 17.63 12 17.63 11.78 17.63H12.22C12 17.63 12 17.63 12 17.63Z" fill="currentColor" />
            <path d="M9.4698 2.50977V6.00977" />
            <path d="M14.5302 2.50977V6.00977" />
            <path d="M6.2998 5.21973C7.16317 4.23973 8.24619 3.44973 9.4698 2.90973" />
            <path d="M17.7002 5.21973C16.8368 4.23973 15.7538 3.44973 14.5302 2.90973" />
            <path d="M9.46973 2.90991C10.1815 2.57116 10.9675 2.38989 11.78 2.38989H12.22C13.0325 2.38989 13.8185 2.57116 14.5303 2.90991" />
          </svg>
          <CardTitle className="text-3xl font-bold">{uiStrings.adminPanelTitle}</CardTitle>
          <CardDescription className="text-primary-foreground/90">{clinicName} - Acceso Administrativo</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground p-6 pt-0">
            <p>&copy; {new Date().getFullYear()} {clinicName}. Reservados todos los derechos.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
