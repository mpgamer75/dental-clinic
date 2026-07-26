import type { SVGProps } from 'react';

/**
 * Dental procedure icon set.
 *
 * Lucide has no vocabulary for prosthetics, endodontics or osseointegration —
 * the previous build reached for `Users`, `Activity` and `Scan`, none of which
 * mean anything to a patient. These are drawn for the actual procedures.
 *
 * Drawn to Lucide's grammar so the two sets sit together without clashing:
 * 24×24 grid, 1.5 stroke, round caps and joins, `currentColor`, no fills.
 * `strokeWidth` stays overridable so callers can tune optical weight at size.
 */

type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number | string };

function Icon({ strokeWidth = 1.5, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** A molar. The base glyph the rest of the set is built around. */
export function ToothIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.2c-2 0-2.6-1-4.4-1C5.4 2.2 4 4.1 4 7c0 2.2.7 3.4 1.2 5.2.4 1.6.5 3.3.7 5 .2 1.6.7 2.6 1.7 2.6 1.2 0 1.5-1.3 1.8-3.2.3-1.7.5-3.1 2.6-3.1s2.3 1.4 2.6 3.1c.3 1.9.6 3.2 1.8 3.2 1 0 1.5-1 1.7-2.6.2-1.7.3-3.4.7-5C19.3 10.4 20 9.2 20 7c0-2.9-1.4-4.8-3.6-4.8-1.8 0-2.4 1-4.4 1Z" />
    </Icon>
  );
}

/** Titanium post seated in bone — implantology. */
export function ImplantIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3h6" />
      <path d="M10 6h4" />
      <path d="M10.6 8.5h2.8" />
      <path d="M11 11h2" />
      <path d="M11.2 13.5h1.6" />
      <path d="M12 16v5" />
      <path d="M5 8.5c0 5.2 2.6 9 7 12.5 4.4-3.5 7-7.3 7-12.5" opacity={0.45} />
    </Icon>
  );
}

/** Crown seated over a prepared abutment — fixed prosthetics. */
export function CrownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 6.2 6l2.6 2.8L12 4l3.2 4.8L17.8 6 20 10.5Z" />
      <path d="M4.6 13.5h14.8" />
      <path d="M7 16.5v3" />
      <path d="M12 16.5v3.5" />
      <path d="M17 16.5v3" />
    </Icon>
  );
}

/** Removable denture arch — removable prosthetics. */
export function DentureIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8c0-1.4 3.8-2.5 8.5-2.5S20.5 6.6 20.5 8c0 3.6-2 8.4-4.2 8.4-1.3 0-1.6-1.6-1.9-3-.3-1.3-.9-2-2.4-2s-2.1.7-2.4 2c-.3 1.4-.6 3-1.9 3C5.5 16.4 3.5 11.6 3.5 8Z" />
      <path d="M6.6 9.2h10.8" />
    </Icon>
  );
}

/** Bracket and archwire — orthodontics. */
export function BracesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9.5h18" />
      <path d="M3 14.5h18" />
      <rect x="5" y="8" width="3.4" height="8" rx="1" />
      <rect x="10.3" y="8" width="3.4" height="8" rx="1" />
      <rect x="15.6" y="8" width="3.4" height="8" rx="1" />
    </Icon>
  );
}

/** Ultrasonic scaler tip against a tooth surface — hygiene. */
export function ScalerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 3.5 13 11" />
      <path d="M18.4 3 21 5.6" />
      <path d="M12.4 11.6 10 14" />
      <path d="M7.5 12.5c-1.7 0-3 1.5-3 3.6 0 2 .8 4.4 2 4.4.9 0 1-1.1 1.3-2.2.2-.9.6-1.4 1.4-1.4s1.2.5 1.4 1.4c.3 1.1.4 2.2 1.3 2.2 1.2 0 2-2.4 2-4.4 0-2.1-1.3-3.6-3-3.6" />
    </Icon>
  );
}

/** Shade brightening — whitening. */
export function WhiteningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 20.5c-1.1 0-1.5-1.2-1.7-2.6-.2-1.4-.3-2.8-.6-4.1-.4-1.5-.9-2.5-.9-4.1 0-2.4 1.2-4 3-4 1.5 0 2 .8 3.7.8" />
      <path d="M17 4.2v3.1" />
      <path d="M20.6 6.4 18.4 8.6" />
      <path d="M21.8 10.5h-3" />
      <path d="M12.8 6.4 15 8.6" />
    </Icon>
  );
}

/** Cavity prepared and restored — direct restorations. */
export function FillingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.4c-1.8 0-2.4-.9-4-.9-2 0-3.3 1.7-3.3 4.3 0 2 .7 3.1 1.1 4.7.4 1.5.5 3 .7 4.5.2 1.5.6 2.4 1.5 2.4 1.1 0 1.4-1.2 1.6-2.9.3-1.6.5-2.8 2.4-2.8s2.1 1.2 2.4 2.8c.3 1.7.5 2.9 1.6 2.9.9 0 1.3-.9 1.5-2.4" />
      <path d="m15.5 8.5 2-2 2.5 2.5-2 2Z" />
      <path d="m13.6 10.4 1.9-1.9 2.5 2.5-1.9 1.9Z" />
    </Icon>
  );
}

/** Root canals instrumented — endodontics. */
export function RootCanalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.4c-1.9 0-2.5-.9-4.2-.9C5.7 2.5 4.4 4.3 4.4 7c0 2 .7 3.2 1.1 4.8.4 1.5.5 3.1.7 4.6.2 1.5.6 2.5 1.6 2.5 1.1 0 1.4-1.2 1.7-3 .3-1.6.5-2.9 2.5-2.9s2.2 1.3 2.5 2.9c.3 1.8.6 3 1.7 3 1 0 1.4-1 1.6-2.5.2-1.5.3-3.1.7-4.6.4-1.6 1.1-2.8 1.1-4.8 0-2.7-1.3-4.5-3.4-4.5-1.7 0-2.3.9-4.2.9Z" />
      <path d="M10.2 8v6.2" />
      <path d="M13.8 8v6.2" />
    </Icon>
  );
}

/** Mirror and probe — examination. */
export function CheckupIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7.5" cy="7.5" r="4" />
      <path d="m10.4 10.4 6.4 6.4" />
      <path d="M16.2 16.2c-.7.7-.7 1.9 0 2.6l1.4 1.4c.7.7 1.9.7 2.6 0s.7-1.9 0-2.6l-1.4-1.4c-.7-.7-1.9-.7-2.6 0Z" />
    </Icon>
  );
}

/**
 * Maps the `iconName` strings stored in data.ts onto this set.
 *
 * Legacy Lucide names are kept as keys so existing content keeps resolving to
 * something meaningful instead of silently falling back.
 */
export const DENTAL_ICONS = {
  Tooth: ToothIcon,
  Implant: ImplantIcon,
  Crown: CrownIcon,
  Denture: DentureIcon,
  Braces: BracesIcon,
  Scaler: ScalerIcon,
  Whitening: WhiteningIcon,
  Filling: FillingIcon,
  RootCanal: RootCanalIcon,
  Checkup: CheckupIcon,

  /* Legacy iconName values from the previous build. */
  Users: DentureIcon,
  Scan: ImplantIcon,
  Smile: BracesIcon,
  Sparkles: ScalerIcon,
  Activity: WhiteningIcon,
  ShieldCheck: FillingIcon,
  HeartPulse: RootCanalIcon,
  Stethoscope: CheckupIcon,
  Telescope: ImplantIcon,
} as const;

export type DentalIconName = keyof typeof DENTAL_ICONS;
