'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import type { Database } from '@/lib/types_db';

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
      
      // Authentification
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

      // Vérifier si l'utilisateur est admin
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
      
      // Redirection vers le dashboard
      router.push('/admin-dashboard');
      router.refresh();
      
    } catch (error: any) {
      console.error('❌ Erreur inattendue:', error);
      setError('Error inesperado. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 via-background to-secondary/30 p-4">
      {/* Lien retour */}
      <div className="w-full max-w-md mb-4">
        <Link href="/es" className="text-sm text-muted-foreground hover:text-primary">
          ← Volver al sitio web
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-bold">Panel Administrativo</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Orthoprotesis - Acceso Administrativo
          </CardDescription>
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
      </Card>
    </div>
  );
}
