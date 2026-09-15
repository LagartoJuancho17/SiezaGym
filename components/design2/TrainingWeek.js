"use client";

import { useState } from "react";
import {
  isCurrentWeek,
  mondayKeyOf,
  shiftWeeks,
  trainedDaysInWeek,
  weekCells,
  weekRangeLabel,
} from "@/lib/home/calendar";
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from "./Icons";

/**
 * La semana, con los dias entrenados marcados y flechas para moverse.
 *
 * Solo hacia atras: no se puede haber entrenado en una semana que todavia no
 * paso, asi que la flecha de adelante se apaga al llegar a la semana en curso.
 */
export default function TrainingWeek({ trainedDayKeys, todayKey, streak }) {
  const [monday, setMonday] = useState(() => mondayKeyOf(todayKey));

  const cells = weekCells(monday, { trainedDayKeys, todayKey });
  const trained = trainedDaysInWeek(monday, trainedDayKeys);
  const atCurrent = isCurrentWeek(monday, todayKey);

  return (
    <section className="d2-glass d2-cal" aria-labelledby="d2-week-title">
      <div className="d2-cal-head">
        <button
          type="button"
          onClick={() => setMonday(shiftWeeks(monday, -1))}
          aria-label="Semana anterior"
          className="d2-cal-arrow"
        >
          <ChevronLeftIcon size={14} width={1.9} />
        </button>

        <h2 id="d2-week-title" className="d2-cal-range" aria-live="polite">
          {atCurrent ? "Esta semana" : weekRangeLabel(monday)}
        </h2>

        <button
          type="button"
          onClick={() => setMonday(shiftWeeks(monday, 1))}
          disabled={atCurrent}
          aria-label="Semana siguiente"
          className="d2-cal-arrow"
        >
          <ChevronRightIcon size={14} width={1.9} />
        </button>
      </div>

      <div className="d2-week-grid">
        {cells.map((cell, index) => (
          <div key={cell.key} className={cell.isFuture ? "d2-week-day d2-week-day-future" : "d2-week-day"}>
            {/* Las iniciales se repiten (M de martes y de miércoles), así que
                la clave es la posición del día y no la letra. */}
            <span className="d2-week-initial" aria-hidden>
              {cell.initial}
            </span>
            <span
              className={[
                "d2-week-num",
                cell.trained ? "d2-week-num-on" : "",
                cell.isToday ? "d2-week-num-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={`${cell.day}${cell.trained ? ", entrenaste" : ""}${cell.isToday ? ", hoy" : ""}`}
              data-index={index}
            >
              {cell.day}
            </span>
          </div>
        ))}
      </div>

      <p className="d2-cal-foot">
        {trained === 0
          ? "Sin entrenamientos esta semana."
          : `${trained} ${trained === 1 ? "día entrenado" : "días entrenados"}`}
        {streak > 0 && (
          <span className="d2-cal-streak">
            <span aria-hidden>·</span>
            <FlameIcon size={11} width={1.7} />
            {streak} {streak === 1 ? "día seguido" : "días seguidos"}
          </span>
        )}
      </p>
    </section>
  );
}
