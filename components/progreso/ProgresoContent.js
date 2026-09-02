"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function ProgresoContent({
  isCoach,
  students,
  userName,
  exerciseSummaries = [],
  totalSessions = 0,
  lastSession = null,
  weekVolume = 0,
}) {
  const [view, setView] = useState(isCoach ? "students" : "own");

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px] lg:px-0">
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
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard label="Volumen semanal" value={`${weekVolume}kg`} unit="esta semana">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal2">
                <path d="M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10" />
              </svg>
            </StatCard>
            <StatCard label="Sesiones totales" value={totalSessions} unit="registradas">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </StatCard>
            <StatCard label="Ejercicios trackeados" value={exerciseSummaries.length} unit="distintos">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </StatCard>
            <StatCard
              label="Última sesión"
              value={
                lastSession
                  ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
                      new Date(lastSession.finishedAt),
                    )
                  : "—"
              }
              unit="último entrenamiento"
              accent
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/80">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              </svg>
            </StatCard>
          </div>

          {exerciseSummaries.length === 0 ? (
            <section className="relative overflow-hidden rounded-[30px] bg-deep px-[18px] py-[22px]">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/62">
                Todavía no hay datos
              </p>
              <h2 className="font-display mt-2.5 text-[28px] uppercase leading-[0.96] tracking-[0.005em] text-white">
                Entrená para ver
                <br />
                tu progreso acá
              </h2>
              <p className="mt-2.5 text-[12.5px] leading-[1.5] text-white/70">
                Terminá un entrenamiento desde una rutina y el 1RM estimado de cada ejercicio empieza
                a graficarse solo.
              </p>
              <Link
                href="/rutinas"
                className="mt-[18px] flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-semibold text-onlight transition hover:opacity-90 lg:w-auto lg:px-8"
              >
                Ir a mis rutinas
              </Link>
            </section>
          ) : (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
                Por ejercicio
              </p>
              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
                {exerciseSummaries.map((summary) => (
                  <Link
                    key={summary.exerciseId}
                    href={`/progreso/${summary.exerciseId}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-hair bg-glass px-4 py-3.5 transition hover:border-white/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{summary.nameEs}</p>
                      <p className="mt-0.5 text-xs text-faint">
                        {summary.timesPerformed}{" "}
                        {summary.timesPerformed === 1 ? "sesión" : "sesiones"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono-digit text-base text-teal2">
                        {summary.bestEstimatedOneRepMax > 0
                          ? `${summary.bestEstimatedOneRepMax.toFixed(1)}kg`
                          : "—"}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-faint"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2.5">
          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-hair p-8 text-center">
              <p className="text-sm text-faint">Todavía no tenés alumnos vinculados.</p>
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student.studentId}
                className="rounded-2xl border border-hair bg-glass p-4"
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
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-hair/60 bg-black/10 px-3 py-2 text-center">
                    <p className="font-mono-digit text-lg font-semibold text-faint">0</p>
                    <p className="text-[10px] text-faint">sesiones</p>
                  </div>
                  <div className="rounded-xl border border-hair/60 bg-black/10 px-3 py-2 text-center">
                    <p className="font-mono-digit text-lg font-semibold text-faint">0 kg</p>
                    <p className="text-[10px] text-faint">esta semana</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
