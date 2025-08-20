'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, User, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

    try {
      // Authentification
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials" 
            ? "Correo electrónico o contraseña incorrectos." 
            : "Error al iniciar sesión. Por favor, intente de nuevo."
        );
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('No se pudo autenticar el usuario.');
        setIsLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est admin
      console.log('🔍 Vérification admin pour:', data.user.id);
      
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      console.log('📋 Résultat vérification admin:', { adminData, adminError });

      if (adminError) {
        console.error('❌ Erreur lors de la vérification admin:', adminError);
        
        // Si la table n'existe pas, on considère que c'est un problème de configuration
        if (adminError.message.includes('relation "admin_users" does not exist')) {
          setError('Table admin_users non configurée. Contactez l\'administrateur système.');
        } else if (adminError.code === 'PGRST116') {
          setError('Aucun utilisateur admin configuré. Votre ID: ' + data.user.id);
        } else {
          setError('Erreur de base de données: ' + adminError.message);
        }
        
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      if (!adminData) {
        console.error('❌ Utilisateur non admin:', data.user.id);
        await supabase.auth.signOut();
        setError('Acceso denegado. No tiene permisos de administrador. ID: ' + data.user.id);
        setIsLoading(false);
        return;
      }

      // Redirection vers le dashboard avec message de succès
      console.log('✅ Connexion réussie, redirection vers /admin');
      router.push('/admin');
      router.refresh();
      
    } catch (error: any) {
      setError('Error inesperado. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      {/* Lien retour */}
      <div className="w-full max-w-md mb-6">
        <Link 
          href="/es" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al sitio web
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        <CardHeader className="relative space-y-1 pb-6 pt-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 backdrop-blur">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Acceso Administrativo
          </CardTitle>
          <CardDescription className="text-center">
            Ingrese sus credenciales para acceder al panel de administración
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11 bg-background/50 border-muted-foreground/20 focus:border-primary transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 bg-background/50 border-muted-foreground/20 focus:border-primary transition-colors"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        © 2025 Orthoprotesis Dental Clinic. Todos los derechos reservados.
      </p>
    </div>
  );
}