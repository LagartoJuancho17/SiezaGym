"use client";

import { useMemo, useState } from "react";
import { toLocalDayKey } from "@/lib/sessions/streak";

const DAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTH_LABELS = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];
const MONTH_LABELS_SHORT = [
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

// "7–13 SEPTIEMBRE" si la semana cae en un mes, "28 SEP–4 OCT" si la cruza.
function rangeLabel(first, last) {
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${MONTH_LABELS[first.getMonth()]}`;
  }
  return `${first.getDate()} ${MONTH_LABELS_SHORT[first.getMonth()]}–${last.getDate()} ${
    MONTH_LABELS_SHORT[last.getMonth()]
  }`;
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

  return (
    <section
      aria-label="Tu semana"
      className="rounded-[10px] border border-[#5A1215] bg-surface p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-center justify-between gap-2 pb-4">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => setWeekOffset((n) => n - 1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-[#3B0A0C] transition hover:bg-[#D9D3CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>

        <p
          aria-live="polite"
          className="min-w-0 truncate text-center text-[13px] font-bold uppercase tracking-[0.12em] text-[#3B0A0C]"
        >
          {rangeLabel(days[0].date, days[6].date)}
        </p>

        <button
          type="button"
          aria-label="Semana siguiente"
          onClick={() => setWeekOffset((n) => n + 1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-[#3B0A0C] transition hover:bg-[#D9D3CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day, i) => (
          <div
            key={i}
            aria-current={day.isToday ? "date" : undefined}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[8px] border py-2.5 transition sm:min-h-[84px] ${
              day.isToday
                ? "border-[#D94323] bg-accent shadow-[0_5px_14px_rgba(90,18,21,0.22)]"
                : "border-[#D0C8BE] bg-[#F4F1EC]"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.06em] sm:text-[11px] ${
                day.isToday ? "text-[#3B0A0C]" : "text-[#645C55]"
              }`}
            >
              {day.label}
            </span>
            <span
              className={`font-sans text-[19px] font-bold leading-none sm:text-[22px] ${
                day.isToday ? "text-[#3B0A0C]" : "text-[#2E2B28]"
              }`}
            >
              {day.date.getDate()}
            </span>
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                day.trained
                  ? day.isToday
                    ? "bg-[#3B0A0C]"
                    : "bg-accent"
                  : "bg-transparent"
              }`}
            />
          </div>
        ))}
      </div>

      {streak > 0 && (
        <p className="pt-4 text-center text-[11px] font-semibold text-[#645C55]">
          <span className="text-accent">{streak}</span>{" "}
          {streak === 1 ? "día seguido" : "días seguidos"} entrenando
        </p>
      )}
    </section>
  );
}
