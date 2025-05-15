import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Cog } from "lucide-react";

export default function AdminSettingsPage() {
  // Admin panel est principalement en espagnol comme demandé
  // (variable lang supprimée car non utilisée)

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Cog className="h-6 w-6 text-primary" />
            <CardTitle>Configuración General</CardTitle>
          </div>
          <CardDescription>
            Ajustes generales del panel de administración. (Funcionalidad en desarrollo)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="adminEmail">Correo Electrónico del Administrador Principal</Label>
                <Input id="adminEmail" type="email" placeholder="admin@example.com" disabled />
            </div>
             <div className="space-y-2">
                <Label htmlFor="clinicName">Nombre de la Clínica (para visualización interna)</Label>
                <Input id="clinicName" type="text" placeholder="Orthoprotesis Dental Clinic" disabled />
            </div>
            <Button disabled>Guardar Cambios (deshabilitado)</Button>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Preferencias de Notificación</CardTitle>
           <CardDescription>
            Cómo desea recibir notificaciones sobre nuevas citas o mensajes. (Funcionalidad en desarrollo)
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Próximamente: Opciones para notificaciones por correo electrónico o dentro del panel.</p>
        </CardContent>
      </Card>
    </div>
  );
}
