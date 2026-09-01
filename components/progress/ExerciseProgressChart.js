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

function formatShortDate(iso) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-hair bg-deep px-3 py-2 text-xs shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
      <p className="font-semibold text-text">{formatShortDate(point.finishedAt)}</p>
      <p className="mt-1 text-faint">
        Mejor serie: <span className="font-mono-digit text-white">{point.weight}kg × {point.reps}</span>
      </p>
      <p className="mt-0.5 text-teal2">
        1RM est. <span className="font-mono-digit">{point.estimatedOneRepMax.toFixed(1)}kg</span>
      </p>
    </div>
  );
}

export default function ExerciseProgressChart({ points }) {
  if (points.length < 2) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[22px] border border-dashed border-hair bg-glass p-6 text-center">
        <p className="text-sm font-medium text-text">
          {points.length === 0 ? "Todavía no registraste series de este ejercicio." : "Necesitás al menos 2 sesiones para ver la curva."}
        </p>
        <p className="mt-1 text-xs text-faint">
          Se completa cada vez que terminás un entrenamiento con este ejercicio.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full rounded-[22px] border border-hair bg-glass p-4 lg:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--hair)" strokeDasharray="3 5" />
          <XAxis
            dataKey="finishedAt"
            tickFormatter={formatShortDate}
            stroke="transparent"
            tick={{ fill: "var(--faint)", fontSize: 11 }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "var(--faint)", fontSize: 11 }}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}kg`}
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--hair)", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="estimatedOneRepMax"
            stroke="var(--teal2)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--teal2)", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "var(--teal2)", stroke: "var(--deep)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
