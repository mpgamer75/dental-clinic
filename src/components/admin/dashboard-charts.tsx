'use client';

import { useEffect, useId, useMemo, useRef, useState, useTransition } from 'react';
import type { ReactElement, ReactNode, RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChartColumnBig, RotateCcw, type LucideIcon } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type {
  FunnelStage,
  QueryOutcome,
  ServiceDemand,
  TimePreferenceKey,
  TimePreferenceSlice,
  TrendPoint,
  WaitBucket,
  WaitBucketKey,
  WeekdayKey,
  WeekdayPoint,
} from '@/app/(admin)/admin/_lib/queries';
import { Button } from '@/components/ui/button';
import type { AppointmentStatus } from '@/lib/schema';
import { cn } from '@/lib/utils';

import { APPOINTMENT_STATUS_META } from './status';

/* ============================================================================
   SIX QUESTIONS THE CLINIC ACTUALLY ASKS, IN SIX DIFFERENT SHAPES
   ----------------------------------------------------------------------------
   Every number below is aggregated in Postgres over the whole table (see the
   analytics block in _lib/queries.ts) and arrives as at most a couple of dozen
   integers. Nothing here is computed from the page of rows the dashboard
   happens to be showing — the version this descends from drew "citas por
   estado" from the ten rows it had fetched, which is a rounding error with a
   legend.

   FORM FOLLOWS QUESTION. A trend gets an area, ranked categories get
   horizontal bars, a composition gets one segmented bar, a part-of-whole split
   gets a donut, a magnitude-with-a-subset-inside gets stacked columns, and a
   seven-day cycle gets a radar because the week closes back on itself and a
   bar chart cuts that loop between Sunday and Monday. Six bar charts would
   have been quicker to write and would have made six different questions look
   like one.

   COLOUR. Series come from --chart-1..5 through `oklch(var(--chart-n))`; CSS
   custom properties resolve inside SVG presentation attributes, so every
   series follows the theme with no literal in this file and no reading of
   computed styles at runtime. Colour never carries meaning ON ITS OWN: each
   chart is read through a legend that repeats the label and the number, the
   funnel legend reuses the very icons the status badges carry in the table
   above it, and the ramp already separates in lightness (--chart-1 is the
   darkest step, --chart-2 and --chart-3 the lightest) so the series survive
   being printed, or seen by a reader who does not separate blue from gold.

   ANIMATION — decided, not defaulted. Please read before flipping it back.
   The previous version pinned `isAnimationActive={false}` everywhere on the
   grounds that recharts animates by recomputing path geometry in JavaScript
   every frame rather than handing a transform to the compositor. That
   reasoning is correct and it still holds FOR CONTINUOUS MOTION, which is why
   there is no looping, no pulsing and no hover-driven re-animation anywhere
   below; every `<Tooltip>` in particular is explicitly
   `isAnimationActive={false}`, because a tooltip that re-animates turns one
   mouse sweep across a fortnight of columns into fourteen path recomputations.

   A single ENTRANCE is a different trade: ~420ms of work once, on a screen the
   reader has just opened, and it is what makes six panels of numbers arrive as
   six separate objects rather than as one flat wall. So each series enters
   once and then stops — `useEntranceAnimation` returns 'auto' until the
   entrance has had time to finish and `false` for the rest of the page's life,
   which means the redraw after every status change in the tables above is
   instant instead of replaying the whole grid.

   'auto' rather than `true`, deliberately: it is recharts' own opt-in to
   `prefers-reduced-motion` (see usePrefersReducedMotion in the package), read
   in a lazy state initialiser that is SSR-guarded and kept current by an
   effect — never during a render pass of ours. A reader who has asked their
   system for less motion gets the finished chart and no entrance at all.
   ========================================================================== */

/** One entrance, this long. Long enough to read as motion, short enough that
 *  nobody waits on it before they can act on the number. */
const ENTRANCE_MS = 420;

const SERIES = {
  /** Routine volume, and the darkest step on the ramp. */
  routine: 'oklch(var(--chart-1))',
  /** Brass. Kept for the bucket that is waiting on a person. */
  warm: 'oklch(var(--chart-2))',
  accent: 'oklch(var(--chart-3))',
  /** The one genuinely independent series colour in the palette. Used for
   *  urgency and never for a category that merely happens to be fourth. */
  urgent: 'oklch(var(--chart-4))',
  /** The flattest step, for a slice meaning "nothing was said" or "this left
   *  the funnel". */
  muted: 'oklch(var(--chart-5))',
} as const;

