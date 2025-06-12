'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { PieChart, BarChart, StatCard } from '@/components/ui/chart';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalMessages: number;
  unreadMessages: number;
  totalTestimonials: number;
  pendingTestimonials: number;
  approvedTestimonials: number;
  rejectedTestimonials: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Charger les statistiques des rendez-vous
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*');

      if (appointmentsError) throw appointmentsError;

      // Charger les statistiques des messages
      const { data: messages, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*');

      if (messagesError) throw messagesError;

      // Charger les statistiques des témoignages
      const { data: testimonials, error: testimonialsError } = await supabase
        .from('testimonials')
        .select('*');

      if (testimonialsError) throw testimonialsError;

      // Calculer les statistiques
      const totalAppointments = appointments?.length || 0;
      const pendingAppointments = appointments?.filter(a => a.status === 'pending').length || 0;
      const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
      const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0;

      const totalMessages = messages?.length || 0;
      const unreadMessages = messages?.filter(m => m.status === 'unread').length || 0;

      const totalTestimonials = testimonials?.length || 0;
      const pendingTestimonials = testimonials?.filter(t => t.status === 'pending_approval').length || 0;
      const approvedTestimonials = testimonials?.filter(t => t.status === 'approved').length || 0;
      const rejectedTestimonials = testimonials?.filter(t => t.status === 'rejected').length || 0;

      setStats({
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalMessages,
        unreadMessages,
        totalTestimonials,
        pendingTestimonials,
        approvedTestimonials,
        rejectedTestimonials,
      });

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Erreur</h2>
          <p className="text-muted-foreground">Impossible de charger les statistiques</p>
        </div>
      </div>
    );
  }

  // Données pour les graphiques
  const appointmentData = [
    { label: 'En attente', value: stats.pendingAppointments, color: '#f59e0b' },
    { label: 'Complétés', value: stats.completedAppointments, color: '#10b981' },
    { label: 'Annulés', value: stats.cancelledAppointments, color: '#ef4444' },
  ];

  const testimonialData = [
    { label: 'En attente', value: stats.pendingTestimonials, color: '#f59e0b' },
    { label: 'Approuvés', value: stats.approvedTestimonials, color: '#10b981' },
    { label: 'Rejetés', value: stats.rejectedTestimonials, color: '#ef4444' },
  ];

  const monthlyData = [
    { label: 'Jan', value: 12 },
    { label: 'Fév', value: 19 },
    { label: 'Mar', value: 15 },
    { label: 'Avr', value: 22 },
    { label: 'Mai', value: 18 },
    { label: 'Jun', value: 25 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre clinique</p>
        </div>
        <Button onClick={loadDashboardStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Rendez-vous"
          value={stats.totalAppointments}
          description={`${stats.pendingAppointments} en attente`}
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Messages"
          value={stats.totalMessages}
          description={`${stats.unreadMessages} non lus`}
          icon={<MessageSquare className="h-4 w-4" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Témoignages"
          value={stats.totalTestimonials}
          description={`${stats.pendingTestimonials} en attente`}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Taux de conversion"
          value="68%"
          description="Rendez-vous confirmés"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
          <TabsTrigger value="testimonials">Témoignages</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChart
              data={appointmentData}
              title="Statut des rendez-vous"
              total={stats.totalAppointments}
            />
            <PieChart
              data={testimonialData}
              title="Statut des témoignages"
              total={stats.totalTestimonials}
            />
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Rendez-vous récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointmentData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <BarChart
              data={monthlyData}
              title="Rendez-vous par mois"
              maxValue={30}
            />
          </div>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestion des témoignages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">En attente de modération</span>
                    </div>
                    <Badge variant="secondary">{stats.pendingTestimonials}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Approuvés</span>
                    </div>
                    <Badge variant="secondary">{stats.approvedTestimonials}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Rejetés</span>
                    </div>
                    <Badge variant="secondary">{stats.rejectedTestimonials}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <PieChart
              data={testimonialData}
              title="Répartition des témoignages"
              total={stats.totalTestimonials}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={monthlyData}
              title="Évolution mensuelle"
              maxValue={30}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Métriques clés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taux de réponse</span>
                  <span className="text-sm text-muted-foreground">94%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '94%' }} />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Satisfaction client</span>
                  <span className="text-sm text-muted-foreground">4.8/5</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }} />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Temps de réponse moyen</span>
                  <span className="text-sm text-muted-foreground">2.3h</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 