"use client";

import { useState } from "react";

const PLACEHOLDER_CARDS = [
  {
    label: "Volumen semanal",
    value: "0",
    unit: "kg esta semana",
    icon: (
      <path d="M4 9v6M20 9v6M7 7v10M17 7v10M7 12h10" />
    ),
  },
  {
    label: "Sesiones",
    value: "0",
    unit: "este mes",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
  },
  {
    label: "Racha actual",
    value: "0",
    unit: "días seguidos",
    icon: (
      <>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </>
    ),
  },
  {
    label: "Objetivo semanal",
    value: "0%",
    unit: "completado",
    icon: (
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    ),
    accent: true,
  },
];

export default function ProgresoContent({ isCoach, students, userName }) {
  const [view, setView] = useState(isCoach ? "students" : "own");

  return (
    <div className="flex flex-col gap-5 px-[18px] pb-[100px]">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
          Progreso
        </p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-none">
          {view === "own"
            ? userName || "Tu progreso"
            : "Tus alumnos"}
        </h1>
      </header>

      {isCoach && (
        <div className="flex rounded-full border border-hair bg-glass p-1">
          <button
            type="button"
            onClick={() => setView("students")}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
              view === "students"
                ? "bg-teal text-onlight"
                : "text-faint hover:text-text"
            }`}
          >
            Mis alumnos
          </button>
          <button
            type="button"
            onClick={() => setView("own")}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
              view === "own"
                ? "bg-teal text-onlight"
                : "text-faint hover:text-text"
            }`}
          >
            Mis estadísticas
          </button>
        </div>
      )}

      {view === "own" ? (
        <div className="grid grid-cols-2 gap-2.5">
          {PLACEHOLDER_CARDS.map((card) => (
            <section
              key={card.label}
              aria-label={card.label}
              className={`flex min-h-[132px] flex-col justify-between rounded-[26px] border border-hair p-[15px] ${
                card.accent
                  ? "relative overflow-hidden text-white"
                  : "bg-glass"
              }`}
              style={
                card.accent
                  ? { background: "linear-gradient(150deg, var(--teal) 0%, #1C5F6C 100%)" }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold tracking-[-0.01em]">
                  {card.label}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 ${card.accent ? "text-white/80" : "text-teal2"}`}
                >
                  {card.icon}
                </svg>
              </div>
              <div>
                <div className={`font-mono-digit text-2xl tracking-wide ${card.accent ? "text-white" : ""}`}>
                  {card.value}
                </div>
                <p className={`mt-2 text-[11px] ${card.accent ? "text-white/70" : "text-faint"}`}>
                  {card.unit}
                </p>
              </div>
            </section>
          ))}
        </div>
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
                      <p className="truncate text-xs text-faint">
                        {student.email}
                      </p>
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
