'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Phone, User, Clock, Eye, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  submitted_at: string;
  status: 'unread' | 'read' | 'archived';
}

interface Props {
  messages: Message[];
}

export function MessagesTable({ messages: initialMessages }: Props) {
  const [messages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getStatusBadge = (status: Message['status']) => {
    const colors = {
      unread: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      read: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      archived: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    };

    const labels = {
      unread: 'No leído',
      read: 'Leído',
      archived: 'Archivado',
    };

    return (
      <Badge className={colors[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    read: messages.filter(m => m.status === 'read').length,
    archived: messages.filter(m => m.status === 'archived').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: MessageCircle, color: 'text-blue-500' },
          { label: 'No leídos', value: stats.unread, icon: Mail, color: 'text-red-500' },
          { label: 'Leídos', value: stats.read, icon: Eye, color: 'text-green-500' },
          { label: 'Archivados', value: stats.archived, icon: Archive, color: 'text-gray-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-10 w-10 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Messages List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Últimos Mensajes ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                No hay mensajes
              </motion.p>
            ) : (
              <div className="space-y-3">
                {messages.slice(0, 10).map((message, index) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer ${
                      selectedId === message.id ? 'border-primary bg-primary/5' : 'border-border'
                    } ${message.status === 'unread' ? 'bg-blue-50/30 dark:bg-blue-950/10 font-medium' : ''}`}
                    onClick={() => setSelectedId(selectedId === message.id ? null : message.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{message.name}</span>
                          </div>
                          {getStatusBadge(message.status)}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {message.email}
                          </div>
                          {message.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {message.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(message.submitted_at), "d 'de' MMMM, yyyy", { locale: es })}
                          </div>
                        </div>

                        {selectedId === message.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-3 border-t mt-3"
                          >
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {message.message}
                            </p>
                          </motion.div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
