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
      className="rounded-[26px] border border-black/[0.05] bg-surface p-3.5 shadow-[0_6px_20px_rgba(24,18,15,0.08)] sm:p-4"
    >
      <div className="flex items-center justify-between gap-2 px-1.5 pb-3.5">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => setWeekOffset((n) => n - 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#2E2B28] transition hover:bg-black/[0.05] active:scale-95"
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

        <p className="min-w-0 truncate text-center text-[13px] font-bold uppercase tracking-[0.12em] text-[#2E2B28]">
          {rangeLabel(days[0].date, days[6].date)}
        </p>

        <button
          type="button"
          aria-label="Semana siguiente"
          onClick={() => setWeekOffset((n) => n + 1)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#2E2B28] transition hover:bg-black/[0.05] active:scale-95"
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
            className={`flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-[16px] border py-3 transition sm:min-h-[104px] ${
              day.isToday
                ? "border-transparent bg-[#FF5524] shadow-[0_6px_16px_rgba(255,85,36,0.35)]"
                : "border-black/[0.04] bg-white"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.06em] sm:text-[11px] ${
                day.isToday ? "text-white/85" : "text-[#8C827A]"
              }`}
            >
              {day.label}
            </span>
            <span
              className={`font-sans text-[19px] font-bold leading-none sm:text-[22px] ${
                day.isToday ? "text-white" : "text-[#2E2B28]"
              }`}
            >
              {day.date.getDate()}
            </span>
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                day.trained
                  ? day.isToday
                    ? "bg-white"
                    : "bg-[#FF5524]"
                  : "bg-transparent"
              }`}
            />
          </div>
        ))}
      </div>

      {streak > 0 && (
        <p className="pt-3 text-center text-[11px] font-semibold text-[#8C827A]">
          <span className="text-[#FF5524]">{streak}</span>{" "}
          {streak === 1 ? "día seguido" : "días seguidos"} entrenando
        </p>
      )}
    </section>
  );
}
