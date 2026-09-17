"use client";

import "./progress-design2.css";

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
    <div className="d2-glass d2-progress-tooltip">
      <p className="d2-session-exercise-name">{formatShortDate(point.finishedAt)}</p>
      <p className="d2-routine-meta">
        Mejor serie: <span className="d2-session-set-value">{point.weight}kg × {point.reps}</span>
      </p>
      <p className="d2-routine-meta">
        1RM est. <span className="d2-session-set-value">{point.estimatedOneRepMax.toFixed(1)}kg</span>
      </p>
    </div>
  );
}

export default function ExerciseProgressChart({ points }) {
  if (points.length < 2) {
    return (
      <div className="d2-glass d2-empty d2-progress-empty">
        <p className="d2-session-exercise-name">
          {points.length === 0 ? "Todavía no registraste series de este ejercicio." : "Necesitás al menos 2 sesiones para ver la curva."}
        </p>
        <p className="d2-routine-meta">
          Se completa cada vez que terminás un entrenamiento con este ejercicio.
        </p>
      </div>
    );
  }

  return (
    <div className="d2-glass d2-progress-chart" role="img" aria-label="Evolución del máximo de una repetición estimado en kilogramos. Los valores de cada sesión están en el historial debajo.">
      <ResponsiveContainer width="100%" height="100%">
        {/* Sin margen negativo a la izquierda: corría el gráfico y recortaba los
            números del eje, que quedaban en "kg" a secas. */}
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--d2-border)" strokeDasharray="3 5" />
          <XAxis
            dataKey="finishedAt"
            tickFormatter={formatShortDate}
            axisLine={false}
            tick={{ fill: "var(--d2-text-3)", fontSize: 11 }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "var(--d2-text-3)", fontSize: 11 }}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `${v}kg`}
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--d2-border)", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="estimatedOneRepMax"
            stroke="var(--d2-text)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--d2-text)", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "var(--d2-text)", stroke: "var(--d2-ring-core)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
