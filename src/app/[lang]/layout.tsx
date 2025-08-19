import type { Metadata } from 'next';
import '@/app/globals.css'; 
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { contactDetails, baseMetadata } from '@/lib/data';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';
import type { Language } from '@/lib/types';

// const inter = Inter({ (Already in root)
//   subsets: ['latin'],
//   variable: '--font-sans',
// });

export async function generateMetadata({ params }: { params: Promise<{ lang: Language }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === 'en' || resolvedParams?.lang === 'es') ? resolvedParams.lang : 'es';

  const currentClinicName = contactDetails.clinicName[lang];       
  const currentDoctorName = contactDetails.doctorName[lang];       
  const currentBaseMetadata = baseMetadata[lang];

  return {
    title: `${currentDoctorName} - ${currentBaseMetadata.titleSuffix}`,
    description: currentBaseMetadata.description
      .replace('{{clinicName}}', currentClinicName)
      .replace('{{doctorName}}', currentDoctorName),
    keywords: currentBaseMetadata.keywords,
    authors: [{ name: currentDoctorName }],
    creator: currentDoctorName,
    publisher: currentClinicName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL('https://orthoprotesisdentalclinic.com'),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'es': '/es',
        'en': '/en',
      },
    },
    openGraph: {
      title: `${currentDoctorName} - ${currentBaseMetadata.titleSuffix}`,
      description: currentBaseMetadata.description
        .replace('{{clinicName}}', currentClinicName)
        .replace('{{doctorName}}', currentDoctorName),
      url: `https://orthoprotesisdentalclinic.com/${lang}`,
      siteName: currentClinicName,
      locale: lang === 'es' ? 'es_DO' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${currentDoctorName} - ${currentBaseMetadata.titleSuffix}`,
      description: currentBaseMetadata.description
        .replace('{{clinicName}}', currentClinicName)
        .replace('{{doctorName}}', currentDoctorName),
    },
  };
}

export default async function LangLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ lang: Language }> 
}) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang || 'es';
  
  return (
    <LanguageProvider initialLanguage={lang}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light" 
        enableSystem={false}
        disableTransitionOnChange
      >
        <div suppressHydrationWarning>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </ThemeProvider>
    </LanguageProvider>
  );
}

