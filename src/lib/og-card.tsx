import 'server-only';

import { ImageResponse } from 'next/og';

import { contactDetails } from '@/lib/data';
import { SITE_URL } from '@/lib/site';
import type { Language } from '@/lib/types';

/* ============================================================================
   SOCIAL CARD — the image WhatsApp, Facebook and search show for a shared link
   ----------------------------------------------------------------------------
   Only /es and /en used to have one. Every other page set its own `openGraph`
   block without `images`, so sharing the implant guide — the pages most worth
   sharing — produced a bare link. The card was also rendered on every crawler
   request, and still in the cyan/teal palette the site left behind.

   One renderer, called by a small `opengraph-image.tsx` per page type, each
   statically generated and each carrying that page's own title.

   COLOUR LITERALS ARE DELIBERATE, and the second exception to the tokens-only
   rule (after global-error.tsx): this is rasterised by Satori, outside the
   page, where CSS custom properties do not exist. The values are the tokens
   resolved to sRGB — re-derive them if the palette changes:
     drench-deep 0.235 0.07 256 → #041d3e   on-drench 0.97 0.006 245 → #f2f6f9
     drench      0.32 0.085 254 → #0e335d   brass-lift 0.83 0.07 245 → #a2cdf2
   ========================================================================== */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const COLOR = {
  ground: '#041d3e',
  glow: '#0e335d',
  text: '#f2f6f9',
  muted: 'rgba(242, 246, 249, 0.72)',
  accent: '#a2cdf2',
} as const;

interface OgCardInput {
  lang: Language;
  /** Short line above the title. */
  eyebrow: string;
  /** The page's own headline. */
  title: string;
}

export function renderOgCard({ lang, eyebrow, title }: OgCardInput) {
  const host = new URL(SITE_URL).host;
  const clinic = contactDetails.clinicName[lang];
  const doctor = contactDetails.doctorName[lang];
  const phone = contactDetails.phone[lang];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 80px',
          backgroundColor: COLOR.ground,
          backgroundImage: `radial-gradient(1000px circle at 88% -20%, ${COLOR.glow} 0%, rgba(2, 46, 89, 0) 60%)`,
          color: COLOR.text,
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 26, letterSpacing: 1, color: COLOR.accent, fontFamily: 'sans-serif' }}>
            {eyebrow}
          </div>
          <div style={{ width: 88, height: 3, backgroundColor: COLOR.accent }} />
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 48 ? 58 : 70,
            lineHeight: 1.12,
            letterSpacing: -1,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 26,
            color: COLOR.muted,
            fontFamily: 'sans-serif',
          }}
        >
          <span>
            {clinic} · {doctor}
          </span>
          <span style={{ display: 'flex', gap: 14 }}>
            <span style={{ color: COLOR.text }}>{phone}</span>
            <span>{host}</span>
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