const AXIS_TICK = { fill: 'oklch(var(--ink-faint))', fontSize: 11 } as const;
const GRID_STROKE = 'oklch(var(--line))';
/** Stack segments are separated by a hairline in the CARD's own colour rather
 *  than by a gap, so the divider disappears into the surface in both themes. */
const SURFACE = 'oklch(var(--surface))';

/** 'auto' while the entrance is still owed, then `false` forever. See the
 *  animation note above. */
type Animation = boolean | 'auto';

const FUNNEL_COLOR: Record<AppointmentStatus, string> = {
  pending: SERIES.warm,
  confirmed: SERIES.routine,
  completed: SERIES.accent,
  cancelled: SERIES.muted,
};

const TIME_COLOR: Record<TimePreferenceKey, string> = {
  morning: SERIES.warm,
  afternoon: SERIES.routine,
  any: SERIES.accent,
  unstated: SERIES.muted,
};

/* The query's own labels ("Menos de 24 h", "Más de 7 días") are prose, and
   four of them collide on a category axis inside a 296px card. These are the
   same four boundaries said short enough to fit; the full phrasing still
   reaches the reader through the footnote under the chart. */
const WAIT_AXIS_LABEL: Record<WaitBucketKey, string> = {
  under24h: 'Hasta 24 h',
  days1to3: '1–3 días',
  days4to7: '4–7 días',
  over7d: '+7 días',
};

const WEEKDAY_NAME: Record<WeekdayKey, string> = {
  mon: 'lunes',
  tue: 'martes',
  wed: 'miércoles',
  thu: 'jueves',
  fri: 'viernes',
  sat: 'sábado',
  sun: 'domingo',
};

/* Heights and column spans live in one table because the skeleton at the
   bottom of this file is built from it too. A fallback whose footprint has
   drifted from the chart it stands in for is a fallback that makes the page
   jump the moment the data lands — the one thing it exists to prevent. */
const LAYOUT = {
  trend: { height: 250, span: 'md:col-span-2', legend: true },
  waits: { height: 232, span: undefined, legend: true },
  services: { height: 232, span: undefined, legend: false },
  timeOfDay: { height: 214, span: undefined, legend: true },
  weekday: { height: 214, span: undefined, legend: false },
  funnel: { height: 76, span: 'md:col-span-2', legend: true },
} as const;

const decimal = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 1 });

/* ============================================================================
   Shared pieces
   ========================================================================== */

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

