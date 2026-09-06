"use client";

import Link from "next/link";
import { useState } from "react";
import ActivityHeatmap from "./ActivityHeatmap";
import WeeklyVolumeChart from "./WeeklyVolumeChart";

function StatCard({ label, value, unit, accent, children }) {
  return (
    <section
      aria-label={label}
      className={`flex min-h-[132px] flex-col justify-between rounded-2xl border border-[#6B1717] p-4 shadow-sm transition ${
        accent
          ? "bg-gradient-to-br from-[#FF5733] to-[#C2280C] text-white shadow-md"
          : "bg-[#EDE8E1] text-[#141414]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[13px] font-bold ${accent ? "text-white/90" : "text-[#6E665E]"}`}>
          {label}
        </span>
        {children}
      </div>
      <div>
        <div className={`font-sans text-2xl font-extrabold tracking-tight ${accent ? "text-white" : "text-[#141414]"}`}>
          {value}
        </div>
        <p className={`mt-1 text-[11px] font-medium ${accent ? "text-white/80" : "text-[#756C65]"}`}>
          {unit}
        </p>
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
    <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-4 pt-20 pb-28 sm:px-8 sm:pt-24 md:pb-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
          Progreso
        </p>
        <h1 className="font-sans mt-0.5 text-3xl font-extrabold tracking-tight text-white">
          {view === "own" ? "Tu fuerza en el tiempo" : "Tus alumnos"}
        </h1>
      </header>

      {isCoach && (
        <div className="flex rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setView("students")}
            className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
              view === "students"
                ? "bg-white text-[#141414] shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            Mis alumnos
          </button>
          <button
            type="button"
            onClick={() => setView("own")}
            className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
              view === "own"
                ? "bg-white text-[#141414] shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            Mis estadísticas
          </button>
        </div>
      )}

      {view === "own" ? (
        <>
          <section aria-label="Esta semana">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
              Esta semana
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard
                label="Volumen"
                value={formatVolumeKg(weeklyStats.volumeKg)}
                unit="kg levantados esta semana"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#FF5733]">
                  <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
                </svg>
              </StatCard>
              <StatCard
                label="Sesiones"
                value={weeklyStats.sessionsThisWeek}
                unit={weeklyStats.sessionsThisWeek === 1 ? "entrenamiento" : "entrenamientos"}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#FF5733]">
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
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/80">
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
        /* Students view for Coaches */
        <div className="flex flex-col gap-3">
          {students?.length === 0 ? (
            <div className="rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-6 text-center shadow-sm">
              <p className="text-sm text-[#756C65]">Todavía no tenés alumnos asignados.</p>
            </div>
          ) : (
            students?.map((s) => (
              <div
                key={s.uid}
                className="flex items-center justify-between rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5733] text-sm font-bold text-white shadow-sm">
                    {(s.displayName || s.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#141414]">
                      {s.displayName || "Sin nombre"}
                    </p>
                    <p className="text-xs text-[#756C65]">{s.email}</p>
                  </div>
                </div>
                <Link
                  href={`/coach/alumnos/${s.uid}`}
                  className="rounded-full bg-[#141414] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#2A0608]"
                >
                  Ver progreso
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
