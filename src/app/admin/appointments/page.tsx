import { supabase } from '@/lib/supabase';
import { generalUiStrings } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AppointmentSupabase } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Admin panel will be primarily in Spanish as requested
const lang = 'es';
const adminStrings = generalUiStrings[lang];

// Function to format date nicely
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function getStatusVariant(status: AppointmentSupabase['status']): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'pending':
      return 'outline';
    case 'confirmed':
      return 'default'; // primary color
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}


export default async function AdminAppointmentsPage() {
  // Here you would typically implement logic to check if the user is authenticated
  // and has admin privileges before fetching data.
  // We'll assume this check is in place or will be added in AdminLayout or middleware.

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching appointments:', error);
    // Handle error display appropriately in a real app
    return <p>Error al cargar las citas: {error.message}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{adminStrings.appointmentsTitle}</CardTitle>
        <CardDescription>
          Visualiza y gestiona todas las solicitudes de citas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments && appointments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{adminStrings.appointmentTableHeaders.name}</TableHead>
                <TableHead className="hidden md:table-cell">{adminStrings.appointmentTableHeaders.email}</TableHead>
                <TableHead className="hidden lg:table-cell">{adminStrings.appointmentTableHeaders.phone}</TableHead>
                <TableHead>{adminStrings.appointmentTableHeaders.service}</TableHead>
                <TableHead className="hidden md:table-cell">{adminStrings.appointmentTableHeaders.urgent}</TableHead>
                <TableHead className="hidden lg:table-cell">{adminStrings.appointmentTableHeaders.submitted}</TableHead>
                <TableHead>{adminStrings.appointmentTableHeaders.status}</TableHead>
                <TableHead><span className="sr-only">{adminStrings.appointmentTableHeaders.actions}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{appointment.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{appointment.phone || '-'}</TableCell>
                  <TableCell>{appointment.service_type}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={appointment.is_urgent ? 'destructive' : 'outline'}>
                      {appointment.is_urgent ? adminStrings.boolean.true : adminStrings.boolean.false}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(appointment.submitted_at)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(appointment.status)}>
                      {adminStrings.statusLabels[appointment.status as keyof typeof adminStrings.statusLabels] || appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>{adminStrings.actionButtons.view}</DropdownMenuItem>
                        <DropdownMenuItem disabled={appointment.status === 'confirmed'}>{adminStrings.actionButtons.confirm}</DropdownMenuItem>
                        <DropdownMenuItem disabled={appointment.status === 'completed'}>{adminStrings.actionButtons.complete}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">{adminStrings.actionButtons.cancel}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>{adminStrings.noAppointments}</p>
        )}
      </CardContent>
    </Card>
  );
}

    