/** Spanish sets a space before the sign. */
function share(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)} %` : '0 %';
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * Whether the entrance is still owed.
 *
 * A timer rather than `onAnimationEnd`, for two reasons: six series finish at
 * six slightly different moments and this flag is shared by all of them, and a
 * chart that never animates — reduced motion, or a series recharts decides is
 * empty — never fires the event at all, which would strand the flag at 'auto'
 * and let every later refresh replay the whole grid.
 */
function useEntranceAnimation(): Animation {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), ENTRANCE_MS + 250);
    return () => window.clearTimeout(timer);
  }, []);

  return settled ? false : 'auto';
}

/**
 * The chart body's real width in CSS pixels, 0 until it has been measured.
 *
 * Every narrow-screen decision below — how much room the category axis may
 * take, whether an axis title fits, how far apart date ticks must sit — is
 * about the width of THIS CARD, which is the whole viewport at 360px and about
 * half of it inside the two-column grid. A `matchMedia` breakpoint would have
 * to infer that difference and would get a tablet wrong; an observer on the
 * element itself simply knows. It costs nothing extra either, because
 * ResponsiveContainer already waits for a measurement before it draws.
 */
function useMeasuredWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      /* Sub-pixel churn — a scrollbar appearing, a font swapping — would
         otherwise re-render all six charts on every frame of a resize. */
      setWidth((current) => (Math.abs(current - next) < 1 ? current : next));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/**
 * Which of the three states a chart is in.
 *
 * 'empty' and 'error' are separate cases rather than one shared "no data"
 * branch, and that is the whole reason `QueryOutcome` exists: a quiet
 * fortnight and an unreachable database both produce zero rows and mean
 * opposite things. A clinic told "no hay solicitudes pendientes" when the
 * truth is "no pudimos leerlas" stops worrying about a queue that is still
 * growing.
 */
type ChartStatus = { kind: 'ok' } | { kind: 'empty' } | { kind: 'error'; detail: string };

function chartStatus<T>(outcome: QueryOutcome<T>, isEmpty: boolean): ChartStatus {
  if (!outcome.ok) return { kind: 'error', detail: outcome.detail };
  return isEmpty ? { kind: 'empty' } : { kind: 'ok' };
}

interface LegendItem {
  key: string;
  label: string;
  color: string;
  value: number;
  share?: string;
  icon?: LucideIcon;
}

/**
 * The chart's reading surface.
 *
 * Always below the plot and always wrapping, so at 360px it becomes two rows
 * of two instead of something clipped by the card edge. It carries the number
 * as well as the name: a reader who cannot separate two series by colour still
 * gets every value, which is what stops the palette being the only channel.
 */
function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.key} className="flex min-w-0 items-center gap-1.5 text-small text-ink-soft">
            {Icon ? (
              <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
            ) : null}
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">{item.label}</span>
            <span className="tabular font-semibold text-ink">{item.value}</span>
            {item.share && <span className="tabular text-ink-faint">{item.share}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** Bars, because bars are what is coming, at the exact height of what is
 *  coming. `.skeleton` animates background-position only — a paint property —
 *  and the global reduced-motion rule in globals.css stops it dead. */
const SKELETON_BARS = [44, 70, 56, 86, 62, 74, 50];

function ChartSkeleton({ short = false }: { short?: boolean }) {
  if (short) return <div className="skeleton h-full w-full rounded-lg" />;

  return (
    <div className="flex h-full w-full items-end gap-2">
      {SKELETON_BARS.map((height, index) => (
        <div key={index} className="skeleton flex-1" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-canvas-sunk/60 px-4 text-center">
      <ChartColumnBig className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
      <p className="max-w-measure text-small text-ink-soft">{message}</p>
    </div>
  );
}

/**
 * A read that failed, said out loud and styled so it cannot be mistaken for a
 * quiet week.
 *
 * `detail` is the SQLSTATE-level string from `formatDatabaseFailure`: no
 * patient data, no query text, no bound parameters. It is shown rather than
 * swallowed because the person reading it is the one who will be on the phone
 * to whoever can fix it, and "sqlstate 42501 on app.appointments" ends that
 * call in a minute where "algo salió mal" starts an afternoon.
 */
function ChartError({ detail }: { detail: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <p className="text-small font-medium text-ink">No se pudo calcular esta gráfica.</p>
      <p className="tabular max-w-measure break-words text-small text-ink-faint">
        Detalle técnico: {detail}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending}
        className="mt-1"
        onClick={() => startTransition(() => router.refresh())}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </Button>
    </div>
  );
}

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { fill?: string };
}

/**
 * Tooltip in the panel's own tokens.
 *
 * Recharts' default is a white box with a grey border, which is a different
 * product once the theme goes dark. The slice swatch falls back to
 * `payload.fill` because a `<Pie>` colours its sectors through `<Cell>` and
 * hands the entry no top-level `color` at all, which would leave the donut's
 * tooltip with an invisible dot.
 */
function ChartTooltip({
  active,
  payload,
  label,
  showTotal = false,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  showTotal?: boolean;
}) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter((entry) => entry.value !== undefined && entry.value !== null);
  if (rows.length === 0) return null;

  const heading = label ?? rows[0]?.name;
  const total = rows.reduce(
    (sum, entry) => sum + (typeof entry.value === 'number' ? entry.value : 0),
    0,
  );

  return (
    <div className="min-w-36 rounded-lg border border-line bg-surface-raised px-3 py-2 shadow-e2">
      {heading !== undefined && <p className="text-small font-medium text-ink">{heading}</p>}
      <ul className="mt-1 space-y-0.5">
        {rows.map((entry, index) => (
          <li key={index} className="tabular flex items-center gap-1.5 text-small text-ink-soft">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
            />
            <span className="truncate">{entry.name}</span>
            <span className="ml-auto pl-3 font-semibold text-ink">{entry.value}</span>
          </li>
        ))}
      </ul>
      {showTotal && rows.length > 1 && (
        <p className="tabular mt-1.5 flex items-center gap-1.5 border-t border-line pt-1.5 text-small text-ink-soft">
          Total
          <span className="ml-auto pl-3 font-semibold text-ink">{total}</span>
        </p>
      )}
    </div>
  );
}

/**
 * One panel: a title, a line about what to DO with it, the plot, and the
 * numbers underneath.
 *
 * The subtitle is not a caption. A chart nobody can act on is decoration, so
 * each of the six names the decision it informs — open more slots, ring this
 * bucket first, staff this half of the day.
 *
 * `children` is a render prop rather than an element because the plot needs
 * the measured width to decide how much room its axis may take, and this is
 * the only component that knows it.
 */
function ChartCard({
  title,
  subtitle,
  height,
  status,
  emptyMessage,
  legend,
  footnote,
  overlay,
  shortSkeleton = false,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  height: number;
  status: ChartStatus;
  emptyMessage: string;
  legend?: ReactNode;
  footnote?: ReactNode;
  /** Centred over the plot — the donut's total. Never interactive. */
  overlay?: ReactNode;
  shortSkeleton?: boolean;
  className?: string;
  children: (box: { width: number; narrow: boolean }) => ReactElement;
}) {
  const [bodyRef, width] = useMeasuredWidth<HTMLDivElement>();
  const drawn = status.kind === 'ok' && width > 0;

  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-xl border border-line bg-surface p-4 shadow-e1 sm:p-5',
        className,
      )}
    >
      <header className="min-w-0">
        <h3 className="font-heading text-h4 leading-snug text-ink">{title}</h3>
        <p className="mt-1 text-small text-ink-soft">{subtitle}</p>
      </header>

      <div ref={bodyRef} className="relative mt-4 min-w-0" style={{ height }}>
        {status.kind === 'error' ? (
          <ChartError detail={status.detail} />
        ) : status.kind === 'empty' ? (
          <ChartEmpty message={emptyMessage} />
        ) : width === 0 ? (
          /* Measured, not guessed: until the observer has answered there is no
             width to draw into, and the skeleton holds the exact box the plot
             is about to occupy, so the card never resizes under the reader. */
          <ChartSkeleton short={shortSkeleton} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children({ width, narrow: width < 380 })}
          </ResponsiveContainer>
        )}

        {drawn && overlay && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {overlay}
          </div>
        )}
      </div>

      {drawn && legend && <div className="mt-3">{legend}</div>}
      {drawn && footnote && <p className="mt-3 text-small text-ink-faint">{footnote}</p>}
    </section>
  );
}

/* ============================================================================
   1 — Solicitudes recibidas (área apilada)
   ========================================================================== */

const NO_TREND: TrendPoint[] = [];

function TrendChart({
  outcome,
  animation,
}: {
  outcome: QueryOutcome<TrendPoint[]>;
  animation: Animation;
}) {
  /* Gradient ids are document-global: two charts sharing one means the second
     silently paints itself with the first's fill. */
  const gradientId = useId();
  const points = outcome.ok ? outcome.data : NO_TREND;

  const data = useMemo(
    () =>
      points.map((point) => ({
        label: point.label,
        /* Urgent is a SUBSET of total, so the routine band is the difference.
           Stacking urgent on top of total would draw a fortnight twice as busy
           as the one the clinic actually had. */
        Habituales: point.total - point.urgent,
        Urgentes: point.urgent,
      })),
    [points],
  );

  const summary = useMemo(() => {
    const total = points.reduce((sum, point) => sum + point.total, 0);
    const urgent = points.reduce((sum, point) => sum + point.urgent, 0);
    const peak = points.reduce<TrendPoint | null>(
      (best, point) => (best === null || point.total > best.total ? point : best),
      null,
    );
    return { total, urgent, peak, average: points.length > 0 ? total / points.length : 0 };
  }, [points]);

  return (
    <ChartCard
      className={LAYOUT.trend.span}
      height={LAYOUT.trend.height}
      title="Solicitudes recibidas"
      subtitle="Si sube varios días seguidos, abra más huecos antes de que la cola se acumule."
      status={chartStatus(outcome, summary.total === 0)}
      emptyMessage="No ha entrado ninguna solicitud en los últimos 14 días. La gráfica se dibujará con la primera que llegue."
      legend={
        <ChartLegend
          items={[
            {
              key: 'routine',
              label: 'Habituales',
              color: SERIES.routine,
              value: summary.total - summary.urgent,
            },
            { key: 'urgent', label: 'Urgentes', color: SERIES.urgent, value: summary.urgent },
          ]}
        />
      }
      footnote={
        summary.peak
          ? `Media de ${decimal.format(summary.average)} al día · máximo de ${summary.peak.total} el ${summary.peak.label}.`
          : null
      }
    >
      {({ narrow }) => (
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: narrow ? -24 : -6 }}>
          <defs>
            <linearGradient id={`${gradientId}-routine`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.routine} stopOpacity={0.34} />
              <stop offset="100%" stopColor={SERIES.routine} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id={`${gradientId}-urgent`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.urgent} stopOpacity={0.42} />
              <stop offset="100%" stopColor={SERIES.urgent} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* Horizontal only, and dashed: a gridline is a ruler, not part of
              the picture. Vertical rules on a fourteen-point axis add fourteen
              more lines for the reader to look past. */}
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="2 6" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={narrow ? 30 : 14}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={narrow ? 28 : 36}
            label={
              narrow
                ? undefined
                : {
                    value: 'Solicitudes',
                    angle: -90,
                    position: 'insideLeft' as const,
                    offset: 14,
                    fill: 'oklch(var(--ink-faint))',
                    fontSize: 10.5,
                  }
            }
          />
          <Tooltip
            content={<ChartTooltip showTotal />}
            cursor={{ stroke: GRID_STROKE, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="Habituales"
            stackId="citas"
            stroke={SERIES.routine}
            strokeWidth={2}
            fill={`url(#${gradientId}-routine)`}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
            isAnimationActive={animation}
            animationDuration={ENTRANCE_MS}
          />
          <Area
            type="monotone"
            dataKey="Urgentes"
            stackId="citas"
            stroke={SERIES.urgent}
            strokeWidth={2}
            fill={`url(#${gradientId}-urgent)`}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
            isAnimationActive={animation}
            animationDuration={ENTRANCE_MS}
          />
        </AreaChart>
      )}
    </ChartCard>
  );
}

