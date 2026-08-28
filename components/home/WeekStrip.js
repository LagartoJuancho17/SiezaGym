"use client";

import { useState } from "react";

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

export default function WeekStrip() {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const base = startOfWeek(today);
  base.setDate(base.getDate() + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(base);
    date.setDate(date.getDate() + i);
    return { date, label: DAY_LABELS[i], isToday: isSameDay(date, today) };
  });

  const monthLabel = `${MONTH_LABELS[base.getMonth()]} ${base.getFullYear()}`;

  return (
    <section
      aria-label="Tu semana"
      className="mb-3 rounded-[26px] border border-hair bg-glass p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono-digit text-[21px] tracking-wide">
          {monthLabel}
        </div>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Semana anterior"
            onClick={() => setWeekOffset((n) => n - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-pill text-onlight transition hover:opacity-90"
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
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
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-pill text-onlight transition hover:opacity-90"
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
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
      <div className="mt-5 grid grid-cols-7 gap-0.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5">
            <span
              className={`text-xs font-medium ${d.isToday ? "text-text" : "text-faint"}`}
            >
              {d.label}
            </span>
            <span
              className={`font-mono-digit flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                d.isToday ? "bg-linear-to-br from-teal2 to-teal text-onlight" : "text-muted"
              }`}
            >
              {d.date.getDate()}
            </span>
            <span className="h-1 w-1 rounded-full bg-transparent" />
          </div>
        ))}
      </div>
    </section>
  );
}
