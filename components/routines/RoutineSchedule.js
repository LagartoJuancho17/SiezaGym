"use client";

import { Fragment, useState } from "react";
import RoutineRow from "./RoutineRow";
import RoutinesHero from "./RoutinesHero";

function Chevron({ open, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

function rowsOf(week) {
  return week.items.map((item) => (
    <RoutineRow key={`${item.isAssigned ? "asg" : "own"}-${item.id}`} routine={item} />
  ));
}

/**
 * Dueño del estado del calendario.
 *
 * Mobile: el selector de mes va sobre la foto del hero y las rutinas de la
 * semana elegida se despliegan debajo de su fila.
 * Escritorio: el mes es una fila completa bajo el hero, las semanas quedan en
 * la columna izquierda y las rutinas en un panel a dos columnas a la derecha.
 */
export default function RoutineSchedule({ hero, months, currentMonthKey, currentWeek, children }) {
  const first = months[0] || null;
  const [openMonthKey, setOpenMonthKey] = useState(first?.monthKey ?? null);

  const month = months.find((m) => m.monthKey === openMonthKey) || null;
  const weeks = month?.weeks || [];

  const defaultWeek =
    month?.monthKey === currentMonthKey && weeks.some((w) => w.week === currentWeek)
      ? currentWeek
      : (weeks[0]?.week ?? null);
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);

  const active = weeks.find((w) => w.week === selectedWeek) || weeks[0] || null;

  const openMonth = (key) => {
    setOpenMonthKey(key);
    const next = months.find((m) => m.monthKey === key);
    setSelectedWeek(next?.weeks[0]?.week ?? null);
  };

  const monthLabel = (month || first)?.label ?? "";

  return (
    <>
      <RoutinesHero {...hero}>
        {first && (
          // En escritorio el mes vive en su propia fila, no sobre la foto.
          <button
            type="button"
            onClick={() => (month ? setOpenMonthKey(null) : openMonth(first.monthKey))}
            aria-expanded={!!month}
            className="flex w-full max-w-[300px] items-center justify-between gap-3 rounded-[12px] border border-white/15 bg-black/45 px-4 py-3 text-left backdrop-blur-md transition hover:bg-black/55 lg:hidden"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <CalendarIcon className="shrink-0 text-white" />
              <span className="truncate font-sans text-[15px] font-semibold text-white">
                {monthLabel}
              </span>
            </span>
            <Chevron open={!!month} className="text-white" />
          </button>
        )}
      </RoutinesHero>

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-2 px-3 pt-3 sm:px-5">
        {first && (
          <button
            type="button"
            onClick={() => (month ? setOpenMonthKey(null) : openMonth(first.monthKey))}
            aria-expanded={!!month}
            className="hidden w-full items-center justify-between gap-3 rounded-[14px] bg-surface px-5 py-4 text-left transition hover:bg-black/[0.03] lg:flex"
          >
            <span className="flex items-center gap-3">
              <CalendarIcon className="shrink-0 text-[#3A3531]" />
              <span className="font-sans text-[16px] font-semibold text-[#141414]">
                {monthLabel}
              </span>
            </span>
            <Chevron open={!!month} className="text-[#3A3531]" />
          </button>
        )}

        {month && (
          <div className="flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:items-start">
            {/* Semanas */}
            <div className="flex flex-col gap-2 lg:col-span-4 xl:col-span-3">
              {weeks.map((week) => {
                const open = active?.week === week.week;
                return (
                  <Fragment key={week.week}>
                    <button
                      type="button"
                      onClick={() => setSelectedWeek(open ? null : week.week)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 rounded-[14px] bg-surface px-4 py-3.5 text-left transition hover:bg-black/[0.03]"
                    >
                      <span className="font-sans text-[15px] font-semibold text-[#141414]">
                        {week.label}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-[13px] text-[#6E665E]">
                          {week.items.length}{" "}
                          {week.items.length === 1 ? "rutina" : "rutinas"}
                        </span>
                        <Chevron open={open} className="text-[#3A3531]" />
                      </span>
                    </button>

                    {/* En mobile las rutinas se despliegan debajo de su semana */}
                    {open && <div className="flex flex-col gap-2 lg:hidden">{rowsOf(week)}</div>}
                  </Fragment>
                );
              })}
            </div>

            {/* Panel de rutinas, solo escritorio */}
            {active && (
              <div className="hidden gap-2 rounded-[14px] bg-surface p-2 lg:col-span-8 lg:grid lg:grid-cols-2 lg:content-start xl:col-span-9">
                {rowsOf(active)}
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </>
  );
}
