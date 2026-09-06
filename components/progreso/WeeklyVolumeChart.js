"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function formatWeekLabel(weekStartKey) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(`${weekStartKey}T12:00:00`),
  );
}

function formatVolume(kg) {
  if (kg >= 10000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-hair bg-deep px-3 py-2 text-xs shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
      <p className="font-semibold text-text">Semana del {formatWeekLabel(point.weekStartKey)}</p>
      <p className="mt-0.5 text-teal2">
        <span className="font-mono-digit">{formatVolume(point.totalVolumeKg)}</span> levantados
      </p>
    </div>
  );
}

export default function WeeklyVolumeChart({ points = [] }) {
  const hasData = points.some((p) => p.totalVolumeKg > 0);

  if (!hasData) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[22px] border border-dashed border-hair bg-glass p-6 text-center">
        <p className="text-sm font-medium text-text">Todavía no hay volumen registrado.</p>
        <p className="mt-1 text-xs text-faint">
          El volumen de cada semana se grafica solo al terminar tus entrenamientos.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Volumen levantado por semana">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
          Volumen semanal
        </p>
        <p className="text-[11px] text-faint">últimas {points.length} semanas</p>
      </div>
      <div className="h-[220px] w-full rounded-[22px] border border-hair bg-glass p-4 lg:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--hair)" strokeDasharray="3 5" />
            <XAxis
              dataKey="weekStartKey"
              tickFormatter={formatWeekLabel}
              stroke="transparent"
              tick={{ fill: "var(--faint)", fontSize: 11 }}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "var(--faint)", fontSize: 11 }}
              tickLine={false}
              width={48}
              tickFormatter={formatVolume}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--hair)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="totalVolumeKg"
              stroke="var(--teal2)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--teal2)", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "var(--teal2)", stroke: "var(--deep)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
