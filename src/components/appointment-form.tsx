'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { submitAppointmentForm } from '@/app/actions';
import type { AppointmentFormData } from '@/lib/types';
import { Loader2, CalendarCheck, Mail, Phone, User, AlertCircle, FileText, Stethoscope } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { formTranslations, actionMessages } from '@/lib/data';
import { cn } from '@/lib/utils';

export function AppointmentForm({ serviceOptions }: { serviceOptions: string[]}) {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const currentFormStrings = formTranslations.appointmentForm[lang];
  const currentActionMessages = actionMessages[lang];

  // Schema avec téléphone OBLIGATOIRE
  const clientSchema = z.object({
    name: z.string().min(2, { message: currentActionMessages.zod.nameMin }),
    email: z.string().email({ message: currentActionMessages.zod.emailInvalid }),
    phone: z.string().min(8, { message: currentActionMessages.zod.phoneInvalid }).refine(
      value => /^[0-9+\s()-]*$/.test(value),
      { message: currentActionMessages.zod.phoneInvalid }
    ),
    serviceType: z.string().min(1, { message: currentActionMessages.zod.serviceTypeRequired }),
    reason: z.string().min(10, { message: currentActionMessages.zod.reasonMin }).max(500, { message: currentActionMessages.zod.reasonMax }),
    isUrgent: z.boolean().default(false),
  });

  type FormData = {
    name: string;
    email: string;
    phone: string;
    serviceType: string;
    reason: string;
    isUrgent: boolean;
  };

  const form = useForm<FormData>({
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

  const { formState: { isSubmitting }, watch } = form;
  const isUrgent = watch('isUrgent');

  async function onSubmit(data: FormData) {
    try {
      const appointmentData: AppointmentFormData = {
        ...data
      };
      
      const result = await submitAppointmentForm(appointmentData, lang);
      if (result.success) {
        toast({
          title: currentFormStrings.successToastTitle,
          description: result.message,
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
              form.setError(field as keyof FormData, { type: 'manual', message: messages.join(', ') });
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
        {/* Nom complet */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {currentFormStrings.nameLabel}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder={currentFormStrings.namePlaceholder} 
                    {...field} 
                    className="pl-4 h-12 bg-background border-2 border-muted-foreground/20 focus:border-primary transition-all text-base"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email & Téléphone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {currentFormStrings.emailLabel}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder={currentFormStrings.emailPlaceholder} 
                    {...field} 
                    className="h-12 bg-background border-2 border-muted-foreground/20 focus:border-primary transition-all text-base"
                  />
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
                <FormLabel className="text-base font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  {currentFormStrings.phoneLabel}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="tel" 
                    placeholder={currentFormStrings.phonePlaceholder} 
                    {...field} 
                    className="h-12 bg-background border-2 border-muted-foreground/20 focus:border-primary transition-all text-base"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Type de service */}
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                {currentFormStrings.serviceTypeLabel}
                <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 bg-background border-2 border-muted-foreground/20 focus:border-primary transition-all text-base">
                    <SelectValue placeholder={currentFormStrings.serviceTypePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-64">
                  {serviceOptions.map(option => (
                    <SelectItem key={option} value={option} className="text-base py-3">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Motivo */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {currentFormStrings.reasonLabel}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={currentFormStrings.reasonPlaceholder} 
                  {...field} 
                  className="min-h-[120px] bg-background border-2 border-muted-foreground/20 focus:border-primary transition-all text-base resize-none"
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                {field.value?.length || 0} / 500 caractères
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Urgence - Version améliorée */}
        <FormField
          control={form.control}
          name="isUrgent"
          render={({ field }) => (
            <FormItem>
              <div className={cn(
                "flex flex-row items-center justify-between rounded-xl border-2 p-4 transition-all duration-300",
                isUrgent 
                  ? "bg-red-500/10 dark:bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20" 
                  : "bg-accent/50 border-border hover:border-primary/30"
              )}>
                <div className="space-y-1 flex-1">
                  <FormLabel className={cn(
                    "text-base font-semibold flex items-center gap-2 cursor-pointer",
                    isUrgent && "text-red-700 dark:text-red-400"
                  )}>
                    <AlertCircle className={cn(
                      "h-5 w-5",
                      isUrgent ? "text-red-600 dark:text-red-400 animate-pulse" : "text-muted-foreground"
                    )} />
                    {currentFormStrings.urgencyLabel}
                  </FormLabel>
                  <FormDescription className={cn(
                    "text-sm",
                    isUrgent ? "text-red-700/80 dark:text-red-400/80 font-medium" : "text-muted-foreground"
                  )}>
                    {isUrgent 
                      ? (lang === 'es' ? 'Atención prioritaria activada' : 'Priority attention enabled')
                      : (lang === 'es' ? 'Marcar si requiere atención inmediata' : 'Mark if immediate attention required')
                    }
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className={cn(
                      "transition-all duration-300",
                      isUrgent && "data-[state=checked]:bg-red-600"
                    )}
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />

        {/* Bouton submit */}
        <Button 
          type="submit" 
          className={cn(
            "w-full text-lg py-7 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold relative overflow-hidden group",
            isUrgent && "bg-red-600 hover:bg-red-700"
          )}
          disabled={isSubmitting}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {currentFormStrings.submittingButtonText}
              </>
            ) : (
              <>
                <CalendarCheck className="h-5 w-5" />
                {currentFormStrings.submitButtonText}
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          <span className="text-destructive font-medium">*</span> {lang === 'es' ? 'Campos obligatorios' : 'Required fields'}
        </p>
      </form>
    </Form>
  );
}
