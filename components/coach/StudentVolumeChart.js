"use client";

import "./coach-design2.css";

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
    <div className="d2-glass-strong d2-coach-tooltip">
      <p className="d2-student-name">{formatShortDate(point.finishedAt)}</p>
      <p className="d2-student-mail">{point.routineName || "Sesión libre"}</p>
      <p className="d2-coach-muted">
        <span className="font-mono-digit">{point.totalVolumeKg}kg</span> de volumen
      </p>
    </div>
  );
}

export default function StudentVolumeChart({ points }) {
  if (points.length < 2) {
    return (
      <div className="d2-glass d2-empty">
        <p className="d2-coach-muted">
          {points.length === 0
            ? "Todavía no tiene sesiones registradas."
            : "Necesita al menos 2 sesiones para ver la curva."}
        </p>
      </div>
    );
  }

  return (
    <div className="d2-glass d2-coach-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--d2-border)" strokeDasharray="3 5" />
          <XAxis
            dataKey="finishedAt"
            tickFormatter={formatShortDate}
            stroke="transparent"
            tick={{ fill: "var(--d2-text-2)", fontSize: 11 }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "var(--d2-text-2)", fontSize: 11 }}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}kg`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--d2-border)", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="totalVolumeKg"
            stroke="var(--d2-text)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--d2-text)", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "var(--d2-text)", stroke: "var(--d2-bg-c)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
