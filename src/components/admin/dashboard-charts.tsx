'use client';

import { useMemo, type ReactElement } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ServiceDemand, TrendPoint } from '@/app/(admin)/admin/_lib/queries';

/* ============================================================================
   TWO CHARTS, BOTH ABOUT DEMAND
   ----------------------------------------------------------------------------
   What was here before was five: three donuts of a status split the stat cards
   already stated in words, and two bar charts — one of which had a numeric
   X axis against a category Y axis on a horizontal layout, a contradiction
   recharts resolves by drawing no bars at all. It had been rendering an empty
   axis frame with correct labels since the day it was written.

   Worse, all five were computed in the browser from the ten rows the dashboard
   had fetched. "Citas por estado" over the last ten submissions is not a
   distribution, it is a rounding error with a legend. Everything below is
   aggregated in Postgres over the whole table (see queries.ts) and arrives as
   at most nineteen numbers.

   Colours come from --chart-1..5 through `oklch(var(--chart-n))`. CSS custom
   properties resolve inside SVG presentation attributes, so the series follow
   the theme — light, dark, and whatever the palette becomes next — without a
   single literal in this file and without reading computed styles at runtime.

   `isAnimationActive={false}` throughout. Recharts animates by recomputing path
   geometry on every frame in JavaScript, which is layout work on the main
   thread rather than a compositor transform; on a dashboard that redraws after
   every mutation it is a stutter for no information.
   ========================================================================== */

const SERIES = {
  routine: 'oklch(var(--chart-1))',
  urgent: 'oklch(var(--chart-4))',
  service: 'oklch(var(--chart-3))',
} as const;

const AXIS_TICK = { fill: 'oklch(var(--ink-faint))', fontSize: 11 } as const;

function ChartFrame({
  title,
  description,
  empty,
  emptyMessage,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  emptyMessage: string;
  children: ReactElement;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-e1">
      <h2 className="font-heading text-h4 text-ink">{title}</h2>
      <p className="mt-1 text-small text-ink-soft">{description}</p>

      <div className="mt-4">
        {empty ? (
          <p className="flex h-[200px] items-center justify-center rounded-lg bg-canvas-sunk px-4 text-center text-small text-ink-faint">
            {emptyMessage}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

/** Tooltip styled with the same tokens as the rest of the panel. Recharts'
 *  default is a white box with a grey border, which is a different product in
 *  dark mode. */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-line bg-surface-raised px-3 py-2 shadow-e2">
      <p className="text-small font-medium text-ink">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="tabular text-small text-ink-soft">
          <span
            aria-hidden="true"
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({
  trend,
  services,
}: {
  trend: TrendPoint[];
  services: ServiceDemand[];
}) {
  /* The urgent count is a subset of the total, so the routine bar is the
     difference. Stacking `urgent` on `total` would draw a column twice as tall
     as the day's real volume. */
  const trendData = useMemo(
    () =>
      trend.map((point) => ({
        label: point.label,
        Habituales: point.total - point.urgent,
        Urgentes: point.urgent,
      })),
    [trend],
  );

  const trendEmpty = trend.every((point) => point.total === 0);

  const serviceData = useMemo(
    () =>
      services.map((entry) => ({
        /* Recharts renders a category tick as a single line, so a long service
           name would be clipped by the axis width rather than wrapped. */
        name: entry.service.length > 22 ? `${entry.service.slice(0, 21)}…` : entry.service,
        full: entry.service,
        Solicitudes: entry.total,
      })),
    [services],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartFrame
        title="Solicitudes de cita"
        description="Últimos 14 días, en hora de la clínica. Las urgentes se muestran aparte."
        empty={trendEmpty}
        emptyMessage="No se han recibido solicitudes de cita en los últimos 14 días."
      >
        <BarChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="oklch(var(--line))" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(var(--canvas-sunk))' }} />
          <Bar
            dataKey="Habituales"
            stackId="citas"
            fill={SERIES.routine}
            isAnimationActive={false}
          />
          <Bar
            dataKey="Urgentes"
            stackId="citas"
            fill={SERIES.urgent}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartFrame>

      <ChartFrame
        title="Servicios más solicitados"
        description="Sobre el total histórico de solicitudes, no sobre la página que se está viendo."
        empty={serviceData.length === 0}
        emptyMessage="Todavía no hay solicitudes de cita registradas."
      >
        {/* `layout="vertical"` is what recharts calls horizontal BARS: a
            numeric X axis and a category Y axis. The chart this replaces
            supplied exactly these axes on the default horizontal layout and so
            drew nothing at all. */}
        <BarChart
          data={serviceData}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="oklch(var(--line))" strokeDasharray="3 3" />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'oklch(var(--canvas-sunk))' }} />
          <Bar dataKey="Solicitudes" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {serviceData.map((entry) => (
              <Cell key={entry.full} fill={SERIES.service} />
            ))}
          </Bar>
        </BarChart>
      </ChartFrame>
    </div>
  );
}
