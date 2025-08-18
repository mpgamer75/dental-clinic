import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  try {
    // Utiliser le client admin pour avoir accès aux données
    const adminClient = await createAdminClient();
    
    // Charger les statistiques
    const [
      appointmentsResult,
      messagesResult,
      testimonialsResult
    ] = await Promise.allSettled([
      adminClient.from('appointments').select('*'),
      adminClient.from('contact_messages').select('*'),
      adminClient.from('testimonials').select('*')
    ]);

    const appointments = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.data || [] : [];
    const messages = messagesResult.status === 'fulfilled' ? messagesResult.value.data || [] : [];
    const testimonials = testimonialsResult.status === 'fulfilled' ? testimonialsResult.value.data || [] : [];

    // Calculer les statistiques
    const stats = {
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
      totalMessages: messages.length,
      unreadMessages: messages.filter(m => m.status === 'unread').length,
      totalTestimonials: testimonials.length,
      pendingTestimonials: testimonials.filter(t => t.status === 'pending_approval').length,
      approvedTestimonials: testimonials.filter(t => t.status === 'approved').length,
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">Vue d'ensemble de votre clinique</p>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rendez-vous Total</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingAppointments} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                {stats.unreadMessages} non lus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Témoignages</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTestimonials}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingTestimonials} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAppointments > 0 
                  ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Rendez-vous complétés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rendez-vous récents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rendez-vous récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">{appointment.name}</p>
                      <p className="text-xs text-muted-foreground">{appointment.service_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {appointment.is_urgent && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      appointment.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages récents */}
        <Card>
          <CardHeader>
            <CardTitle>Messages récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.slice(0, 5).map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{message.name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      message.status === 'unread' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {message.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error in dashboard:', error);
    redirect('/admin/login');
  }
}