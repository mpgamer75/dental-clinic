
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react'; 
import { contactDetails, services as allServices, testimonials, faqItems, visitUsCarouselImages } from '@/lib/data'; 
import { ServicesSection } from '@/components/sections/services-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { FaqSection } from '@/components/sections/faq-section';
import { ContactSection } from '@/components/sections/contact-section';
import { VisitUsCarousel } from '@/components/sections/visit-us-carousel';
import type { Language } from '@/lib/types';

export default function HomePage({ params }: { params: { lang: Language } }) {
  const lang: Language = params.lang;

  const currentClinicName = contactDetails.clinicName[lang];
  const currentDoctorName = contactDetails.doctorName[lang];
  const currentAddress = contactDetails.address[lang];
  const currentPhone = contactDetails.phone[lang];
  const currentEmail = contactDetails.email[lang];
  const currentSchedule = contactDetails.schedule[lang];
  const currentMapLink = contactDetails.mapLink[lang];
  const currentEmbedMapLink = contactDetails.embedMapLink[lang];
  
  const currentQualifications = contactDetails.qualifications[lang];
  const currentHeroContent = contactDetails.hero[lang];
  const currentVisitUsContent = contactDetails.visitUs[lang];
  const currentServicesSectionContent = contactDetails.servicesSection[lang];
  const currentTestimonialsSectionContent = contactDetails.testimonialsSection[lang];
  const currentFaqSectionContent = contactDetails.faqSection[lang];
  const currentContactSectionContent = contactDetails.contactSection[lang];

  const servicesList = allServices[lang]; 
  const testimonialsList = testimonials[lang]; 
  const faqItemsList = faqItems[lang];

  const baseLangPath = `/${lang}`;
  const appointmentHref = `${baseLangPath}/agendar-cita`;
  const servicesHref = `${baseLangPath}#servicios`; 
  const contactHref = `${baseLangPath}#contacto`;

  const carouselImagesForLang = visitUsCarouselImages.map(img => ({
    src: img.src,
    alt: lang === 'es' ? img.altEs : img.altEn,
    hint: img.hint,
  }));


  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent/50 via-background to-secondary/50 pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-20 lg:pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary">
                {currentDoctorName}
              </h1>
              <p className="text-2xl md:text-3xl font-semibold text-foreground">
                {currentHeroContent.subtitle.replace('{{clinicName}}', currentClinicName)}
              </p>
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                {currentHeroContent.welcome}
              </p>
              <p className="text-md md:text-lg text-muted-foreground">
                {currentHeroContent.description.replace('{{doctorName}}', currentDoctorName)}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105">
                  <Link href={appointmentHref}>{currentHeroContent.ctaAppointment}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:scale-105">
                  <Link href={servicesHref}>{currentHeroContent.ctaServices}</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative group">
              <Card className="overflow-hidden shadow-2xl transform group-hover:scale-105 transition-transform duration-300 ease-in-out">
                <CardContent className="p-0">
                  <Image
                    src="https://picsum.photos/seed/doctor-valerio/600/700"
                    alt={`Fotografía del ${currentDoctorName}`}
                    width={600}
                    height={700}
                    className="object-cover w-full h-auto"
                    priority
                    data-ai-hint="dentist portrait professional"
                  />
                </CardContent>
              </Card>
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-4 rounded-full shadow-xl animate-pulse">
                <CheckCircle size={32} />
              </div>
            </div>
          </div>

          <div className="mt-16 md:mt-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-primary">
              {currentHeroContent.qualificationsTitle.replace('{{doctorName}}', currentDoctorName)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {currentQualifications.map((q, index) => (
                <Card 
                  key={index} 
                  className="bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out hover:shadow-primary/30 hover:scale-105 hover:border-primary border border-transparent"
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                    <p className="text-sm text-card-foreground font-medium">{q}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <VisitUsCarousel 
        images={carouselImagesForLang}
        visitUsContent={currentVisitUsContent}
        contactHref={contactHref}
      />

      {/* Integrated Sections */}
      <ServicesSection 
        id="servicios" 
        title={currentServicesSectionContent.title}
        description={currentServicesSectionContent.description.replace('{{clinicName}}', currentClinicName).replace('{{doctorName}}', currentDoctorName)}
        servicesList={servicesList}
      />
      <TestimonialsSection
        id="testimonios"
        title={currentTestimonialsSectionContent.title}
        description={currentTestimonialsSectionContent.description.replace('{{clinicName}}', currentClinicName).replace('{{doctorName}}', currentDoctorName)}
        testimonialsList={testimonialsList}
        ctaButtonText={currentTestimonialsSectionContent.ctaButton}
        dialogTitleText={currentTestimonialsSectionContent.dialogTitle}
        dialogDescriptionText={currentTestimonialsSectionContent.dialogDescription}
      />
      <FaqSection
        id="preguntas-frecuentes"
        title={currentFaqSectionContent.title}
        description={currentFaqSectionContent.description.replace('{{clinicName}}', currentClinicName).replace('{{doctorName}}', currentDoctorName)}
        faqItemsList={faqItemsList}
      />
      <ContactSection
        id="contacto"
        lang={lang}
        title={currentContactSectionContent.title}
        description={currentContactSectionContent.description.replace('{{clinicName}}', currentClinicName).replace('{{doctorName}}', currentDoctorName)}
        formTitleText={currentContactSectionContent.formTitle}
        detailsTitleText={currentContactSectionContent.detailsTitle}
        addressText={currentAddress}
        phoneText={currentPhone}
        emailText={currentEmail}
        scheduleText={currentSchedule}
        mapTitleText={currentContactSectionContent.mapTitle}
        mapLinkUrl={currentMapLink}
        embedMapLinkUrl={currentEmbedMapLink}
        addressLabel={currentContactSectionContent.addressLabel}
        phoneLabel={currentContactSectionContent.phoneLabel}
        emailLabel={currentContactSectionContent.emailLabel}
        scheduleLabel={currentContactSectionContent.scheduleLabel}
        viewMapButtonText={currentContactSectionContent.viewMapButton}
      />
    </>
  );
}
