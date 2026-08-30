/* ============================================================================
   Demo data — fabricated rows the panel can draw charts against
   ----------------------------------------------------------------------------
   Usage: npm run db:demo:seed
          npm run db:demo:purge
   ----------------------------------------------------------------------------
   The live tables hold two appointments, no messages and one testimonial. Every
   chart on the dashboard renders as a flat line or an empty axis against that,
   which means the clinic has no way to tell a working dashboard from a broken
   one — the failure mode this exists to remove. These rows give the charts a
   shape: a weekly rhythm, a mild upward trend, a service mix, a backlog of
   pending requests of varying age.

   THIS DATABASE SERVES A REAL CLINIC, AND THAT CHANGES WHAT "TEST DATA" MEANS.
   A row in app.appointments is a person the front desk is supposed to call
   back. An invented row that looks like a real one is not a fixture, it is a
   fabricated patient record, and the way it fails is one phone call: someone
   opens the queue on Monday, reads a name and a number, and rings a stranger —
   or nobody. Four defences, and each of them is load-bearing:

     1. `is_demo` on every row this file writes. NOT NULL DEFAULT false, so real
        submissions are unflagged without src/app/actions.ts knowing the column
        exists, and the panel can badge what is fake.
     2. Emails on @example.com, which RFC 2606 reserves precisely so it can
        never be registered or delivered to. Not "looks fake" — cannot receive.
     3. Phone numbers in 809-555-0100..0199. 555-01xx is the NANP's reserved
        fictional range, and 809 is the Dominican Republic, so these numbers are
        both locally plausible on screen and unassignable in reality.
     4. Purge is `DELETE ... WHERE is_demo`, run inside a transaction that
        counts the unflagged rows before and after and rolls back if that number
        moved. A boolean predicate cannot half-match; the check is there because
        the cost of being wrong once is a deleted patient enquiry that no backup
        of this script can bring back.

   NO DEMO TESTIMONIAL IS EVER WRITTEN AS 'approved'. src/app/(site)/[lang]/
   page.tsx renders every approved row on the clinic's public homepage, so an
   approved demo row is an invented patient quote published under an invented
   name on a medical practice's website. Flagged testimonials land in
   'pending_approval' and 'rejected' only, which is also where they are useful:
   the review queue and its ordering are the thing worth exercising.

   Re-running seed is exactly idempotent: it purges the flagged set first, then
   inserts from a seeded PRNG, so the same run produces the same clinic rather
   than piling a second invented practice on top of the first. Dates are the one
   thing that moves, because the ninety-day window is anchored to the run time —
   a chart of "the last 90 days" has to end today.
   ========================================================================== */

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { services } from '../lib/data';
import {
  appointments,
  contactMessages,
  testimonials,
  type AppointmentStatus,
  type NewAppointment,
  type NewContactMessage,
  type NewTestimonial,
  type TimePreference,
} from '../lib/schema';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

/* ============================================================================
   Deterministic randomness
   ========================================================================== */

/**
 * mulberry32 — a seeded PRNG, so "random" here means "arbitrary but fixed".
 *
 * `Math.random()` would make every run a different clinic: the operator could
 * not compare two runs, could not reproduce a chart that looked wrong, and a
 * second seed would silently double the data set instead of replacing it. The
 * algorithm is four lines and has no dependency, which is the entire reason to
 * prefer it over a library for a job this small.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const DEMO_SEED = 0x5eed_1e55;
const random = createRandom(DEMO_SEED);

/** Weighted alternatives as `[value, relative weight]`. Weights need not sum to
 *  anything in particular; only their ratios matter. */
type Weighted<T> = readonly (readonly [T, number])[];

