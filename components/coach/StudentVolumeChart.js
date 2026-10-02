"use client";

import { useState, useId } from "react";
import "./coach-design2.css";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const SPANISH_MUSCLE_LABELS = {
  pecho: "Pecho",
  dorsal: "Dorsal",
  espaldaAltaTrapecio: "Espalda alta / Trapecio",
  deltoideAnterior: "Hombro anterior",
  deltoideLateral: "Hombro lateral",
  deltoidePosterior: "Hombro posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebrazo: "Antebrazo",
  cuadriceps: "Cuádriceps",
  isquiotibiales: "Isquiotibiales",
  gluteo: "Glúteos",
  aductores: "Aductores",
  gemelo: "Gemelos",
  abdomen: "Abdomen / Core",
  lumbar: "Lumbar",
};

function formatShortDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

function formatDuration(totalSec) {
  const mins = Math.round((totalSec || 0) / 60);
  return mins < 1 ? "<1 min" : `${mins} min`;
}

function ChartTooltip({ active, payload, metric }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="d2-glass-strong d2-coach-tooltip">
      <p className="d2-student-name">{formatShortDate(point.finishedAt)}</p>
      <p className="d2-student-mail">{point.routineName || "Sesión libre"}</p>
      <div className="mt-1 flex flex-col gap-0.5 text-xs">
        {metric === "volume" && (
          <p className="font-semibold text-sm">
            <span className="font-mono-digit">{point.totalVolumeKg}kg</span> de volumen
          </p>
        )}
        {metric === "duration" && (
          <p className="font-semibold text-sm">
            {point.durationMins} min de sesión
          </p>
        )}
        {metric === "sets" && (
          <p className="font-semibold text-sm">
            {point.setsCount} series completadas
          </p>
        )}
        <p className="d2-coach-muted mt-0.5">
          {point.durationMins} min · {point.setsCount} series · {point.exercises?.length || 0} ejercicios
        </p>
      </div>
    </div>
  );
}

