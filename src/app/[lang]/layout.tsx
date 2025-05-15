import type { Metadata } from 'next';
// Ensure Inter font is imported if needed here, or rely on RootLayout's className
// import { Inter } from 'next/font/google'; (Already in root)
import '../global.css'; 
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
// Toaster moved to RootLayout to be truly global, unless specific toast messages need i18n context from here.
// For now, assuming Toaster is fine in RootLayout. If specific i18n for toasts is needed, it can be added here.
// import { Toaster } from '@/components/ui/toaster'; 
import { contactDetails, baseMetadata } from '@/lib/data';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/components/theme-provider';
import type { Language } from '@/lib/types';

// const inter = Inter({ (Already in root)
//   subsets: ['latin'],
//   variable: '--font-sans',
// });

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = (params.lang === 'en' || params.lang === 'es') ? params.lang : 'es'; // Validate lang
  
  const currentClinicName = contactDetails.clinicName[lang];
  const currentDoctorName = contactDetails.doctorName[lang];
  const currentTitleSuffix = baseMetadata[lang].titleSuffix;
  const currentMetaDescription = baseMetadata[lang].description;
  const currentKeywords = baseMetadata[lang].keywords;

  const createPath = (pathSegment = '') => {
    // Ensure pathSegment starts with / if it's not empty, or is empty for root
    const segment = pathSegment.startsWith('/') ? pathSegment : (pathSegment ? `/${pathSegment}` : '');
    return segment;
  };

  return {
    title: `${currentClinicName} - ${currentDoctorName} | ${currentTitleSuffix}`,
    description: currentMetaDescription
      .replace('{{clinicName}}', currentClinicName)
      .replace('{{doctorName}}', currentDoctorName),
    keywords: currentKeywords,
    alternates: {
      languages: {
        'es': `/es${createPath(params.lang && params.lang !== 'es' ? (typeof params === 'object' && params && 'slug' in params && Array.isArray(params.slug) ? params.slug.join('/') : '') : (typeof params === 'object' && params && 'slug' in params && Array.isArray(params.slug) ? params.slug.join('/') : '') )}`,
        'en': `/en${createPath(params.lang && params.lang !== 'en' ? (typeof params === 'object' && params && 'slug' in params && Array.isArray(params.slug) ? params.slug.join('/') : '') : (typeof params === 'object' && params && 'slug' in params && Array.isArray(params.slug) ? params.slug.join('/') : '') )}`,
      },
    },
  };
}

export default function LangLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { lang: Language };
}>) {
  const lang = params.lang;
  return (
    // The <html> and <body> tags are in src/app/layout.tsx
    // Font className is also applied there.
    // This layout provides language and theme context.
    <LanguageProvider initialLanguage={lang}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light" 
        enableSystem={false} // System theme is being removed
        disableTransitionOnChange
      >
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        {/* <Toaster /> Moved to RootLayout */}
      </ThemeProvider>
    </LanguageProvider>
  );
}