function weightedPick<T>(table: Weighted<T>): T {
  const total = table.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = random() * total;

  for (const [value, weight] of table) {
    cursor -= weight;
    if (cursor <= 0) return value;
  }

  /* Only reachable through floating-point drift on the final subtraction, and
     the last entry is the correct answer when it happens. */
  return table[table.length - 1][0];
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

function chance(probability: number): boolean {
  return random() < probability;
}

/** Inclusive on both ends. */
function intBetween(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

/**
 * Knuth's Poisson sampler.
 *
 * Daily volume is drawn from a Poisson rather than jittered by a percentage
 * because a real appointment book has quiet Tuesdays and busy ones around the
 * same mean, and the difference is visible: uniform jitter draws a chart whose
 * bars are all nearly the same height, which reads as synthetic at a glance.
 * `lambda` here is single digits, so the naive multiplicative form is fine.
 */
function poisson(lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let product = 1;

  do {
    k += 1;
    product *= random();
  } while (product > limit);

  return k - 1;
}

/* ----------------------------------------------------------------------------
   Stable ids
   -------------------------------------------------------------------------- */

/* An arbitrary but fixed UUID, used as the v5 namespace. Every demo row's id is
   derived from it and a label, so the same row keeps the same id across runs —
   which is what makes an audit entry or a bookmarked /admin URL still point at
   the row it pointed at yesterday. */
const DEMO_NAMESPACE = Buffer.from('1c9a4f2e6b7d4a318e05d3f7c2b90a64', 'hex');

/**
 * RFC 4122 version 5 (SHA-1, name-based). Hand-rolled rather than pulled from a
 * package: it is eight lines, and this project adds no dependency for eight
 * lines. SHA-1 is not doing security work here — it is a naming function.
 */
function demoId(label: string): string {
  const digest = createHash('sha1').update(DEMO_NAMESPACE).update(label, 'utf8').digest();

  digest[6] = (digest[6] & 0x0f) | 0x50; // version 5
  digest[8] = (digest[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/* ============================================================================
   The clinic's calendar
   ============================================================================
   The zone is restated here rather than imported from
   src/app/(admin)/admin/_lib/format.ts, which is marked `server-only`: that
   package throws on import outside a React server environment, so a plain node
   script cannot read the constant even though it is the same constant.
   ========================================================================== */

const CLINIC_TIME_ZONE = 'America/Santo_Domingo';

/* Santo Domingo is AST year-round — the Dominican Republic abandoned DST in
   2000 — so clinic-local arithmetic is a fixed +4 back to UTC with no
   discontinuity to straddle. Every other date-handling comment in this codebase
   is about a value drifting a day across this boundary; doing the conversion
   explicitly is what keeps a Tuesday a Tuesday. */
const CLINIC_UTC_OFFSET_HOURS = 4;

const DAY_MS = 86_400_000;

interface ClinicDay {
  /** Milliseconds at UTC noon on this date. Noon, not midnight, because that
   *  instant falls on the same calendar date in every timezone from UTC-11 to
   *  UTC+12 — so nothing derived from it can slip a day. */
  readonly anchor: number;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  /** 0 = Sunday, in CLINIC time. At UTC noon the clinic clock reads 08:00 on
   *  the same date, so the UTC weekday of the anchor is the clinic weekday. */
  readonly weekday: number;
  /** Whole days before today. 0 is today. */
  readonly age: number;
}

/** Today's date as the clinic's calendar has it, not the server's. On Vercel
 *  the process runs in UTC, where the Dominican evening is already tomorrow. */
function clinicToday(): { year: number; month: number; day: number } {
  /* `en-CA` purely for its ISO-shaped short date. Reading the parts out of a
     formatter avoids `new Date(localeString)`, which leans on the engine's
     lenient parser and is only accidentally correct. */
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number);

  return { year, month, day };
}

/** The last `count` clinic days, oldest first. */
function clinicDays(count: number): ClinicDay[] {
  const { year, month, day } = clinicToday();
  const today = Date.UTC(year, month - 1, day, 12);

  const days: ClinicDay[] = [];
  for (let age = count - 1; age >= 0; age--) {
    const anchor = today - age * DAY_MS;
    const date = new Date(anchor);
    days.push({
      anchor,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      weekday: date.getUTCDay(),
      age,
    });
  }

  return days;
}

/** The instant at a given clinic wall-clock time on a clinic day. */
function instantAt(day: ClinicDay, hour: number, minute: number, second: number): Date {
  return new Date(
    Date.UTC(day.year, day.month - 1, day.day, hour + CLINIC_UTC_OFFSET_HOURS, minute, second),
  );
}

/**
 * A `YYYY-MM-DD` some days after `day`, never a Saturday or a Sunday.
 *
 * The clinic is closed at weekends and the booking form disables those dates in
 * its picker, so a demo row carrying a Saturday would describe a request the
 * live form cannot produce — and would put a bar on any "requested day" chart
 * where the clinic knows there is no clinic.
 */
function weekdayOffsetFrom(day: ClinicDay, offsetDays: number): string {
  let anchor = day.anchor + offsetDays * DAY_MS;

  for (;;) {
    const weekday = new Date(anchor).getUTCDay();
    if (weekday !== 0 && weekday !== 6) break;
    anchor += DAY_MS;
  }

  return new Date(anchor).toISOString().slice(0, 10);
}

/* ============================================================================
   The shape of the invented clinic
   ========================================================================== */

const HISTORY_DAYS = 90;

/** Mean appointment requests on an average day, before the weekday and trend
 *  multipliers. Tuned so ninety days comes out near three hundred rows: enough
 *  that every chart has a distribution, few enough that a purge is instant. */
const APPOINTMENTS_PER_DAY = 4;
const MESSAGES_PER_DAY = 0.85;

/* Sunday first, to index straight off `Date.getUTCDay()`. Monday is the peak
   because a weekend of toothache lands in the inbox at 9am; the weekend values
   are small but deliberately non-zero — the clinic is shut, the web form is
   not, and a Saturday with literally no submissions would misrepresent how the
   intake actually behaves. */
const WEEKDAY_WEIGHT = [0.2, 1.2, 1.05, 1.0, 1.05, 0.9, 0.35] as const;

/** Multiplier from the oldest day to today. A practice that is slowly growing
 *  gives the trend chart something to say; a flat mean gives it noise. */
function trendFactor(age: number): number {
  const progress = (HISTORY_DAYS - 1 - age) / (HISTORY_DAYS - 1);
  return 0.72 + 0.56 * progress;
}

/* When people actually submit the form, in clinic hours. Two humps: the morning
   after a bad night, and the evening once the day is over. Nobody writes in at
   4am, and a uniform spread would put a request at 4am roughly as often as at
   10am. */
const SUBMISSION_HOURS: Weighted<number> = [
  [7, 3],
  [8, 7],
  [9, 12],
  [10, 13],
  [11, 11],
  [12, 7],
  [13, 6],
  [14, 8],
  [15, 9],
  [16, 9],
  [17, 8],
  [18, 7],
  [19, 6],
  [20, 5],
  [21, 3],
  [22, 2],
];

/* ----------------------------------------------------------------------------
   Services — drawn from the real list, and checked against it
   -------------------------------------------------------------------------- */

/* Implants dominate because they are the clinic's commercial priority and the
   thing the site is built to sell; the rest tail off from there. The weights
   are what makes the service-demand chart worth looking at — a flat eighth
   each would be a chart with no information in it. */
const SERVICE_WEIGHTS: Weighted<string> = [
  ['Implantes Dentales', 34],
  ['Prótesis Dentales', 16],
  ['Limpieza Dental Profesional', 14],
  ['Ortodoncia', 12],
  ['Consulta General/Revisión', 10],
  ['Endodoncia (Tratamiento de Canal)', 6],
  ['Empastes (Restauraciones)', 5],
  ['Blanqueamiento Dental', 3],
];

/**
 * The weighted list and the site's own service list must name the same
 * treatments, in both directions.
 *
 * `service_type` is free text in the database — it is whatever the `<select>`
 * on the booking form submitted. If someone renames a service in data.ts, demo
 * rows built from a stale copy of the name would split the service-demand chart
 * into two bars for one treatment, and the cause would be invisible from the
 * chart. Failing here instead makes the rename tell you what else to change.
 */
function verifyServiceNames(): void {
  const real = new Set(services.es.map((service) => service.title));
  const seeded = new Set(SERVICE_WEIGHTS.map(([title]) => title));

  const invented = [...seeded].filter((title) => !real.has(title));
  const missing = [...real].filter((title) => !seeded.has(title));

  if (invented.length > 0 || missing.length > 0) {
    throw new Error(
      'SERVICE_WEIGHTS no longer matches `services.es` in src/lib/data.ts.\n' +
        (invented.length > 0 ? `  not offered on the site: ${invented.join(', ')}\n` : '') +
        (missing.length > 0 ? `  offered but never seeded: ${missing.join(', ')}\n` : '') +
        'Update the weights so demo rows carry service names the booking form can actually ' +
        'submit.',
    );
  }
}

/* ----------------------------------------------------------------------------
   Words
   -------------------------------------------------------------------------- */

/* Dominican given names and surnames. The names are ordinary on purpose: a
   dashboard seeded with "Test User 14" tells the clinic nothing about how the
   real thing will look, and the row is marked as demo by its flag, not by
   being unreadable. */
const FIRST_NAMES = [
  'Ana', 'Carolina', 'Yamilet', 'Rosanna', 'Massiel', 'Yokasta', 'Altagracia', 'Dahiana',
  'Nurys', 'Clarissa', 'Wendy', 'Katherine', 'Yaritza', 'Scarlet', 'Milagros', 'Josefina',
  'Ramona', 'Perla', 'Ginette', 'Mariluz', 'José', 'Juan Carlos', 'Ramón', 'Wilkin',
  'Starling', 'Franklin', 'Elvin', 'Yovanny', 'Rafael', 'Domingo', 'Máximo', 'Argenis',
  'Braylin', 'Ambiorix', 'Confesor', 'Eddy', 'Manuel', 'Robinson', 'Yeuris', 'Deivi',
] as const;

/* 'Valerio' is absent deliberately — it is the doctor's own surname, and a
   demo patient sharing it invites exactly the double-take this file exists to
   prevent. */
const SURNAMES = [
  'Peralta', 'Cabrera', 'Almonte', 'Fernández', 'Ureña', 'Tavárez', 'Reynoso', 'Espaillat',
  'Núñez', 'Rodríguez', 'Jiménez', 'Grullón', 'Bonilla', 'Then', 'Estrella', 'Hiciano',
  'Domínguez', 'Batista', 'Guzmán', 'Polanco', 'Sosa', 'Marte', 'Vargas', 'Liriano',
  'Contreras', 'Paulino', 'Disla', 'Abréu',
] as const;

const LOCATIONS = [
  'Santiago de los Caballeros',
  'Santiago',
  'Moca',
  'La Vega',
  'Puerto Plata',
  'Licey al Medio',
  'Tamboril',
  'Navarrete',
  'Villa González',
  'San Francisco de Macorís',
] as const;

const REASONS: Record<string, readonly string[]> = {
  'Implantes Dentales': [
    'Perdí una muela hace unos meses y quisiera saber si soy candidato para un implante. Me interesa conocer el costo aproximado y cuánto dura todo el tratamiento.',
    'Me hicieron una extracción el año pasado y el espacio me molesta al masticar. Quiero evaluar la colocación de un implante en esa zona.',
    'Tengo dos piezas ausentes abajo y uso una prótesis removible que no me termina de acomodar. Quisiera información sobre implantes fijos.',
  ],
  'Prótesis Dentales': [
    'Necesito una prótesis parcial superior. La que tengo ya tiene años y se me mueve al comer.',
    'Quiero información sobre coronas para dos muelas que tengo muy desgastadas por el bruxismo.',
    'Me recomendaron un puente para reemplazar un diente ausente. Quisiera una segunda opinión y un presupuesto.',
  ],
  Ortodoncia: [
    'Mi hija tiene catorce años y necesita brackets. Queremos una evaluación y saber cómo funciona el pago.',
    'Tengo los dientes de abajo apiñados y me gustaría saber si soy candidato para alineadores transparentes.',
    'Quisiera corregir mi mordida. Me han dicho que cierro mal y he empezado a tener dolor de mandíbula.',
  ],
  'Limpieza Dental Profesional': [
    'Quisiera una limpieza. Hace como dos años que no me hago una y tengo sarro en la parte de abajo.',
    'Me sangran las encías al cepillarme y creo que necesito una limpieza profunda.',
    'Vengo por mi limpieza de rutina, cada seis meses como me indicaron la vez pasada.',
  ],
  'Blanqueamiento Dental': [
    'Me caso en tres meses y quisiera hacerme un blanqueamiento antes de la boda.',
    'Tomo mucho café y se me han manchado los dientes de adelante. Quiero saber qué opciones hay.',
  ],
  'Empastes (Restauraciones)': [
    'Se me picó una muela y siento el hueco con la lengua. Todavía no me duele pero quiero resolverlo.',
    'Tengo una calza vieja que se me está saliendo por un lado y quisiera que la revisaran.',
  ],
  'Endodoncia (Tratamiento de Canal)': [
    'Me dijeron que necesito un tratamiento de canal en una muela de atrás. Quisiera saber el costo y cuántas sesiones lleva.',
    'Tengo una muela que me duele con lo frío y lo caliente desde hace semanas. Sospecho que es el nervio.',
  ],
  'Consulta General/Revisión': [
    'Quisiera una revisión general. Hace tiempo que no voy al dentista y prefiero saber cómo estoy antes de que sea algo grave.',
    'Me gustaría una evaluación completa con radiografías para saber qué tratamientos necesito y en qué orden.',
    'Vengo de otra ciudad y busco un odontólogo de confianza en Santiago. Quisiera empezar con una consulta.',
  ],
};

/* Used instead of the per-service text whenever the row is marked urgent, so an
   urgent demo row reads urgent in the queue. A dashboard where the urgency flag
   and the words under it disagree teaches the front desk to ignore the flag. */
const URGENT_REASONS = [
  'Tengo un dolor fuerte en una muela desde anoche y no me calma con nada. Necesito que me vean lo antes posible.',
  'Se me partió un diente de adelante comiendo y el filo me está lastimando la lengua.',
  'Se me inflamó la encía y tengo la cara hinchada de ese lado. Me duele hasta al tragar.',
  'Se me salió una corona esta mañana y el diente que quedó debajo está muy sensible al frío.',
  'Llevo dos noches con un dolor punzante que no me deja dormir. Ya tomé analgésicos y no baja.',
] as const;

const MESSAGE_BODIES = [
  '¿Trabajan con seguro Humano? Quisiera saber qué cubre para ortodoncia antes de pedir la cita.',
  'Buenas tardes, quisiera saber si atienden los sábados o solamente de lunes a viernes.',
  '¿Cuánto cuesta aproximadamente un implante con su corona? Necesito hacerme una idea del presupuesto.',
  '¿Tienen facilidades de pago para tratamientos largos como la ortodoncia?',
  'Quisiera saber si el doctor atiende niños o solamente adultos. Mi hijo tiene siete años.',
  '¿Dónde puedo estacionar cuando vaya a la consulta en Plaza Las Ramblas?',
  'Pedí una cita la semana pasada por el formulario y todavía no me han llamado. ¿Pueden confirmarme?',
  'Buenos días, ¿atienden emergencias fuera del horario normal? Es para tenerlo presente.',
  'Quisiera saber si hacen radiografías en la misma clínica o si hay que ir a otro lugar.',
  'Me gustaría cambiar la fecha de mi cita de la próxima semana. ¿Con quién puedo hablar?',
  '¿El primer chequeo tiene costo o la evaluación inicial es gratis?',
  'Vi los diplomas en la página y quisiera saber si el doctor hace cirugía de implantes él mismo.',
] as const;

/* Testimonial text is written out rather than generated: a review is prose, and
   a recombined one reads like a recombined one. Statuses are limited to
   'pending_approval' and 'rejected' — see the file header on why an approved
   demo testimonial is a publishing incident, not a fixture. */
const DEMO_TESTIMONIALS: readonly {
  quote: string;
  score: number | null;
  status: 'pending_approval' | 'rejected';
}[] = [
  {
    quote:
      'Excelente atención. Me colocaron dos implantes y el proceso fue mucho más llevadero de lo que esperaba. El doctor explica cada paso con calma.',
    score: 88,
    status: 'pending_approval',
  },
  {
    quote:
      'Llevé a mi mamá para una prótesis completa y quedó encantada. Se nota el cuidado en el trabajo y la atención del personal.',
    score: 81,
    status: 'pending_approval',
  },
  {
    quote:
      'Muy buena experiencia con la ortodoncia de mi hija. Un año y medio de tratamiento y el resultado se ve muy natural.',
    score: 74,
    status: 'pending_approval',
  },
  {
    quote:
      'Fui de emergencia con un dolor terrible y me atendieron el mismo día. Salí sin dolor y con el tratamiento explicado.',
    score: 69,
    status: 'pending_approval',
  },
  {
    quote:
      'La limpieza quedó impecable y me explicaron cómo cepillarme mejor. Volveré en seis meses sin duda.',
    score: 63,
    status: 'pending_approval',
  },
  {
    quote:
      'Buen trato, buenos precios y la clínica está muy limpia. Lo único es que hay que llamar temprano para conseguir cita.',
    score: 47,
    status: 'pending_approval',
  },
  {
    quote:
      'El tratamiento salió bien pero esperé casi una hora más de lo acordado. La atención del doctor no tengo queja.',
    score: 34,
    status: 'pending_approval',
  },
  {
    quote:
      'Recomendado al cien por ciento!!! El mejor dentista de Santiago sin discusión, no busquen más!!!',
    score: 12,
    status: 'pending_approval',
  },
  /* Two unscored rows: the review queue is ordered score-ascending NULLS FIRST
     precisely so a submission nobody assessed surfaces above a badly scored
     one, and with every row scored that ordering rule is invisible on screen. */
  {
    quote:
      'Me atendieron muy bien desde que entré. El lugar es cómodo y la cita empezó a la hora.',
    score: null,
    status: 'pending_approval',
  },
  {
    quote:
      'Gracias por devolverme la sonrisa después de tantos años evitando el dentista.',
    score: null,
    status: 'pending_approval',
  },
  {
    quote:
      'VISITEN MI PAGINA PARA OFERTAS DENTALES BARATAS, MEJORES PRECIOS QUE CUALQUIER CLINICA!!!',
    score: 3,
    status: 'rejected',
  },
  {
    quote:
      'Pésimo, no vayan, me cobraron de más y nunca me devolvieron la llamada. Una estafa completa.',
    score: 9,
    status: 'rejected',
  },
  {
    quote:
      'aaaaaaa bueno bueno bueno muy bueno excelente excelente excelente recomendado recomendado',
    score: 16,
    status: 'rejected',
  },
  {
    quote:
      'Buen servicio pero quiero dejar aquí mi número por si alguien necesita transporte a la clínica.',
    score: 28,
    status: 'rejected',
  },
];

/* ============================================================================
   Building rows
   ========================================================================== */

/** Accents stripped for the local part of an address: `José Núñez` has to
 *  become `jose.nunez`, because an address with a diacritic in it is a fight
 *  with SMTP nobody needs to have even on a domain that cannot receive mail. */
function asciiFold(value: string): string {
  /* The escapes are load-bearing. Written as the character class `[0300-036f]`
     this matches the literal characters 0, 3, 6 and f rather than the combining
     diacritics block, which strips the f out of `Franklin` and leaves the
     accent on `José` exactly where it was — producing `josé.núñez@example.com`,
     an address carrying combining marks in its local part. */
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Tracks how many times each local part has been handed out, so two different
 *  invented people do not share an address by accident. */
const usedLocalParts = new Map<string, number>();

interface DemoPerson {
  name: string;
  email: string;
  phone: string;
}

function demoPerson(): DemoPerson {
  const first = pick(FIRST_NAMES);
  const surname = pick(SURNAMES);
  /* Two surnames on roughly half the rows, which is how Dominican names are
     actually written and what the panel's column widths will have to hold. */
  const name = chance(0.5) ? `${first} ${surname} ${pick(SURNAMES)}` : `${first} ${surname}`;

  const base = `${asciiFold(first).replace(/\s+/g, '')}.${asciiFold(surname)}`;
  const seen = (usedLocalParts.get(base) ?? 0) + 1;
  usedLocalParts.set(base, seen);

  return {
    name,
    /* @example.com is reserved by RFC 2606 for exactly this: it is registered
       to nobody, resolves to nothing, and cannot accept mail. A plausible-looking
       gmail address would eventually be typed into a real client. */
    email: `${seen === 1 ? base : `${base}${seen}`}@example.com`,
    /* 555-0100..0199 is the NANP block reserved for fiction; 809 is the
       Dominican Republic, so this dials nowhere while still looking, on a busy
       screen, like the local number a patient would leave. */
    phone: `809-555-01${String(intBetween(0, 99)).padStart(2, '0')}`,
  };
}

/**
 * Where a request has got to, given how long ago it arrived.
 *
 * Age is the only input, and that is what makes the funnel and the waiting-time
 * chart tell the same story: old requests are mostly resolved, recent ones are
 * mostly pending, and the handful of old ones still sitting at 'pending' are
 * the backlog the dashboard exists to surface. A status drawn independently of
 * age would produce a week-old request marked 'completed' next to a
 * three-month-old one marked 'pending' with no reason for either.
 */
function statusForAge(age: number): AppointmentStatus {
  if (age >= 45) {
    return weightedPick<AppointmentStatus>([
      ['completed', 68],
      ['cancelled', 14],
      ['confirmed', 10],
      ['pending', 8],
    ]);
  }
  if (age >= 14) {
    return weightedPick<AppointmentStatus>([
      ['completed', 40],
      ['confirmed', 30],
      ['pending', 17],
      ['cancelled', 13],
    ]);
  }
  if (age >= 4) {
    return weightedPick<AppointmentStatus>([
      ['pending', 40],
      ['confirmed', 38],
      ['completed', 12],
      ['cancelled', 10],
    ]);
  }
  return weightedPick<AppointmentStatus>([
    ['pending', 74],
    ['confirmed', 20],
    ['cancelled', 4],
    ['completed', 2],
  ]);
}

/* Roughly 12% of requests overall, but concentrated where urgency actually
   comes from — nobody marks a whitening enquiry as an emergency. */
const PAIN_LED_SERVICES = new Set([
  'Endodoncia (Tratamiento de Canal)',
  'Empastes (Restauraciones)',
  'Consulta General/Revisión',
]);

function buildAppointments(days: readonly ClinicDay[], now: number): NewAppointment[] {
  const rows: NewAppointment[] = [];

  for (const day of days) {
    const expected = APPOINTMENTS_PER_DAY * WEEKDAY_WEIGHT[day.weekday] * trendFactor(day.age);

    /* Drawn once, into a variable, because a `for` condition is re-evaluated on
       every iteration: `index < poisson(expected)` takes a fresh sample per row
       and stops at the first draw that falls at or below the counter. That is
       not a Poisson variate, it is a race between a counter and the left tail,
       and it converges on the same modest number every day — mean 3.1 against
       a requested 4, with the spread squeezed out. The weekday rhythm and the
       upward trend are computed into `expected` above and would then barely
       reach the chart, which is the one thing this whole file is for. */
    const submissions = poisson(expected);

    for (let index = 0; index < submissions; index++) {
      const submittedAt = instantAt(
        day,
        weightedPick(SUBMISSION_HOURS),
        intBetween(0, 59),
        intBetween(0, 59),
      );

      /* Today is only partly over. Dropping the rows that would land later this
         evening keeps the newest bar of the trend chart honest — it is short
         because the day is short, not because demand fell off a cliff. */
      if (submittedAt.getTime() >= now) continue;

      const serviceType = weightedPick(SERVICE_WEIGHTS);
      const isUrgent = chance(PAIN_LED_SERVICES.has(serviceType) ? 0.27 : 0.09);
      const status = statusForAge(day.age);
      const person = demoPerson();

      /* Anything past 'pending' was touched by staff at some point after it
         arrived; a pending row has never been touched, so its updated_at is
         still its submitted_at. The panel reads both. */
      const updatedAt =
        status === 'pending'
          ? submittedAt
          : new Date(
              Math.min(
                now,
                submittedAt.getTime() + intBetween(2, 96) * 3_600_000,
              ),
            );

      rows.push({
        id: demoId(`appointment:${day.age}:${index}`),
        name: person.name,
        email: person.email,
        phone: person.phone,
        serviceType,
        reason: isUrgent ? pick(URGENT_REASONS) : pick(REASONS[serviceType]),
        isUrgent,
        /* About a fifth leave the day blank, which is what makes 'unstated' a
           real bucket on the preference charts rather than a decorative zero. */
        preferredDate: chance(0.78) ? weekdayOffsetFrom(day, intBetween(2, 21)) : null,
        timePreference: weightedPick<TimePreference | null>([
          ['morning', 45],
          ['afternoon', 27],
          ['any', 16],
          [null, 12],
        ]),
        submittedAt,
        updatedAt,
        status,
        isDemo: true,
      });
    }
  }

  return rows;
}

function buildMessages(days: readonly ClinicDay[], now: number): NewContactMessage[] {
  const rows: NewContactMessage[] = [];

  for (const day of days) {
    const expected = MESSAGES_PER_DAY * WEEKDAY_WEIGHT[day.weekday] * trendFactor(day.age);

    /* Drawn once — see the note in `buildAppointments` on why sampling inside
       the loop condition is not sampling at all. */
    const submissions = poisson(expected);

    for (let index = 0; index < submissions; index++) {
      const submittedAt = instantAt(
        day,
        weightedPick(SUBMISSION_HOURS),
        intBetween(0, 59),
        intBetween(0, 59),
      );
      if (submittedAt.getTime() >= now) continue;

      const person = demoPerson();
      /* Every branch passes `[value, weight]` pairs. A bare list of strings
         type-checks nowhere, but src/scripts is excluded from tsconfig, so the
         version of this that read `weightedPick(['archived', 'read', 'unread'])`
         compiled and ran: `weightedPick` destructures `[, weight]` out of each
         entry, took the SECOND CHARACTER of each string as its weight, summed
         them into the string "0ren", and returned `'unread'[0]` — the letter
         'u'. Every message older than thirty days was then inserted with
         `status = 'u'`, which contact_messages_status_check rejects, and the
         whole seed aborted on its first chunk. */
      const status =
        day.age >= 30
          ? weightedPick([
              ['archived', 62],
              ['read', 33],
              ['unread', 5],
            ] as const)
          : day.age >= 7
            ? weightedPick([
                ['read', 55],
                ['archived', 25],
                ['unread', 20],
              ] as const)
            : weightedPick([
                ['unread', 62],
                ['read', 33],
                ['archived', 5],
              ] as const);

      rows.push({
        id: demoId(`message:${day.age}:${index}`),
        name: person.name,
        email: person.email,
        /* The contact form does not require a phone, so a third of these have
           none — the panel has to render that column empty either way. */
        phone: chance(0.65) ? person.phone : null,
        message: pick(MESSAGE_BODIES),
        submittedAt,
        updatedAt:
          status === 'unread'
            ? submittedAt
            : new Date(Math.min(now, submittedAt.getTime() + intBetween(1, 72) * 3_600_000)),
        status,
        isDemo: true,
      });
    }
  }

  return rows;
}

function buildTestimonials(days: readonly ClinicDay[], now: number): NewTestimonial[] {
  /* Spread across the window rather than clustered, so the review queue holds
     submissions of visibly different ages. */
  const step = Math.floor(days.length / (DEMO_TESTIMONIALS.length + 1));

  return DEMO_TESTIMONIALS.map((entry, index) => {
    const day = days[Math.min(days.length - 1, (index + 1) * step)];
    const submittedAt = new Date(
      Math.min(now - 3_600_000, instantAt(day, intBetween(9, 21), intBetween(0, 59), 0).getTime()),
    );

    const reviewedAt =
      entry.status === 'rejected'
        ? new Date(Math.min(now, submittedAt.getTime() + intBetween(4, 120) * 3_600_000))
        : null;

    return {
      id: demoId(`testimonial:${index}`),
      name: `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`,
      quote: entry.quote,
      location: chance(0.8) ? pick(LOCATIONS) : null,
      moderationScore: entry.score,
      submittedAt,
      updatedAt: reviewedAt ?? submittedAt,
      reviewedAt,
      /* Not a staff email. The real column holds the address of whoever made
         the decision, and putting a plausible one here would attribute an
         invented judgement to a real person. */
      reviewedBy: reviewedAt ? 'demo-data.ts' : null,
      status: entry.status,
      isDemo: true,
    } satisfies NewTestimonial;
  });
}

/* ============================================================================
   Database
   ========================================================================== */

function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return { pool, db: drizzle({ client: pool }) };
}

type Db = ReturnType<typeof createDb>['db'];

/** Everything below reads and writes but never opens a transaction, so it works
 *  identically against the connection and against a transaction handle. */
type Runner = Pick<Db, 'select' | 'insert' | 'delete'>;

interface TableTally {
  label: string;
  total: number;
  demo: number;
  real: number;
}

async function tally(runner: Runner): Promise<TableTally[]> {
  /* One pass per table with a FILTER rather than two counts each: the two
     numbers then describe the same instant, so "real rows" and "demo rows"
     cannot be read from either side of a concurrent insert and fail to add up
     to the total printed beside them. */
  const [appointmentCounts, messageCounts, testimonialCounts] = await Promise.all([
    runner
      .select({
        total: sql<number>`count(*)::int`,
        demo: sql<number>`count(*) filter (where ${appointments.isDemo})::int`,
      })
      .from(appointments),
    runner
      .select({
        total: sql<number>`count(*)::int`,
        demo: sql<number>`count(*) filter (where ${contactMessages.isDemo})::int`,
      })
      .from(contactMessages),
    runner
      .select({
        total: sql<number>`count(*)::int`,
        demo: sql<number>`count(*) filter (where ${testimonials.isDemo})::int`,
      })
      .from(testimonials),
  ]);

  return [
    { label: 'app.appointments', ...appointmentCounts[0] },
    { label: 'app.contact_messages', ...messageCounts[0] },
    { label: 'app.testimonials', ...testimonialCounts[0] },
  ].map((row) => ({ ...row, real: row.total - row.demo }));
}

function printTally(heading: string, rows: readonly TableTally[]): void {
  console.log(`\n${heading}`);
  console.log('  tabla                  filas    demo   reales');
  for (const row of rows) {
    console.log(
      `  ${row.label.padEnd(22)}${String(row.total).padStart(5)}${String(row.demo).padStart(8)}${String(row.real).padStart(9)}`,
    );
  }
}

/**
 * Deletes every flagged row and nothing else.
 *
 * The predicate is a bare boolean column, which is the reason this operation is
 * safe to hand to an operator: it cannot partially match the way a name prefix
 * or a date range can, and a real row has `is_demo = false` by default rather
 * than by anyone remembering to set it.
 *
 * The counts of UNFLAGGED rows are taken before and after inside the same
 * transaction, and a difference aborts it. Nothing in the statements above can
 * touch a real row, which is exactly why the check is worth its two queries:
 * this is production, the failure is a deleted patient enquiry, and "the code
 * looked right" is not a recovery plan.
 */
async function purgeDemoRows(runner: Runner): Promise<{ deleted: TableTally[] }> {
  const before = await tally(runner);

  const [removedAppointments, removedMessages, removedTestimonials] = await Promise.all([
    runner.delete(appointments).where(eq(appointments.isDemo, true)).returning({
      id: appointments.id,
    }),
    runner.delete(contactMessages).where(eq(contactMessages.isDemo, true)).returning({
      id: contactMessages.id,
    }),
    runner.delete(testimonials).where(eq(testimonials.isDemo, true)).returning({
      id: testimonials.id,
    }),
  ]);

  const after = await tally(runner);

  for (const [index, row] of after.entries()) {
    if (row.real !== before[index].real) {
      throw new Error(
        `${row.label} lost real rows during the purge: ${before[index].real} before, ` +
          `${row.real} after. The transaction has been rolled back and nothing was deleted. ` +
          'Do not re-run until the predicate in purgeDemoRows has been re-read.',
      );
    }
  }

  return {
    deleted: [
      { label: 'app.appointments', total: removedAppointments.length, demo: 0, real: 0 },
      { label: 'app.contact_messages', total: removedMessages.length, demo: 0, real: 0 },
      { label: 'app.testimonials', total: removedTestimonials.length, demo: 0, real: 0 },
    ],
  };
}

/* Postgres caps a statement at 65535 bind parameters and an appointment costs
   thirteen of them, so three hundred rows fit comfortably in one INSERT. The
   chunking is here so that raising APPOINTMENTS_PER_DAY later fails by being
   slower rather than by hitting a limit nobody remembers. */
const INSERT_CHUNK = 200;

function chunked<T>(rows: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

/**
 * Fails early and legibly when migration 0004 has not been applied.
 *
 * Without this the first INSERT returns `column "is_demo" of relation
 * "appointments" does not exist`, which reads like a bug in this script. It is
 * not: DATABASE_URL is the vd_app role, which has no DDL by design, so applying
 * the migration is an operator step this script cannot perform on its own.
 */
async function assertDemoColumn(runner: Runner): Promise<void> {
  const [row] = await runner
    .select({
      present: sql<number>`count(*)::int`,
    })
    .from(sql`information_schema.columns`)
    .where(
      sql`table_schema = 'app' and column_name = 'is_demo' and table_name in ('appointments', 'contact_messages', 'testimonials')`,
    );

  if ((row?.present ?? 0) < 3) {
    throw new Error(
      'app.appointments, app.contact_messages and app.testimonials do not all have an is_demo ' +
        'column, so demo rows could not be told apart from real ones and this script refuses ' +
        'to write any.\n' +
        'Apply migrations/0004_demo_flag.sql first:\n' +
        '  MIGRATION_DATABASE_URL=<neondb_owner connection string> npm run db:migrate\n' +
        'DATABASE_URL alone will not do it — vd_app is granted CRUD and no DDL.',
    );
  }
}

/* ============================================================================
   Modes
   ========================================================================== */

async function runSeed(db: Db): Promise<void> {
  verifyServiceNames();

  const now = Date.now();
  const days = clinicDays(HISTORY_DAYS);
  const appointmentRows = buildAppointments(days, now);
  const messageRows = buildMessages(days, now);
  const testimonialRows = buildTestimonials(days, now);

  await db.transaction(async (tx) => {
    await assertDemoColumn(tx);
    printTally('Antes:', await tally(tx));

    /* Purge before insert, in the same transaction. This is what makes a second
       seed produce the same clinic rather than a second one on top of the
       first, and it means a failure halfway through the inserts leaves the
       panel exactly as it was rather than empty. */
    await purgeDemoRows(tx);

    for (const chunk of chunked(appointmentRows, INSERT_CHUNK)) {
      await tx.insert(appointments).values(chunk);
    }
    for (const chunk of chunked(messageRows, INSERT_CHUNK)) {
      await tx.insert(contactMessages).values(chunk);
    }
    if (testimonialRows.length > 0) {
      await tx.insert(testimonials).values(testimonialRows);
    }

    printTally('Después:', await tally(tx));
  });

  console.log(
    `\nSe insertaron ${appointmentRows.length} citas, ${messageRows.length} mensajes y ` +
      `${testimonialRows.length} testimonios de demostración, repartidos en ${HISTORY_DAYS} días.`,
  );
  console.log(
    'Todas llevan is_demo = true, correo en @example.com y teléfono en el rango ficticio ' +
      '809-555-01xx. Ningún número de estos corresponde a una persona: no los llame.',
  );
  console.log('Para eliminarlas: npm run db:demo:purge');
}

async function runPurge(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    await assertDemoColumn(tx);

    const before = await tally(tx);
    printTally('Antes:', before);

    const { deleted } = await purgeDemoRows(tx);

    printTally('Después:', await tally(tx));

    const total = deleted.reduce((sum, row) => sum + row.total, 0);
    console.log(
      `\nSe eliminaron ${total} filas de demostración ` +
        `(${deleted.map((row) => `${row.label}: ${row.total}`).join(', ')}).`,
    );
    console.log('Ninguna fila con is_demo = false fue tocada; se verificó dentro de la transacción.');
  });
}

/* ============================================================================
   Entry point
   ========================================================================== */

function connectionString(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error(
      'DATABASE_URL is not set. Put the vd_app connection string from the Neon console into ' +
        '.env.local — this script only writes and deletes rows, so the application role is the ' +
        'right one for it.',
    );
    process.exit(1);
  }

  return url;
}

/** Host only, never the connection string: it carries a password, and this
 *  output ends up pasted into issues and chat windows. */
function targetHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '(no se pudo leer el host de DATABASE_URL)';
  }
}

async function main(): Promise<void> {
  const mode = process.argv[2];

  if (mode !== 'seed' && mode !== 'purge') {
    console.error(
      'Usage:\n' +
        '  npm run db:demo:seed    inserta filas de demostración marcadas con is_demo\n' +
        '  npm run db:demo:purge   elimina exactamente esas filas y no toca ninguna otra',
    );
    process.exit(1);
  }

  const url = connectionString();
  const { pool, db } = createDb(url);

  /* Printed before anything is written. This is a live clinic database, and the
     operator should be able to see which one from the terminal scrollback
     afterwards rather than from memory. */
  console.log(`${mode === 'seed' ? 'Sembrando' : 'Eliminando'} datos de demostración en ${targetHost(url)}`);

  try {
    if (mode === 'seed') {
      await runSeed(db);
    } else {
      await runPurge(db);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('\nFalló la operación de datos de demostración. No se escribió nada.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
