'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { submitAppointmentForm } from '@/app/actions';
import type { AppointmentFormData } from '@/lib/types';
import { Loader2, CalendarCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages } from '@/lib/data';

export function AppointmentForm({ serviceOptions }: { serviceOptions: string[]}) {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const currentFormStrings = formTranslations.appointmentForm[lang];
  const currentActionMessages = actionMessages[lang];

  const clientSchema = z.object({
    name: z.string().min(2, { message: currentActionMessages.zod.nameMin }),
    email: z.string().email({ message: currentActionMessages.zod.emailInvalid }),
    phone: z.string().optional().refine(value => !value || /^[0-9+\s()-]*$/.test(value), {
      message: currentActionMessages.zod.phoneInvalid
    }),
    serviceType: z.string().min(1, { message: currentActionMessages.zod.serviceTypeRequired }),
    reason: z.string().min(10, { message: currentActionMessages.zod.reasonMin }).max(500, { message: currentActionMessages.zod.reasonMax }),
    isUrgent: z.boolean().default(false),
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      serviceType: '',
      reason: '',
      isUrgent: false,
    },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(data: AppointmentFormData) {
    try {
      const result = await submitAppointmentForm(data, lang);
      if (result.success) {
        toast({
          title: currentFormStrings.successToastTitle,
          description: result.message,
          // className: 'bg-green-100 border-green-500 text-green-700', // Keep styling consistent with theme
        });
        form.reset();
      } else {
        toast({
          title: currentFormStrings.errorToastTitle,
          description: result.message || currentActionMessages.appointmentError,
          variant: 'destructive',
        });
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof AppointmentFormData, { type: 'manual', message: messages.join(', ') });
            }
          });
        }
      }
    } catch {
      toast({
        title: currentFormStrings.unexpectedErrorToastTitle,
        description: currentActionMessages.appointmentError,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentFormStrings.nameLabel}</FormLabel>
              <FormControl>
                <Input placeholder={currentFormStrings.namePlaceholder} {...field} className="bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{currentFormStrings.emailLabel}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={currentFormStrings.emailPlaceholder} {...field} className="bg-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{currentFormStrings.phoneLabel}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder={currentFormStrings.phonePlaceholder} {...field} className="bg-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentFormStrings.serviceTypeLabel}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder={currentFormStrings.serviceTypePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{currentFormStrings.reasonLabel}</FormLabel>
              <FormControl>
                <Textarea placeholder={currentFormStrings.reasonPlaceholder} {...field} className="min-h-[100px] bg-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isUrgent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-input">
              <div className="space-y-0.5">
                <FormLabel>{currentFormStrings.urgencyLabel}</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-6 shadow-md hover:shadow-lg transition-shadow" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CalendarCheck className="mr-2 h-5 w-5" />}
          {isSubmitting ? currentFormStrings.submittingButtonText : currentFormStrings.submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