/* ============================================================================
   2 — Antigüedad de la cola (columnas apiladas)
   ========================================================================== */

const NO_WAITS: WaitBucket[] = [];

function WaitsChart({
  outcome,
  animation,
}: {
  outcome: QueryOutcome<WaitBucket[]>;
  animation: Animation;
}) {
  const buckets = outcome.ok ? outcome.data : NO_WAITS;

  const data = useMemo(
    () =>
      buckets.map((bucket) => ({
        label: WAIT_AXIS_LABEL[bucket.key],
        Urgentes: bucket.urgent,
        Habituales: bucket.total - bucket.urgent,
      })),
    [buckets],
  );

  const pending = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
  const urgent = buckets.reduce((sum, bucket) => sum + bucket.urgent, 0);
  const oldest = buckets.find((bucket) => bucket.key === 'over7d');

  return (
    <ChartCard
      className={LAYOUT.waits.span}
      height={LAYOUT.waits.height}
      title="Antigüedad de la cola"
      subtitle="Empiece por la derecha: son quienes llevan más tiempo esperando una respuesta."
      status={chartStatus(outcome, pending === 0)}
      emptyMessage="No hay ninguna solicitud pendiente. Todo lo recibido está confirmado, completado o cancelado."
      legend={
        <ChartLegend
          items={[
            { key: 'urgent', label: 'Urgentes', color: SERIES.urgent, value: urgent },
            {
              key: 'routine',
              label: 'Resto de pendientes',
              color: SERIES.routine,
              value: pending - urgent,
            },
          ]}
        />
      }
      footnote={
        oldest && oldest.total > 0
          ? `${oldest.total} ${plural(oldest.total, 'solicitud lleva', 'solicitudes llevan')} más de 7 días esperando` +
            (oldest.urgent > 0
              ? ` · ${oldest.urgent} ${plural(oldest.urgent, 'urgente', 'urgentes')}.`
              : '.')
          : 'Ninguna solicitud lleva más de 7 días esperando.'
      }
    >
      {({ narrow }) => (
        <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: narrow ? -24 : -6 }}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="2 6" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={narrow ? 28 : 36}
            label={
              narrow
                ? undefined
                : {
                    value: 'Pendientes',
                    angle: -90,
                    position: 'insideLeft' as const,
                    offset: 14,
                    fill: 'oklch(var(--ink-faint))',
                    fontSize: 10.5,
                  }
            }
          />
          <Tooltip
            content={<ChartTooltip showTotal />}
            cursor={{ fill: 'oklch(var(--canvas-sunk))' }}
            isAnimationActive={false}
          />
          {/* Urgent sits AT the axis rather than on top of the stack, so its
              height can be compared straight across the four buckets instead
              of floating on a different baseline in each one. */}
          <Bar
            dataKey="Urgentes"
            stackId="espera"
            fill={SERIES.urgent}
            isAnimationActive={animation}
            animationDuration={ENTRANCE_MS}
          />
          <Bar
            dataKey="Habituales"
            stackId="espera"
            fill={SERIES.routine}
            radius={[5, 5, 0, 0]}
            isAnimationActive={animation}
            animationDuration={ENTRANCE_MS}
          />
        </BarChart>
      )}
    </ChartCard>
  );
}

