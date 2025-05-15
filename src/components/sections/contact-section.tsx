
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Language } from '@/lib/types';
import { contactDetails as allContactDetails } from '@/lib/data'; 

interface ContactSectionProps {
  id: string; // Added id for anchor linking
  lang: Language;
  title: string;
  description: string;
  formTitleText: string;
  detailsTitleText: string;
  addressText: string;
  phoneText: string;
  emailText: string;
  scheduleText: string;
  mapTitleText: string;
  mapLinkUrl: string;
  embedMapLinkUrl: string;
  addressLabel: string;
  phoneLabel: string;
  emailLabel: string;
  scheduleLabel: string;
  viewMapButtonText: string;
}

export function ContactSection({
  id,
  lang,
  title,
  description,
  formTitleText,
  detailsTitleText,
  addressText,
  phoneText,
  emailText,
  scheduleText,
  mapTitleText,
  mapLinkUrl,
  embedMapLinkUrl,
  addressLabel,
  phoneLabel,
  emailLabel,
  scheduleLabel,
  viewMapButtonText,
}: ContactSectionProps) {
  return (
    <section id={id} className="bg-secondary py-12 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">{title}</h2>
          <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <Card className="shadow-xl rounded-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{formTitleText}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="shadow-xl rounded-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">{detailsTitleText}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{addressLabel}</h4>
                    <a 
                      href={mapLinkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {addressText}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{phoneLabel}</h4>
                    <a href={`tel:${phoneText}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {phoneText}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{emailLabel}</h4>
                    <a href={`mailto:${emailText}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {emailText}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{scheduleLabel}</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{scheduleText}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-xl overflow-hidden rounded-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-primary">{mapTitleText}</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="w-full h-64 md:h-80 rounded-md overflow-hidden group relative">
                       <iframe
                         src={embedMapLinkUrl}
                         width="100%"
                         height="100%"
                         style={{ border:0 }}
                         allowFullScreen={false}
                         loading="lazy"
                         referrerPolicy="no-referrer-when-downgrade"
                         title={`${mapTitleText} - ${allContactDetails.clinicName[lang]}`}
                         className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                       ></iframe>
                       <a
                         href={mapLinkUrl}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         aria-label={`${viewMapButtonText} - ${allContactDetails.clinicName[lang]}`}
                       >
                         <p className="text-white text-lg font-semibold">{viewMapButtonText}</p>
                       </a>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
