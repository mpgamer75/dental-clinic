import { supabase } from '@/lib/supabase';
import { generalUiStrings } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { revalidatePath } from 'next/cache';

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

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'pending_approval':
      return 'outline';
    case 'approved':
      return 'default'; // primary color
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

// Actions pour la mise à jour du statut des témoignages
async function approveTestimonial(testimonialId: string) {
  'use server';
  try {
    const { error } = await supabase
      .from('testimonials')
      .update({ status: 'approved' })
      .eq('id', testimonialId);
      
    if (error) throw error;
    
    revalidatePath('/admin/testimonials');
  } catch (err) {
    console.error('Error approving testimonial:', err);
    throw new Error('No se pudo aprobar el testimonio');
  }
}

async function rejectTestimonial(testimonialId: string) {
  'use server';
  try {
    const { error } = await supabase
      .from('testimonials')
      .update({ status: 'rejected' })
      .eq('id', testimonialId);
      
    if (error) throw error;
    
    revalidatePath('/admin/testimonials');
  } catch (err) {
    console.error('Error rejecting testimonial:', err);
    throw new Error('No se pudo rechazar el testimonio');
  }
}

export default async function AdminTestimonialsPage() {
  // Fetch testimonials from Supabase
  const { data: testimonials, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching testimonials:', error);
    return <p>Error al cargar los testimonios: {error.message}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{adminStrings.testimonialsTitle}</CardTitle>
        <CardDescription>
          Modera y gestiona los testimonios de los pacientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {testimonials && testimonials.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{adminStrings.appointmentTableHeaders.name}</TableHead>
                <TableHead>Testimonio</TableHead>
                <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                <TableHead className="hidden lg:table-cell">{adminStrings.appointmentTableHeaders.submitted}</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell className="font-medium">{testimonial.name}</TableCell>
                  <TableCell className="max-w-xs truncate" title={testimonial.quote}>
                    {testimonial.quote.length > 50 ? testimonial.quote.substring(0, 50) + '...' : testimonial.quote}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{testimonial.location || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(testimonial.submitted_at)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(testimonial.status)}>
                      {adminStrings.statusLabels[testimonial.status as keyof typeof adminStrings.statusLabels] || testimonial.status}
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
                        <form action={approveTestimonial.bind(null, testimonial.id)}>
                          <DropdownMenuItem 
                            disabled={testimonial.status === 'approved'}
                            asChild
                          >
                            <button className="w-full text-left px-2 py-1.5">
                              {adminStrings.actionButtons.approve}
                            </button>
                          </DropdownMenuItem>
                        </form>
                        <DropdownMenuSeparator />
                        <form action={rejectTestimonial.bind(null, testimonial.id)}>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={testimonial.status === 'rejected'}
                            asChild
                          >
                            <button className="w-full text-left px-2 py-1.5">
                              {adminStrings.actionButtons.reject}
                            </button>
                          </DropdownMenuItem>
                        </form>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>No hay testimonios para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}

    