/* ============================================================================
   3 — Servicios más solicitados (barras horizontales)
   ========================================================================== */

const NO_SERVICES: ServiceDemand[] = [];

function ServicesChart({
  outcome,
  animation,
}: {
  outcome: QueryOutcome<ServiceDemand[]>;
  animation: Animation;
}) {
  const services = outcome.ok ? outcome.data : NO_SERVICES;

  const data = useMemo(
    () => services.map((entry) => ({ service: entry.service, Solicitudes: entry.total })),
    [services],
  );

  const counted = services.reduce((sum, entry) => sum + entry.total, 0);
  const top = services[0];

  return (
    <ChartCard
      className={LAYOUT.services.span}
      height={LAYOUT.services.height}
      title="Servicios más solicitados"
      subtitle="Ajuste agenda, material y formación a lo que los pacientes piden de verdad."
      status={chartStatus(outcome, counted === 0)}
      emptyMessage="Todavía no se ha registrado ninguna solicitud, así que no hay servicios que ordenar."
      footnote={
        top ? `«${top.service}» concentra el ${share(top.total, counted)} de la demanda registrada.` : null
      }
    >
      {({ narrow }) => (
        /* `layout="vertical"` is what recharts calls horizontal BARS — a
           numeric X axis against a category Y axis. The chart this replaces
           supplied exactly these axes on the DEFAULT layout, a combination
           recharts resolves by drawing no bars at all, and it had been
           rendering a correctly-labelled empty frame since the day it was
           written.

           No grid and no numeric axis here: each bar carries its own value at
           the tip, which is both more precise than reading against a ruler and
           the only version that still fits a 296px card. */
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="service"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={narrow ? 96 : 136}
            tickFormatter={(value: string) => truncate(value, narrow ? 14 : 21)}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'oklch(var(--canvas-sunk))' }}
            isAnimationActive={false}
          />
          <Bar
            dataKey="Solicitudes"
            fill={SERIES.routine}
            radius={[0, 5, 5, 0]}
            barSize={narrow ? 14 : 18}
            isAnimationActive={animation}
            animationDuration={ENTRANCE_MS}
          >
            <LabelList
              dataKey="Solicitudes"
              position="right"
              offset={8}
              fill="oklch(var(--ink-soft))"
              fontSize={11}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      )}
    </ChartCard>
  );
}

