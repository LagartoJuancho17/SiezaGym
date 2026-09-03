"use client";

import { useMemo, useState } from "react";
import { toLocalDayKey } from "@/lib/sessions/streak";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_LABELS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function WeekStrip({ trainedDates = [], streak = 0 }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const trainedSet = useMemo(() => new Set(trainedDates), [trainedDates]);

  const today = new Date();
  const base = startOfWeek(today);
  base.setDate(base.getDate() + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(base);
    date.setDate(date.getDate() + i);
    return {
      date,
      label: DAY_LABELS[i],
      isToday: isSameDay(date, today),
      trained: trainedSet.has(toLocalDayKey(date)),
    };
  });

  const monthLabel = `${MONTH_LABELS[base.getMonth()]} ${base.getFullYear()}`;

  return (
    <section
      aria-label="Tu semana"
      className="rounded-3xl border border-hair/80 bg-glass/60 p-4 sm:p-5 backdrop-blur-md transition hover:border-white/20"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="font-mono-digit text-[20px] sm:text-[22px] tracking-wide text-white">
            {monthLabel}
          </div>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-400">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M12 2c-.3 3-2.5 4.8-4.2 6.7C6.2 10.5 5 12.6 5 15a7 7 0 0 0 14 0c0-2.9-1.6-4.7-2.8-6.6-.4.9-1.1 1.8-1.9 1.8-1.1 0-1.5-1-1.3-2C13.3 6 12.7 3.6 12 2z" />
              </svg>
              {streak}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Semana anterior"
            onClick={() => setWeekOffset((n) => n - 1)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-hair bg-glass2 text-white transition hover:bg-white/20 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Semana siguiente"
            onClick={() => setWeekOffset((n) => n + 1)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-hair bg-glass2 text-white transition hover:bg-white/20 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-2 rounded-2xl py-2 px-1 transition ${
              d.isToday
                ? "bg-teal/15 border border-teal/40 shadow-[0_0_16px_rgba(63,169,188,0.2)]"
                : d.trained
                ? "bg-orange-500/10 border border-orange-500/25"
                : "hover:bg-glass2"
            }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                d.isToday ? "text-teal2" : d.trained ? "text-orange-400" : "text-faint"
              }`}
            >
              {d.label}
            </span>
            <span
              className={`font-mono-digit flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition ${
                d.trained
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_4px_12px_rgba(249,115,22,0.35)]"
                  : d.isToday
                  ? "bg-gradient-to-br from-teal2 to-teal text-onlight shadow-[0_4px_12px_rgba(63,169,188,0.4)]"
                  : "text-muted"
              }`}
            >
              {d.date.getDate()}
            </span>
            {d.isToday ? (
              <span className="h-1.5 w-1.5 rounded-full bg-teal2 animate-pulse" />
            ) : d.trained ? (
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
