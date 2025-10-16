import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Star, Award, Clock, Phone } from 'lucide-react'; 
import { contactDetails, services as allServices, testimonials, faqItems, visitUsCarouselImages, diplomas } from '@/lib/data'; 
import { ServicesSection } from '@/components/sections/services-section';
import { TestimonialsSection } from '@/components/sections/testimonials-section';
import { FaqSection } from '@/components/sections/faq-section';
import { ContactSection } from '@/components/sections/contact-section';
import { VisitUsCarousel } from '@/components/sections/visit-us-carousel';
import { DiplomasSection } from '@/components/sections/diplomas-section';
import type { Language } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default async function HomePage({ params }: { params: Promise<{ lang: Language }> }) {
  const resolvedParams = await params;
  const lang: Language = resolvedParams?.lang || 'es';

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
  const diplomasList = diplomas[lang];

  const baseLangPath = `/${lang}`;
  const appointmentHref = `${baseLangPath}/agendar-cita`;
  const servicesHref = `${baseLangPath}#servicios`; 
  const contactHref = `${baseLangPath}#contacto`;

  const carouselImagesForLang = visitUsCarouselImages.map(img => ({
    src: img.src,
    alt: lang === 'es' ? img.altEs : img.altEn,
    hint: img.hint,
  }));

  const currentDiplomasSectionContent = contactDetails.diplomasSection[lang];

  return (
    <>
      {/* Hero Section Améliorée */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-20 md:pt-28 lg:pt-32 pb-12 md:pb-20 lg:pb-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center md:text-left animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">+30 años de experiencia</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary">
                {currentDoctorName}
              </h1>
              
              <p className="text-2xl md:text-3xl font-semibold text-foreground/90">
                {currentHeroContent.subtitle.replace('{{clinicName}}', currentClinicName)}
              </p>
              
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                {currentHeroContent.welcome}
              </p>
              
              <p className="text-md md:text-lg text-muted-foreground">
                {currentHeroContent.description.replace('{{doctorName}}', currentDoctorName)}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 btn-shine group"
                >
                  <Link href={appointmentHref}>
                    <Phone className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    {currentHeroContent.ctaAppointment}
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2"
                >
                  <Link href={servicesHref}>{currentHeroContent.ctaServices}</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">100% Garantizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Atención Inmediata</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Certificado Internacional</span>
                </div>
              </div>
            </div>
            
            <div className="relative group animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Card className="overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-all duration-500 border-0 bg-gradient-to-br from-card via-card to-card/90">
                <CardContent className="p-0">
                  <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
                    <Image
                      src="/images/vitrine_clinique1.jpg"
                      alt={`Fotografía del ${currentDoctorName}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority
                      quality={90}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </CardContent>
              </Card>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground p-6 rounded-full shadow-2xl animate-pulse-soft">
                <CheckCircle size={32} />
              </div>
              
              {/* Experience Badge */}
              <div className="absolute -top-4 -left-4 bg-card p-4 rounded-xl shadow-xl border-2 border-primary/20">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">30+</p>
                  <p className="text-xs text-muted-foreground">Años de Experiencia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualifications Section with Enhanced Design */}
          <div className="mt-16 md:mt-24">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-primary">
              {currentHeroContent.qualificationsTitle.replace('{{doctorName}}', currentDoctorName)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {currentQualifications.map((q, index) => (
                <Card 
                  key={index} 
                  className="bg-card/80 backdrop-blur-sm shadow-lg transition-all duration-500 hover:shadow-primary/30 hover:scale-105 hover:border-primary border-2 border-transparent group hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                      <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                    </div>
                    <p className="text-sm text-card-foreground font-medium">{q}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <DiplomasSection
        id="diplomas"
        title={currentDiplomasSectionContent.title.replace('{{doctorName}}', currentDoctorName).replace('{{clinicName}}', currentClinicName)}
        description={currentDiplomasSectionContent.description.replace('{{doctorName}}', currentDoctorName).replace('{{clinicName}}', currentClinicName)}
        diplomasList={diplomasList}
      />
      
      <VisitUsCarousel 
        images={carouselImagesForLang}
        visitUsContent={currentVisitUsContent}
        contactHref={contactHref}
      />

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