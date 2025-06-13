'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">Gérez les paramètres de votre application</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Configuration en cours de développement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            La page de configuration sera disponible prochainement. 
            En attendant, vous pouvez modifier les paramètres directement dans le fichier de données.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}