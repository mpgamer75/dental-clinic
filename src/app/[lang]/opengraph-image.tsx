import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Orthoprotesis Dental Clinic — Dr. Francis Valerio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Branded, on-brand social card generated at the edge — replaces the broken
// static image references and guarantees a valid og:image for every locale.
// Clinic/doctor names are fixed brand facts (kept inline to keep this route lean).
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: 'es' | 'en' = raw === 'en' ? 'en' : 'es';

  const clinicName = 'Orthoprotesis Dental Clinic';
  const doctorName = 'Dr. Francis Valerio';
  const eyebrow = lang === 'es' ? 'CLÍNICA DENTAL · SANTIAGO, RD' : 'DENTAL CLINIC · SANTIAGO, DR';
  const tagline =
    lang === 'es'
      ? 'Implantes, prótesis y ortodoncia · +30 años de experiencia'
      : 'Implants, prosthetics & orthodontics · 30+ years of experience';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#0b3a86',
          backgroundImage:
            'radial-gradient(900px circle at 85% -10%, #1d6fb8 0%, rgba(29,111,184,0) 45%), linear-gradient(135deg, #0b3a86 0%, #082a5f 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              fontWeight: 600,
              color: '#7ee0ea',
            }}
          >
            {eyebrow}
          </div>
          <div style={{ width: 96, height: 6, backgroundColor: '#2bb8c9', borderRadius: 99 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>
            {clinicName}
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, color: '#dbe8ff' }}>{doctorName}</div>
          <div style={{ fontSize: 30, color: '#aac5ef' }}>{tagline}</div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            color: '#cfe0ff',
          }}
        >
          <span style={{ fontWeight: 700, color: '#ffffff' }}>809-581-7059</span>
          <span style={{ color: '#5d83c4' }}>·</span>
          <span>drfrancisvaleriop.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
