
'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { contactDetails } from '@/lib/data';
// import { ToothIcon } from '@/components/icons/tooth-icon'; // Removed ToothIcon
import { useLanguage } from '@/contexts/language-context';

export function Footer() {
  const { lang } = useLanguage();
  const currentYear = new Date().getFullYear();

  const currentContactDetails = {
    clinicName: contactDetails.clinicName[lang],
    doctorName: contactDetails.doctorName[lang],
    address: contactDetails.address[lang],
    phone: contactDetails.phone[lang],
    email: contactDetails.email[lang],
    schedule: contactDetails.schedule[lang],
    mapLink: contactDetails.mapLink[lang],
    footerContent: contactDetails.footer[lang],
  };
  const homeHref = `/${lang}`;

  return (
    <footer className="bg-secondary text-secondary-foreground py-12 print:hidden">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link href={homeHref} className="flex items-center gap-2 mb-4">
            {/* <ToothIcon className="h-8 w-8 text-primary" /> Removed ToothIcon */}
            <span className="text-2xl font-bold text-primary">{currentContactDetails.clinicName}</span>
          </Link>
          <p className="text-sm">
            {currentContactDetails.footerContent.tagline
              .replace('{{doctorName}}', currentContactDetails.doctorName)}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-primary">{currentContactDetails.footerContent.quickContact}</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <a href={currentContactDetails.mapLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {currentContactDetails.address}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <a href={`tel:${currentContactDetails.phone}`} className="hover:underline">
                {currentContactDetails.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <a href={`mailto:${currentContactDetails.email}`} className="hover:underline">
                {currentContactDetails.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-primary">{currentContactDetails.footerContent.scheduleTitle}</h3>
          <p className="text-sm whitespace-pre-line">{currentContactDetails.schedule}</p>
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 mt-8 pt-8 border-t border-primary/20 text-center text-sm">
        <p>
          {currentContactDetails.footerContent.copyright
            .replace('{{year}}', currentYear.toString())
            .replace('{{clinicName}}', currentContactDetails.clinicName)}
        </p>
        <p className="mt-1">
          {currentContactDetails.footerContent.doctorAttribution
            .replace('{{doctorName}}', currentContactDetails.doctorName)}
        </p>
      </div>
    </footer>
  );
}
