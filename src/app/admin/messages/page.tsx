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
    case 'unread':
      return 'destructive';
    case 'read':
      return 'default'; // primary color
    case 'archived':
      return 'secondary';
    default:
      return 'outline';
  }
}

// Actions pour la mise à jour du statut des messages
async function markAsRead(messageId: string) {
  'use server';
  try {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', messageId);
      
    if (error) throw error;
    
    revalidatePath('/admin/messages');
  } catch (err) {
    console.error('Error marking message as read:', err);
    throw new Error('No se pudo marcar el mensaje como leído');
  }
}

async function archiveMessage(messageId: string) {
  'use server';
  try {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'archived' })
      .eq('id', messageId);
      
    if (error) throw error;
    
    revalidatePath('/admin/messages');
  } catch (err) {
    console.error('Error archiving message:', err);
    throw new Error('No se pudo archivar el mensaje');
  }
}

export default async function AdminMessagesPage() {
  // Fetch contact messages from Supabase
  const { data: messages, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    return <p>Error al cargar los mensajes: {error.message}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{adminStrings.messagesTitle}</CardTitle>
        <CardDescription>
          Visualiza y responde a los mensajes de contacto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages && messages.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{adminStrings.appointmentTableHeaders.name}</TableHead>
                <TableHead className="hidden md:table-cell">{adminStrings.appointmentTableHeaders.email}</TableHead>
                <TableHead className="hidden lg:table-cell">{adminStrings.appointmentTableHeaders.phone}</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead className="hidden lg:table-cell">{adminStrings.appointmentTableHeaders.submitted}</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">{message.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{message.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{message.phone || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={message.message}>
                    {message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(message.submitted_at)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(message.status)}>
                      {adminStrings.statusLabels[message.status as keyof typeof adminStrings.statusLabels] || message.status}
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
                        <form action={markAsRead.bind(null, message.id)}>
                          <DropdownMenuItem 
                            disabled={message.status === 'read' || message.status === 'archived'}
                            asChild
                          >
                            <button className="w-full text-left px-2 py-1.5">
                              {adminStrings.actionButtons.markRead}
                            </button>
                          </DropdownMenuItem>
                        </form>
                        <DropdownMenuSeparator />
                        <form action={archiveMessage.bind(null, message.id)}>
                          <DropdownMenuItem 
                            disabled={message.status === 'archived'}
                            asChild
                          >
                            <button className="w-full text-left px-2 py-1.5">
                              {adminStrings.actionButtons.archive}
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
          <p>No hay mensajes de contacto para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}

    