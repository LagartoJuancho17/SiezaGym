"use client";

import { useState } from "react";
import RoutineRow from "./RoutineRow";
import RoutinesHero from "./RoutinesHero";

function Chevron({ open, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
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
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

function plural(n) {
  return `${n} ${n === 1 ? "rutina" : "rutinas"}`;
}

/**
 * Acordeones anidados: mes -> semana -> cards.
 *
 * Cada mes y cada semana abre y cierra por su cuenta. Superficie, borde y radio
 * son los mismos que usan los widgets de la Home.
 */
export default function RoutineSchedule({ hero, months, currentMonthKey, currentWeek, children }) {
  const firstMonth = months[0] || null;

  const initialMonth =
    months.find((m) => m.monthKey === currentMonthKey)?.monthKey ?? firstMonth?.monthKey ?? null;
  const initialMonthWeeks = months.find((m) => m.monthKey === initialMonth)?.weeks ?? [];
  const initialWeek =
    initialMonth === currentMonthKey && initialMonthWeeks.some((w) => w.week === currentWeek)
      ? currentWeek
      : initialMonthWeeks[0]?.week;

  const [openMonths, setOpenMonths] = useState(() => new Set(initialMonth ? [initialMonth] : []));
  const [openWeeks, setOpenWeeks] = useState(() =>
    new Set(initialMonth && initialWeek ? [`${initialMonth}:${initialWeek}`] : []),
  );

  const toggle = (setState, key) =>
    setState((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <>
      <RoutinesHero {...hero}>
        {firstMonth && (
          <p className="flex w-fit items-center gap-2.5 rounded-[10px] border border-white/15 bg-black/45 px-4 py-2.5 backdrop-blur-md">
            <CalendarIcon className="shrink-0 text-white" />
            <span className="font-sans text-[15px] font-semibold text-white">
              {(months.find((m) => m.monthKey === currentMonthKey) || firstMonth).label}
            </span>
          </p>
        )}
      </RoutinesHero>

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-2 px-3 pt-3 sm:px-5">
        {months.map((month) => {
          const monthOpen = openMonths.has(month.monthKey);
          return (
            <div key={month.monthKey} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => toggle(setOpenMonths, month.monthKey)}
                aria-expanded={monthOpen}
                className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#5A1215] bg-surface px-4 py-3 text-left transition hover:bg-black/[0.03]"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarIcon className="shrink-0 text-[#3A3531]" />
                  <span className="font-sans text-[15px] font-semibold text-[#141414]">
                    {month.label}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-[12px] text-[#6E665E]">{plural(month.total)}</span>
                  <Chevron open={monthOpen} className="text-[#3A3531]" />
                </span>
              </button>

              {monthOpen &&
                month.weeks.map((week) => {
                  const weekKey = `${month.monthKey}:${week.week}`;
                  const weekOpen = openWeeks.has(weekKey);
                  return (
                    <div key={weekKey} className="flex flex-col gap-2 sm:pl-4">
                      <button
                        type="button"
                        onClick={() => toggle(setOpenWeeks, weekKey)}
                        aria-expanded={weekOpen}
                        className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#5A1215]/60 bg-surface px-4 py-2.5 text-left transition hover:bg-black/[0.03]"
                      >
                        <span className="font-sans text-[14px] font-semibold text-[#141414]">
                          {week.label}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-[12px] text-[#6E665E]">
                            {plural(week.items.length)}
                          </span>
                          <Chevron open={weekOpen} className="text-[#3A3531]" />
                        </span>
                      </button>

                      {weekOpen && (
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {week.items.map((item) => (
                            <RoutineRow
                              key={`${item.isAssigned ? "asg" : "own"}-${item.id}`}
                              routine={item}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}

        {children}
      </div>
    </>
  );
}
