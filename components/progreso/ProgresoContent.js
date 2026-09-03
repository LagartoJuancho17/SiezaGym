"use client";

import Link from "next/link";
import { useState } from "react";
import ActivityHeatmap from "./ActivityHeatmap";
import WeeklyVolumeChart from "./WeeklyVolumeChart";

function StatCard({ label, value, unit, accent, children }) {
  return (
    <section
      aria-label={label}
      className={`flex min-h-[132px] flex-col justify-between rounded-[26px] border border-hair p-[15px] ${
        accent ? "relative overflow-hidden text-white" : "bg-glass"
      }`}
      style={
        accent
          ? { background: "linear-gradient(150deg, var(--teal) 0%, #1C5F6C 100%)" }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold tracking-[-0.01em]">{label}</span>
        {children}
      </div>
      <div>
        <div className={`font-mono-digit text-2xl tracking-wide ${accent ? "text-white" : ""}`}>
          {value}
        </div>
        <p className={`mt-2 text-[11px] ${accent ? "text-white/70" : "text-faint"}`}>{unit}</p>
      </div>
    </section>
  );
}

function formatShortDate(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(new Date(iso));
}

function formatVolumeKg(kg) {
  if (!kg) return "0";
  if (kg >= 10000) return `${(kg / 1000).toFixed(1)}t`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(2).replace(/\.?0+$/, "")}t`;
  return `${Math.round(kg)}`;
}

function formatEffectiveness(pct) {
  if (pct === null || pct === undefined) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

export default function ProgresoContent({
  isCoach,
  students,
  userName,
  weeklyStats = { volumeKg: 0, sessionsThisWeek: 0, effectivenessPct: null },
  trainedDates = [],
  volumeByWeek = [],
}) {
  const [view, setView] = useState(isCoach ? "students" : "own");

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px] md:pb-12 lg:px-0">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Progreso</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-none text-white">
          {view === "own" ? "Tu fuerza en el tiempo" : "Tus alumnos"}
        </h1>
      </header>

      {isCoach && (
        <div className="flex rounded-full border border-hair bg-glass p-1">
          <button
            type="button"
            onClick={() => setView("students")}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
              view === "students" ? "bg-teal text-onlight" : "text-faint hover:text-text"
            }`}
          >
            Mis alumnos
          </button>
          <button
            type="button"
            onClick={() => setView("own")}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
              view === "own" ? "bg-teal text-onlight" : "text-faint hover:text-text"
            }`}
          >
            Mis estadísticas
          </button>
        </div>
      )}

      {view === "own" ? (
        <>
          <section aria-label="Esta semana">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
              Esta semana
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard
                label="Volumen"
                value={formatVolumeKg(weeklyStats.volumeKg)}
                unit="kg levantados esta semana"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal2">
                  <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
                </svg>
              </StatCard>
              <StatCard
                label="Sesiones"
                value={weeklyStats.sessionsThisWeek}
                unit={weeklyStats.sessionsThisWeek === 1 ? "entrenamiento" : "entrenamientos"}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </StatCard>
              <StatCard
                label="Efectividad"
                value={formatEffectiveness(weeklyStats.effectivenessPct)}
                unit="vs semana anterior"
                accent
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/80">
                  {weeklyStats.effectivenessPct != null && weeklyStats.effectivenessPct < 0 ? (
                    <path d="M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6" />
                  ) : (
                    <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />
                  )}
                </svg>
              </StatCard>
            </div>
          </section>

          <WeeklyVolumeChart points={volumeByWeek} />

          <ActivityHeatmap trainedDates={trainedDates} />
        </>
      ) : (
        <div className="flex flex-col gap-2.5">
          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-hair p-8 text-center">
              <p className="text-sm text-faint">Todavía no tenés alumnos vinculados.</p>
            </div>
          ) : (
            students.map((student) => (
              <Link
                key={student.studentId}
                href={`/dashboard/coach/alumnos/${student.studentId}`}
                className="rounded-2xl border border-hair bg-glass p-4 transition hover:border-teal2/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/20 text-sm font-semibold text-teal2">
                    {(student.displayName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {student.displayName || "Sin nombre"}
                    </p>
                    {student.email && (
                      <p className="truncate text-xs text-faint">{student.email}</p>
                    )}
                  </div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-faint">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-hair/60 bg-black/10 px-3 py-2 text-center">
                    <p className="font-mono-digit text-lg font-semibold text-text">
                      {student.sessionsCount ?? 0}
                    </p>
                    <p className="text-[10px] text-faint">sesiones</p>
                  </div>
                  <div className="rounded-xl border border-hair/60 bg-black/10 px-3 py-2 text-center">
                    <p className="font-mono-digit text-sm font-semibold text-text">
                      {formatShortDate(student.lastSessionAt) || "—"}
                    </p>
                    <p className="text-[10px] text-faint">última sesión</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