/* ============================================================================
   4 — Franja horaria preferida (donut)
   ========================================================================== */

const NO_SLICES: TimePreferenceSlice[] = [];

function TimeOfDayChart({
  outcome,
  animation,
}: {
  outcome: QueryOutcome<TimePreferenceSlice[]>;
  animation: Animation;
}) {
  const slices = outcome.ok ? outcome.data : NO_SLICES;
  const total = slices.reduce((sum, slice) => sum + slice.total, 0);

  return (
    <ChartCard
      className={LAYOUT.timeOfDay.span}
      height={LAYOUT.timeOfDay.height}
      title="Franja horaria preferida"
      subtitle="Reparta el personal entre mañana y tarde según lo que se pide, no según la costumbre."
      status={chartStatus(outcome, total === 0)}
      emptyMessage="Aún no hay solicitudes registradas; la franja se calcula sobre las citas recibidas."
      overlay={
        <div className="text-center">
          <p className="tabular font-heading text-[1.65rem] leading-none text-ink">{total}</p>
          <p className="mt-1 text-[0.7rem] uppercase tracking-[0.08em] text-ink-faint">
            {plural(total, 'solicitud', 'solicitudes')}
          </p>
        </div>
      }
      legend={
        <ChartLegend
          items={slices.map((slice) => ({
            key: slice.key,
            label: slice.label,
            color: TIME_COLOR[slice.key],
            value: slice.total,
            share: share(slice.total, total),
          }))}
        />
      }
      /* The distinction the query goes out of its way to preserve, restated
         where the reader is: folding "sin indicar" into "cualquiera" turns
         silence into consent and overstates how much of the afternoon the
         clinic can actually fill. */
      footnote="«Sin indicar» son pacientes que no eligieron franja; no son pacientes flexibles."
    >
      {() => (
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Tooltip content={<ChartTooltip />} isAnimationActive={false} />
          <Pie
            data={slices}
            dataKey="total"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="86%"
            paddingAngle={1.5}
            stroke={SURFACE}
            strokeWidth={2}
            isAnimationActive={animation}
            animationDuration={ENTRANCE_MS}
            /* Recharts defaults a Pie to a 400ms delay before it starts, which
               on this grid reads as the donut having failed to load while the
               other five are already drawn. */
            animationBegin={0}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={TIME_COLOR[slice.key]} />
            ))}
          </Pie>
        </PieChart>
      )}
    </ChartCard>
  );
}

