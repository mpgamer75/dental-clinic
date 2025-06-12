'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface AppSettings {
  id: string;
  clinic_name_es: string;
  clinic_name_en: string;
  doctor_name_es: string;
  doctor_name_en: string;
  address_es: string;
  address_en: string;
  phone_es: string;
  phone_en: string;
  email: string;
  schedule_es: string;
  schedule_en: string;
  map_link_es: string;
  map_link_en: string;
  embed_map_link_es: string;
  embed_map_link_en: string;
  maintenance_mode: boolean;
  allow_appointments: boolean;
  allow_testimonials: boolean;
  allow_contact_form: boolean;
  updated_at: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres",
          variant: "destructive",
        });
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: "Paramètres sauvegardés avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Erreur</h2>
          <p className="text-muted-foreground">Impossible de charger les paramètres</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuration</h1>
          <p className="text-muted-foreground">Gérez les paramètres de votre application</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de la clinique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name_es">Nom de la clinique (Espagnol)</Label>
                  <Input
                    id="clinic_name_es"
                    value={settings.clinic_name_es}
                    onChange={(e) => handleInputChange('clinic_name_es', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinic_name_en">Nom de la clinique (Anglais)</Label>
                  <Input
                    id="clinic_name_en"
                    value={settings.clinic_name_en}
                    onChange={(e) => handleInputChange('clinic_name_en', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor_name_es">Nom du docteur (Espagnol)</Label>
                  <Input
                    id="doctor_name_es"
                    value={settings.doctor_name_es}
                    onChange={(e) => handleInputChange('doctor_name_es', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor_name_en">Nom du docteur (Anglais)</Label>
                  <Input
                    id="doctor_name_en"
                    value={settings.doctor_name_en}
                    onChange={(e) => handleInputChange('doctor_name_en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresse et localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_es">Adresse (Espagnol)</Label>
                  <Textarea
                    id="address_es"
                    value={settings.address_es}
                    onChange={(e) => handleInputChange('address_es', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_en">Adresse (Anglais)</Label>
                  <Textarea
                    id="address_en"
                    value={settings.address_en}
                    onChange={(e) => handleInputChange('address_en', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_es">Téléphone (Espagnol)</Label>
                  <Input
                    id="phone_es"
                    value={settings.phone_es}
                    onChange={(e) => handleInputChange('phone_es', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_en">Téléphone (Anglais)</Label>
                  <Input
                    id="phone_en"
                    value={settings.phone_en}
                    onChange={(e) => handleInputChange('phone_en', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule_es">Horaires (Espagnol)</Label>
                  <Textarea
                    id="schedule_es"
                    value={settings.schedule_es}
                    onChange={(e) => handleInputChange('schedule_es', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule_en">Horaires (Anglais)</Label>
                  <Textarea
                    id="schedule_en"
                    value={settings.schedule_en}
                    onChange={(e) => handleInputChange('schedule_en', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="map_link_es">Lien Google Maps (Espagnol)</Label>
                  <Input
                    id="map_link_es"
                    value={settings.map_link_es}
                    onChange={(e) => handleInputChange('map_link_es', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map_link_en">Lien Google Maps (Anglais)</Label>
                  <Input
                    id="map_link_en"
                    value={settings.map_link_en}
                    onChange={(e) => handleInputChange('map_link_en', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="embed_map_link_es">Lien carte intégrée (Espagnol)</Label>
                  <Input
                    id="embed_map_link_es"
                    value={settings.embed_map_link_es}
                    onChange={(e) => handleInputChange('embed_map_link_es', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="embed_map_link_en">Lien carte intégrée (Anglais)</Label>
                  <Input
                    id="embed_map_link_en"
                    value={settings.embed_map_link_en}
                    onChange={(e) => handleInputChange('embed_map_link_en', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Fonctionnalités
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_appointments">Prise de rendez-vous</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux visiteurs de prendre des rendez-vous
                  </p>
                </div>
                <Switch
                  id="allow_appointments"
                  checked={settings.allow_appointments}
                  onCheckedChange={(checked) => handleInputChange('allow_appointments', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_testimonials">Témoignages</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux visiteurs de laisser des témoignages
                  </p>
                </div>
                <Switch
                  id="allow_testimonials"
                  checked={settings.allow_testimonials}
                  onCheckedChange={(checked) => handleInputChange('allow_testimonials', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_contact_form">Formulaire de contact</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre aux visiteurs d'envoyer des messages
                  </p>
                </div>
                <Switch
                  id="allow_contact_form"
                  checked={settings.allow_contact_form}
                  onCheckedChange={(checked) => handleInputChange('allow_contact_form', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Paramètres avancés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance_mode">Mode maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Mettre le site en mode maintenance (réservé aux administrateurs)
                  </p>
                </div>
                <Switch
                  id="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Dernière mise à jour</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(settings.updated_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  );
}
