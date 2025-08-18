'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { generalUiStrings, contactDetails } from '@/lib/data';
import type { Database } from '@/lib/types_db';

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
  
  const supabase = createClientComponentClient<Database>();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Tentative de connexion pour:', email);
      
      // Étape 1: Authentification
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Erreur de connexion:', signInError);
        setError(
          signInError.message === "Invalid login credentials" 
            ? "Credenciales de inicio de sesión inválidas." 
            : signInError.message
        );
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('No se pudo autenticar el usuario.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Connexion réussie, vérification admin pour:', data.user.id);

      // Étape 2: Vérifier si l'utilisateur est admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      console.log('📋 Résultat vérification admin:', { adminData, adminError });

      if (adminError || !adminData) {
        console.error('❌ Utilisateur non admin');
        await supabase.auth.signOut();
        setError('Acceso denegado. No tiene permisos de administrador.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Utilisateur admin confirmé, redirection...');
      
      // Forcer le rafraîchissement de la page pour mettre à jour les cookies
      router.push('/admin/dashboard');
      router.refresh();
      
    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      setError('Error inesperado. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground p-8">
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
            <path d="M12 21.5098V17.6398" />
            <path d="M12 17.63C12 17.63 12 17.63 11.78 17.63H12.22C12 17.63 12 17.63 12 17.63Z" fill="currentColor" />
            <path d="M9.4698 2.50977V6.00977" />
            <path d="M14.5302 2.50977V6.00977" />
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
                disabled={isLoading}
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
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}
            <Button 
              type="submit" 
              className="w-full text-lg py-3" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground p-6 pt-0">
          <p>&copy; {new Date().getFullYear()} {clinicName}. Todos los derechos reservados.</p>
        </CardFooter>
      </Card>
    </div>
  );
}