/* ============================================================================
   5 — Reparto por día de la semana (radar)
   ========================================================================== */

const NO_WEEKDAYS: WeekdayPoint[] = [];

function WeekdayChart({
  outcome,
  animation,
}: {
  outcome: QueryOutcome<WeekdayPoint[]>;
  animation: Animation;
}) {
  const days = outcome.ok ? outcome.data : NO_WEEKDAYS;
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const peak = days.reduce<WeekdayPoint | null>(
    (best, day) => (best === null || day.total > best.total ? day : best),
    null,
  );

  return (
    <ChartCard
      className={LAYOUT.weekday.span}
      height={LAYOUT.weekday.height}
      title="Reparto por día de la semana"
      subtitle="Refuerce la recepción los días en que entran más solicitudes."
      status={chartStatus(outcome, total === 0)}
      emptyMessage="Aún no hay solicitudes suficientes para repartirlas por día de la semana."
      footnote={
        peak && peak.total > 0
          ? `El ${WEEKDAY_NAME[peak.key]} concentra el ${share(peak.total, total)} de las solicitudes recibidas.`
          : null
      }
    >
      {() => (
        /* A radar rather than seven columns because the week is a CYCLE: a bar
           chart cuts it between Sunday and Monday, which hides that a clinic
           closed at weekends has one continuous Friday-to-Monday shape rather
           than two unrelated ends. Exact values are read from the tooltip and
           from the footnote, so the polygon only has to carry the pattern. */
        <RadarChart data={days} outerRadius="70%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke={GRID_STROKE} strokeDasharray="2 6" />
          <PolarAngleAxis dataKey="label" tick={AXIS_TICK} />
          {/* The radial ticks would be a second set of numbers over the top of
              the polygon and are not what this chart is read for. */}
          <PolarRadiusAxis tick={false} axisLine={false} tickCount={4} />
          <Tooltip content={<ChartTooltip />} isAnimationActive={false} />
          <Radar
            name="Solicitudes"
            dataKey="total"
            stroke={SERIES.accent}
            strokeWidth={2}
            fill={SERIES.accent}
            fillOpacity={0.24}
            dot={{ r: 2.5, fill: SERIES.accent, strokeWidth: 0 }}
            isAnimationActive={animation}
            animationDuration={ENTRANCE_MS}
          />
        </RadarChart>
      )}
    </ChartCard>
  );
}

/* ============================================================================
   6 — Estado del libro de citas (una barra segmentada)
   ========================================================================== */

const NO_STAGES: FunnelStage[] = [];

function FunnelChart({
  outcome,
  animation,
}: {
  outcome: QueryOutcome<FunnelStage[]>;
  animation: Animation;
}) {
  const stages = outcome.ok ? outcome.data : NO_STAGES;
  const total = stages.reduce((sum, stage) => sum + stage.total, 0);

  /* One datum with a key per stage: this is a single bar of the whole
     appointment book, not four bars to be compared. The composition is the
     answer — "where do requests stop moving?" is a question about proportion,
     and four separate columns invite the reader to rank four numbers that are
     stages of one process. */
  const data = useMemo(
    () => [
      stages.reduce<Record<string, number | string>>(
        (accumulator, stage) => {
          accumulator[stage.label] = stage.total;
          return accumulator;
        },
        { name: 'libro' },
      ),
    ],
    [stages],
  );

  const pending = stages.find((stage) => stage.key === 'pending');

  return (
    <ChartCard
      className={LAYOUT.funnel.span}
      height={LAYOUT.funnel.height}
      shortSkeleton
      title="Estado del libro de citas"
      subtitle="Si «Pendientes» ocupa la mayor parte de la barra, el atasco está en responder, no en atender."
      status={chartStatus(outcome, total === 0)}
      emptyMessage="El libro de citas está vacío: no hay ninguna solicitud registrada."
      legend={
        <ChartLegend
          items={stages.map((stage) => ({
            key: stage.key,
            label: stage.label,
            color: FUNNEL_COLOR[stage.key],
            value: stage.total,
            share: share(stage.total, total),
            /* The same icon the badge in the appointments table carries, so
               the segments are identified by a mark the reader already learned
               upstairs rather than by four steps of the chart ramp. */
            icon: APPOINTMENT_STATUS_META[stage.key].icon,
          }))}
        />
      }
      footnote={
        pending
          ? `El ${share(pending.total, total)} del libro sigue sin respuesta: ${pending.total} de ${total}.`
          : null
      }
    >
      {() => (
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip content={<ChartTooltip showTotal />} cursor={false} isAnimationActive={false} />
          {stages
            /* A stage with nothing in it is dropped from the PLOT but kept in
               the legend, where its zero is still stated. Drawing it would
               leave a zero-width rectangle wearing a 2px stroke — a sliver
               that reads as a real, tiny segment. */
            .filter((stage) => stage.total > 0)
            .map((stage) => (
              <Bar
                key={stage.key}
                dataKey={stage.label}
                stackId="libro"
                fill={FUNNEL_COLOR[stage.key]}
                stroke={SURFACE}
                strokeWidth={2}
                radius={4}
                barSize={34}
                isAnimationActive={animation}
                animationDuration={ENTRANCE_MS}
              />
            ))}
        </BarChart>
      )}
    </ChartCard>
  );
}

