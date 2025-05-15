
import { AppointmentForm } from '@/components/appointment-form';
import { contactDetails, services as allServices } from '@/lib/data';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Language } from '@/lib/types';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = (params.lang === 'en' || params.lang === 'es') ? params.lang : 'es';
  const pageContent = contactDetails.appointmentPage[lang];
  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];

  return {
    title: `${pageContent.title} - ${clinicName}`,
    description: pageContent.description
      .replace('{{clinicName}}', clinicName)
      .replace('{{doctorName}}', doctorName),
    alternates: {
      languages: {
        'es': '/es/agendar-cita',
        'en': '/en/agendar-cita',
      },
    },
  };
}

export default function AgendarCitaPage({ params }: { params: { lang: Language } }) {
  const lang: Language = params.lang;
  
  const currentClinicName = contactDetails.clinicName[lang];
  const currentDoctorName = contactDetails.doctorName[lang];
  const currentSchedule = contactDetails.schedule[lang];
  const pageContent = contactDetails.appointmentPage[lang];
  
  // Get service titles for the current language
  const serviceOptionsFromData = allServices[lang].map(s => s.title);
  
  const generalConsultationService = pageContent.serviceOptions.generalConsultation;

  // Ensure general consultation is in the list, preferably at the beginning
  let appointmentServices = [...serviceOptionsFromData];
  if (appointmentServices.includes(generalConsultationService)) {
    appointmentServices = [generalConsultationService, ...appointmentServices.filter(s => s !== generalConsultationService)];
  } else {
    appointmentServices.unshift(generalConsultationService);
  }
  
  const scheduleLines = currentSchedule.split('\\n');

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-accent/50 via-background to-secondary/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl rounded-xl overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground p-8 text-center">
              <CardTitle className="text-3xl md:text-4xl font-bold">
                {pageContent.cardTitle}
              </CardTitle>
              <CardDescription className="text-primary-foreground/90 text-lg mt-2">
                {pageContent.cardDescription
                  .replace('{{doctorName}}', currentDoctorName)
                  .replace('{{clinicName}}', currentClinicName)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-10 bg-card">
              <p className="text-md text-foreground text-center mb-6 leading-relaxed">
                {pageContent.formIntro}
              </p>
              <div className="bg-secondary/50 p-4 rounded-md mb-8 text-center">
                <h3 className="font-semibold text-primary mb-1">{pageContent.openingHoursTitle}</h3>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {scheduleLines[0]}
                  {scheduleLines[1] && <br />}
                  {scheduleLines[1]}
                </p>
              </div>
              <AppointmentForm serviceOptions={appointmentServices} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
