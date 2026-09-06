"use client";

import { useState } from "react";
import RoutineRow from "./RoutineRow";

function Chevron({ open }) {
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
      className={`shrink-0 text-[#3A3531] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function WeekAccordion({ week, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = week.items.length;

  return (
    <div className="overflow-hidden rounded-[14px] bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-black/[0.03]"
      >
        <span className="font-sans text-[15px] font-semibold text-[#141414]">{week.label}</span>
        <span className="flex items-center gap-3">
          <span className="text-[13px] text-[#6E665E]">
            {count} {count === 1 ? "rutina" : "rutinas"}
          </span>
          <Chevron open={open} />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-2 pb-2">
          {week.items.map((item) => (
            <RoutineRow key={`${item.isAssigned ? "asg" : "own"}-${item.id}`} routine={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutineSchedule({ months, currentMonthKey, currentWeek }) {
  const [openMonth, setOpenMonth] = useState(months[0]?.monthKey ?? null);

  if (months.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {months.map((month) => {
        const open = openMonth === month.monthKey;
        return (
          <div key={month.monthKey} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setOpenMonth(open ? null : month.monthKey)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 rounded-[14px] bg-surface px-4 py-3.5 text-left transition hover:bg-black/[0.03]"
            >
              <span className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#3A3531]" aria-hidden="true">
                  <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
                  <path d="M8 3v4M16 3v4M3.5 10h17" />
                </svg>
                <span className="font-sans text-[15px] font-semibold text-[#141414]">
                  {month.label}
                </span>
              </span>
              <Chevron open={open} />
            </button>

            {open &&
              month.weeks.map((week) => (
                <WeekAccordion
                  key={week.week}
                  week={week}
                  // La semana en curso arranca abierta; si el mes es otro, la primera.
                  defaultOpen={
                    month.monthKey === currentMonthKey
                      ? week.week === currentWeek
                      : week === month.weeks[0]
                  }
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