/* ============================================================================
   The grid
   ========================================================================== */

export interface DashboardChartsProps {
  trend: QueryOutcome<TrendPoint[]>;
  waits: QueryOutcome<WaitBucket[]>;
  services: QueryOutcome<ServiceDemand[]>;
  timeOfDay: QueryOutcome<TimePreferenceSlice[]>;
  weekdays: QueryOutcome<WeekdayPoint[]>;
  funnel: QueryOutcome<FunnelStage[]>;
}

export function DashboardCharts(props: DashboardChartsProps) {
  /* One flag for all six. Six independent timers would let the grid settle at
     six different moments, and the whole point of an entrance is that the
     panel arrives as one thing. */
  const animation = useEntranceAnimation();

  return (
    <section aria-labelledby="demanda-heading" className="space-y-4">
      <header>
        <h2 id="demanda-heading" className="font-heading text-h4 text-ink">
          Cómo se comporta la demanda
        </h2>
        <p className="mt-1 max-w-measure text-small text-ink-soft">
          Todo lo de abajo se calcula sobre las tablas completas, no sobre las filas que se ven en
          pantalla.
        </p>
      </header>

      {/* One column until 768px. At 360px each card gets the full 296px of
          usable width, every legend wraps rather than clipping, each plot is
          measured before it draws, and nothing scrolls sideways. */}
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <TrendChart outcome={props.trend} animation={animation} />
        <WaitsChart outcome={props.waits} animation={animation} />
        <ServicesChart outcome={props.services} animation={animation} />
        <TimeOfDayChart outcome={props.timeOfDay} animation={animation} />
        <WeekdayChart outcome={props.weekdays} animation={animation} />
        <FunnelChart outcome={props.funnel} animation={animation} />
      </div>
    </section>
  );
}

/**
 * The grid, at the size it is about to be, while the six aggregates are in
 * flight.
 *
 * Built from the same `LAYOUT` table as the charts themselves so the two
 * cannot drift apart: a fallback of the wrong height makes the page leap the
 * moment the queries land, which is exactly the jump a skeleton exists to
 * absorb.
 */
export function DashboardChartsSkeleton() {
  return (
    <section className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Cargando las gráficas del panel</span>
      <div className="space-y-2">
        <div className="skeleton h-6 w-64 max-w-full" />
        <div className="skeleton h-3 w-96 max-w-full" />
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        {Object.entries(LAYOUT).map(([key, card]) => (
          <div
            key={key}
            className={cn(
              'flex min-w-0 flex-col rounded-xl border border-line bg-surface p-4 shadow-e1 sm:p-5',
              card.span,
            )}
          >
            <div className="skeleton h-5 w-2/5" />
            <div className="skeleton mt-2 h-3 w-4/5" />
            <div className="skeleton mt-4 rounded-lg" style={{ height: card.height }} />
            {card.legend && <div className="skeleton mt-3 h-3 w-1/2" />}
            {/* Every card carries a footnote line under its plot, legend or
                not, so the fallback reserves one too. */}
            <div className="skeleton mt-3 h-3 w-3/5" />
          </div>
        ))}
      </div>
    </section>
  );
}