export default function StudentVolumeChart({ points = [], catalogExercises = [] }) {
  const [metric, setMetric] = useState("volume");
  const [range, setRange] = useState("all");
  const gradientId = useId().replace(/:/g, "_");

  if (points.length < 2) {
    return (
      <div className="d2-coach-stack">
        <div className="d2-glass d2-empty">
          <p className="d2-coach-muted">
            {points.length === 0
              ? "Todavía no tiene sesiones registradas."
              : "Necesita al menos 2 sesiones para ver la curva."}
          </p>
        </div>
        {points.length === 1 && (
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted mb-2 text-xs font-semibold uppercase tracking-wider">
              Resumen de la primera sesión
            </p>
            <div className="d2-chart-kpis mb-0">
              <div className="d2-chart-kpi-item">
                <span className="d2-chart-kpi-label">Volumen</span>
                <p className="d2-chart-kpi-value font-mono-digit">{points[0].totalVolumeKg}kg</p>
              </div>
              <div className="d2-chart-kpi-item">
                <span className="d2-chart-kpi-label">Duración</span>
                <p className="d2-chart-kpi-value font-mono-digit">
                  {formatDuration(points[0].durationSeconds)}
                </p>
              </div>
              <div className="d2-chart-kpi-item">
                <span className="d2-chart-kpi-label">Ejercicios</span>
                <p className="d2-chart-kpi-value font-mono-digit">
                  {points[0].exercises?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-calcular datos por punto
  const enrichedPoints = points.map((p) => {
    const durationMins = Math.round((p.durationSeconds || 0) / 60);
    const setsCount = (p.exercises || []).reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
    return {
      ...p,
      durationMins,
      setsCount,
    };
  });

  // Filtrado por rango
  let filteredPoints = enrichedPoints;
  if (range === "5") filteredPoints = enrichedPoints.slice(-5);
  else if (range === "10") filteredPoints = enrichedPoints.slice(-10);

  // KPIs agregados
  const totalVolume = enrichedPoints.reduce((acc, p) => acc + (p.totalVolumeKg || 0), 0);
  const avgVolume = Math.round(totalVolume / enrichedPoints.length);
  const maxVolume = Math.max(...enrichedPoints.map((p) => p.totalVolumeKg || 0), 0);
  const totalMinutes = enrichedPoints.reduce((acc, p) => acc + p.durationMins, 0);
  const avgDuration = Math.round(totalMinutes / enrichedPoints.length);

  // Distribución muscular
  const exerciseLookup = new Map((catalogExercises || []).map((e) => [e.id, e]));
  const muscleTotals = {};
  let totalMuscleWeightSum = 0;

  for (const session of points) {
    for (const ex of session.exercises || []) {
      const cat = exerciseLookup.get(ex.exerciseId);
      const setsCount = (ex.sets || []).length || 1;
      if (cat?.muscleWeights && Object.keys(cat.muscleWeights).length > 0) {
        for (const [mKey, weight] of Object.entries(cat.muscleWeights)) {
          const contrib = (Number(weight) || 0) * setsCount;
          muscleTotals[mKey] = (muscleTotals[mKey] || 0) + contrib;
          totalMuscleWeightSum += contrib;
        }
      } else {
        const fallbackGroup = cat?.pattern || "general";
        muscleTotals[fallbackGroup] = (muscleTotals[fallbackGroup] || 0) + setsCount;
        totalMuscleWeightSum += setsCount;
      }
    }
  }

  const muscleList = Object.entries(muscleTotals)
    .map(([key, val]) => ({
      key,
      label: SPANISH_MUSCLE_LABELS[key] || (key.charAt(0).toUpperCase() + key.slice(1)),
      value: Math.round(val),
      pct: totalMuscleWeightSum > 0 ? Math.round((val / totalMuscleWeightSum) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="d2-analytics-container">
      {/* KPIs Summary Bar */}
      <div className="d2-chart-kpis">
        <div className="d2-chart-kpi-item">
          <span className="d2-chart-kpi-label">Volumen Acumulado</span>
          <p className="d2-chart-kpi-value font-mono-digit">
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume}kg`}
          </p>
          <span className="d2-chart-kpi-sub font-mono-digit">{totalVolume.toLocaleString("es-AR")} kg</span>
        </div>
        <div className="d2-chart-kpi-item">
          <span className="d2-chart-kpi-label">Promedio / Sesión</span>
          <p className="d2-chart-kpi-value font-mono-digit">{avgVolume.toLocaleString("es-AR")}kg</p>
          <span className="d2-chart-kpi-sub">por entrenamiento</span>
        </div>
        <div className="d2-chart-kpi-item">
          <span className="d2-chart-kpi-label">Pico Máximo</span>
          <p className="d2-chart-kpi-value font-mono-digit">{maxVolume.toLocaleString("es-AR")}kg</p>
          <span className="d2-chart-kpi-sub">mayor sesión</span>
        </div>
        <div className="d2-chart-kpi-item">
          <span className="d2-chart-kpi-label">Duración Media</span>
          <p className="d2-chart-kpi-value font-mono-digit">{avgDuration} min</p>
          <span className="d2-chart-kpi-sub">{enrichedPoints.length} sesiones analizadas</span>
        </div>
      </div>

      {/* Chart Selector Header & Controls */}
      <div className="d2-chart-header">
        <div className="d2-chart-tabs" role="tablist" aria-label="Seleccionar métrica de progreso">
          <button
            type="button"
            role="tab"
            aria-selected={metric === "volume"}
            onClick={() => setMetric("volume")}
            className={`d2-chart-tab ${metric === "volume" ? "active" : ""}`}
          >
            Volumen (kg)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metric === "duration"}
            onClick={() => setMetric("duration")}
            className={`d2-chart-tab ${metric === "duration" ? "active" : ""}`}
          >
            Duración (min)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metric === "sets"}
            onClick={() => setMetric("sets")}
            className={`d2-chart-tab ${metric === "sets" ? "active" : ""}`}
          >
            Series
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metric === "muscles"}
            onClick={() => setMetric("muscles")}
            className={`d2-chart-tab ${metric === "muscles" ? "active" : ""}`}
          >
            Músculos
          </button>
        </div>

        {enrichedPoints.length > 5 && metric !== "muscles" && (
          <div className="flex items-center gap-1">
            {["5", "10", "all"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`d2-chart-tab text-[11px] py-1 px-2.5 ${range === r ? "active" : ""}`}
              >
                {r === "all" ? "Todas" : `Últimas ${r}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Canvas or Muscle Breakdown */}
      <div className="d2-glass d2-coach-chart">
        {metric === "volume" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredPoints} margin={{ top: 12, right: 10, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id={`chart_grad_${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--d2-text)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--d2-text)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
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
                width={44}
                tickFormatter={(v) => `${v}kg`}
              />
              <Tooltip
                content={<ChartTooltip metric="volume" />}
                cursor={{ stroke: "var(--d2-border)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="totalVolumeKg"
                stroke="var(--d2-text)"
                strokeWidth={2.2}
                fillOpacity={1}
                fill={`url(#chart_grad_${gradientId})`}
                dot={{ r: 4, fill: "var(--d2-text)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--d2-text)", stroke: "var(--d2-bg-c)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {metric === "duration" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredPoints} margin={{ top: 12, right: 10, left: -16, bottom: 0 }}>
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
                width={38}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip
                content={<ChartTooltip metric="duration" />}
                cursor={{ fill: "rgba(var(--d2-glass-tint), 0.06)" }}
              />
              <Bar
                dataKey="durationMins"
                fill="var(--d2-text)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {metric === "sets" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredPoints} margin={{ top: 12, right: 10, left: -16, bottom: 0 }}>
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
                width={34}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={<ChartTooltip metric="sets" />}
                cursor={{ fill: "rgba(var(--d2-glass-tint), 0.06)" }}
              />
              <Bar
                dataKey="setsCount"
                fill="var(--d2-text)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {metric === "muscles" && (
          <div className="h-full overflow-y-auto pr-1">
            <p className="d2-coach-muted mb-2 text-xs font-medium">
              Reparto de series y volumen según los ejercicios realizados
            </p>
            {muscleList.length === 0 ? (
              <p className="d2-coach-muted py-6 text-center text-xs">
                No hay suficientes datos musculares registrados.
              </p>
            ) : (
              <div className="d2-muscle-list">
                {muscleList.map((m) => (
                  <div key={m.key} className="d2-muscle-item">
                    <div className="d2-muscle-meta">
                      <span className="d2-muscle-name">{m.label}</span>
                      <span className="d2-muscle-stats font-mono-digit">
                        {m.value} series · {m.pct}%
                      </span>
                    </div>
                    <div className="d2-muscle-track">
                      <div
                        className="d2-muscle-fill"
                        style={{ width: `${Math.max(6, m.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
