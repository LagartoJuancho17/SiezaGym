"use client";

import { useMemo } from "react";
import { toLocalDayKey } from "@/lib/sessions/streak";
import { startOfWeekLocal } from "@/lib/sessions/weeklyStats";

const WEEKS = 52;
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatTooltip(dayKey) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dayKey}T12:00:00`));
}

export default function ActivityHeatmap({ trainedDates = [] }) {
  const trainedSet = useMemo(() => new Set(trainedDates), [trainedDates]);

  // Columnas = semanas (lunes a domingo). La ultima termina en el domingo de
  // la semana actual; dias futuros de esa semana quedan atenuados.
  const { weeks, monthTicks, totalTrained } = useMemo(() => {
    const todayKey = toLocalDayKey(new Date());
    const thisMonday = startOfWeekLocal(new Date());
    const firstMonday = new Date(thisMonday);
    firstMonday.setDate(firstMonday.getDate() - (WEEKS - 1) * 7);

    const weeks = [];
    const monthTicks = [];
    let totalTrained = 0;
    let lastMonth = null;

    for (let w = 0; w < WEEKS; w += 1) {
      const monday = new Date(firstMonday);
      monday.setDate(monday.getDate() + w * 7);

      const month = monday.getMonth();
      if (month !== lastMonth) {
        monthTicks.push({ weekIndex: w, label: MONTH_LABELS[month] });
        lastMonth = month;
      }

      const days = Array.from({ length: 7 }, (_, d) => {
        const date = new Date(monday);
        date.setDate(date.getDate() + d);
        const dayKey = toLocalDayKey(date);
        const trained = trainedSet.has(dayKey);
        if (trained) totalTrained += 1;
        return { dayKey, trained, isFuture: dayKey > todayKey };
      });
      weeks.push(days);
    }

    return { weeks, monthTicks, totalTrained };
  }, [trainedSet]);

  return (
    <section
      aria-label="Actividad del último año"
      className="rounded-[26px] border border-hair bg-glass p-4 lg:p-5"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
          Actividad
        </p>
        <p className="text-[11px] text-faint">
          {totalTrained} {totalTrained === 1 ? "día entrenado" : "días entrenados"} · último año
        </p>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="min-w-[640px]">
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
          >
            {monthTicks.map((tick) => (
              <span
                key={tick.weekIndex}
                className="text-[10px] text-faint"
                style={{ gridColumnStart: tick.weekIndex + 1 }}
              >
                {tick.label}
              </span>
            ))}
          </div>

          <div
            className="mt-1 grid grid-flow-col grid-rows-7 gap-[3px]"
            role="img"
            aria-label={`${totalTrained} días con entrenamiento en el último año`}
          >
            {weeks.flatMap((days, weekIndex) =>
              days.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  title={`${formatTooltip(day.dayKey)}${day.trained ? " · entrenaste" : ""}`}
                  className={`aspect-square w-full rounded-[3px] ${
                    day.trained
                      ? "bg-teal2 shadow-[0_0_6px_rgba(103,210,222,0.35)]"
                      : day.isFuture
                        ? "bg-glass opacity-30"
                        : "bg-glass"
                  }`}
                />
              )),
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-faint">
            <div className="flex gap-2.5">
              {DAY_LABELS.map((label, i) => (
                <span key={i} className={i % 2 === 0 ? "" : "invisible lg:visible"}>
                  {label}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span>menos</span>
              <span className="h-2.5 w-2.5 rounded-[3px] bg-glass" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-teal2" />
              <span>más</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
