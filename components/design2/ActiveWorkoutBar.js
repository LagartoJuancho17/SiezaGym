"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearActiveWorkout, useActiveWorkout } from "@/lib/routines/activeWorkout";
import { doneCount, elapsedSeconds, formatClock, plannedCount, pluralSets } from "@/lib/routines/workout";
import { teardownMediaSession } from "@/lib/workout/mediaSessionManager";
import { CloseIcon, PlayIcon } from "./Icons";

/**
 * Barra flotante global de entrenamiento en curso.
 *
 * Se muestra cuando hay un entrenamiento en stand-by y el usuario está
 * navegando por otra parte de la aplicación (ej: inicio, historial, ejercicios).
 * Al tocar "Reanudar", vuelve a la rutina con el cronómetro y las series intactas.
 */
export default function ActiveWorkoutBar() {
  const pathname = usePathname();
  const workout = useActiveWorkout();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!workout || workout.clock?.pausedAt != null) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [workout]);

  if (!workout || !workout.routineId) return null;

  // Si ya estamos en la pantalla del entrenamiento, la barra de stand-by se oculta
  if (pathname === `/rutinas/${workout.routineId}`) return null;

  const seconds = workout.clock ? elapsedSeconds({ ...workout.clock, now }) : 0;
  const done = workout.sheet ? doneCount(workout.sheet) : 0;
  const planned = workout.sheet ? plannedCount(workout.sheet) : 0;

  function handleDiscard(e) {
    e.preventDefault();
    e.stopPropagation();
    clearActiveWorkout();
    teardownMediaSession();
  }

  return (
    <div className="d2-active-bar-wrap">
      <div className="d2-glass-strong d2-active-bar">
        <Link
          href={`/rutinas/${workout.routineId}`}
          className="d2-active-bar-body"
          aria-label={`Reanudar ${workout.routineName || "entrenamiento"}`}
        >
          <span className="d2-active-bar-pulse" aria-hidden />
          <div className="d2-active-bar-info">
            <span className="d2-active-bar-title">{workout.routineName || "Entrenamiento en curso"}</span>
            <span className="d2-active-bar-meta">
              <span className="d2-active-bar-clock">{formatClock(seconds)}</span>
              <span className="d2-active-bar-dot">·</span>
              <span>{done} de {pluralSets(planned)}</span>
            </span>
          </div>
        </Link>

        <div className="d2-active-bar-actions">
          <Link
            href={`/rutinas/${workout.routineId}`}
            className="d2-active-bar-resume"
          >
            <PlayIcon size={14} width={2} />
            <span>Reanudar</span>
          </Link>
          <button
            type="button"
            onClick={handleDiscard}
            className="d2-active-bar-close"
            aria-label="Descartar entrenamiento en stand-by"
            title="Descartar entrenamiento"
          >
            <CloseIcon size={15} width={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
