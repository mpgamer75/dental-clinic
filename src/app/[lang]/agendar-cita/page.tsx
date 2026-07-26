import { AppointmentForm } from '@/components/appointment-form';
import { contactDetails, services as allServices } from '@/lib/data';
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Language } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === 'en' || resolvedParams?.lang === 'es') ? resolvedParams.lang : 'es';
  
  const pageContent = contactDetails.appointmentPage[lang];
  const clinicName = contactDetails.clinicName[lang];
  const doctorName = contactDetails.doctorName[lang];

  const title = `${pageContent.title} - ${clinicName}`;
  const description = pageContent.description
    .replace('{{clinicName}}', clinicName)
    .replace('{{doctorName}}', doctorName);

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/agendar-cita`,
      languages: {
        'es-DO': '/es/agendar-cita',
        'en-US': '/en/agendar-cita',
        'x-default': '/es/agendar-cita',
      },
    },
    // Metadata is merged, not replaced, so without an explicit openGraph block
    // this page inherited the [lang] layout's — which describes the homepage.
    // Sharing the booking link on WhatsApp showed the homepage's title, blurb
    // and URL instead of the booking page's.
    openGraph: {
      title,
      description,
      url: `/${lang}/agendar-cita`,
      type: 'website',
      locale: lang === 'es' ? 'es_DO' : 'en_US',
      siteName: clinicName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function AgendarCitaPage({ params }: { params: Promise<{ lang: Language }> }) {
  const resolvedParams = await params;
  const lang: Language = resolvedParams?.lang || 'es';
  
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
