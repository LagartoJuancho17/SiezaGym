"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function ProgresoContent({
  isCoach,
  students,
  userName,
  keyLifts = [],
  exerciseSummaries = [],
  totalSessions = 0,
  lastSession = null,
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
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard label="Sesiones" value={totalSessions} unit="registradas">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#FF5733]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </StatCard>
            <StatCard label="Ejercicios" value={exerciseSummaries.length + keyLifts.filter((k) => k.timesPerformed > 0).length} unit="trackeados">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#FF5733]">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </StatCard>
            <StatCard
              label="Última sesión"
              value={lastSession ? formatShortDate(lastSession.finishedAt) : "—"}
              unit="último entrenamiento"
              accent
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              </svg>
            </StatCard>
          </div>

          {keyLifts.length > 0 && (
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5 2.3-7.2-6-4.6h7.6z" />
                </svg>
                Levantamientos clave
              </p>
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
                {keyLifts.map((lift) => (
                  <Link
                    key={lift.exerciseId}
                    href={`/progreso/${lift.exerciseId}`}
                    className="flex flex-col justify-between gap-2 rounded-2xl border border-[#6B1717] bg-[#EDE8E1] p-3.5 shadow-sm transition hover:shadow-md"
                  >
                    <p className="truncate text-xs font-bold text-[#141414]">{lift.nameEs}</p>
                    <div>
                      <p className="font-sans text-xl font-extrabold text-[#FF5733]">
                        {lift.maxWeightKg > 0 ? `${lift.maxWeightKg}kg` : "—"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#756C65]">
                        {lift.timesPerformed > 0 ? "peso máximo" : "sin registros"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {exerciseSummaries.length === 0 && keyLifts.every((k) => k.timesPerformed === 0) ? (
            <section className="relative overflow-hidden rounded-3xl border border-[#6B1717] bg-[#EDE8E1] px-6 py-7 shadow-sm text-center sm:text-left">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#FF5733]">
                Todavía no hay datos
              </p>
              <h2 className="font-sans mt-2 text-2xl font-extrabold tracking-tight text-[#141414]">
                Entrená para ver tu progreso acá
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#756C65] max-w-md">
                Terminá un entrenamiento desde una rutina y el peso máximo de cada ejercicio empieza a graficarse solo.
              </p>
              <Link
                href="/rutinas"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#FF5733] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#E84D29]"
              >
                Ir a mis rutinas
              </Link>
            </section>
          ) : exerciseSummaries.length > 0 ? (
            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
                Por ejercicio
              </p>
              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
                {exerciseSummaries.map((summary) => (
                  <Link
                    key={summary.exerciseId}
                    href={`/progreso/${summary.exerciseId}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#6B1717] bg-[#EDE8E1] px-4 py-3.5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#141414]">{summary.nameEs}</p>
                      <p className="mt-0.5 text-xs text-[#756C65]">
                        {summary.timesPerformed}{" "}
                        {summary.timesPerformed === 1 ? "sesión" : "sesiones"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-sans text-base font-extrabold text-[#FF5733]">
                        {summary.maxWeightKg > 0 ? `${summary.maxWeightKg}kg` : "—"}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#8C827A]"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
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
