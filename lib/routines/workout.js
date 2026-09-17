/**
 * Entrenar una rutina.
 *
 * La rutina prescribe (series, reps, peso, RIR); el entrenamiento registra lo
 * que de verdad se hizo. Son dos cosas distintas y acá viven las dos
 * conversiones: de prescripción a planilla, y de planilla a sesión guardada.
 *
 * Todo esto es determinístico y sin React a propósito: la aritmética de
 * volumen, el reloj y el armado del payload son siempre la misma entrada y la
 * misma salida, así que se prueban solos.
 */

import { isDetailed, setCount } from "@/lib/routines/prescription";

/**
 * Las series prescritas de un ejercicio, en una sola forma.
 *
 * El modelo guarda dos: pareja (targetSets × targetReps) y detallada (sets[]).
 * La pantalla dibuja una fila por serie en los dos casos, así que se
 * normalizan acá y ningún componente vuelve a preguntar de qué forma era.
 */
export function plannedSets(item) {
  if (isDetailed(item)) {
    return item.sets.map((set, index) => ({
      setNumber: index + 1,
      reps: set.reps ?? null,
      weight: set.weight ?? null,
      rir: set.rir ?? null,
    }));
  }

  return Array.from({ length: setCount(item) }, (_, index) => ({
    setNumber: index + 1,
    reps: item?.targetReps ?? null,
    weight: item?.targetWeight ?? null,
    rir: item?.targetRIR ?? null,
  }));
}

/**
 * Planilla inicial del entrenamiento: lo prescrito como punto de partida
 * editable, con todas las series sin marcar.
 *
 * Arranca con lo prescrito y no en blanco porque en el gimnasio lo normal es
 * confirmar el plan y corregir la excepción, no cargar doce números de cero.
 *
 * La clave es la posición en la rutina y no el id del ejercicio: una rutina
 * puede repetir el mismo ejercicio (press al principio y al final) y con el id
 * como clave las dos apariciones compartirían la misma planilla.
 */
export function startSheet(exercises) {
  const sheet = {};
  (exercises || []).forEach((item, position) => {
    sheet[position] = plannedSets(item).map((set) => ({
      setNumber: set.setNumber,
      reps: set.reps,
      weight: set.weight,
      done: false,
    }));
  });
  return sheet;
}

/** Una serie más, copiando la última: una serie extra repite o sube, nunca arranca vacía. */
export function appendSet(rows) {
  const current = Array.isArray(rows) ? rows : [];
  const last = current[current.length - 1];
  return [
    ...current,
    {
      setNumber: current.length + 1,
      reps: last?.reps ?? null,
      weight: last?.weight ?? null,
      done: false,
    },
  ];
}

/** Saca la última serie. Nunca deja el ejercicio en cero filas. */
export function dropSet(rows) {
  const current = Array.isArray(rows) ? rows : [];
  if (current.length <= 1) return current;
  return current.slice(0, -1);
}

function rowsOf(sheet) {
  return Object.values(sheet || {}).flat();
}

/** Series marcadas como hechas. */
export function doneCount(sheet) {
  return rowsOf(sheet).filter((row) => row.done).length;
}

/** Series de la planilla, hechas o no. */
export function plannedCount(sheet) {
  return rowsOf(sheet).length;
}

/**
 * Volumen levantado: peso × reps de las series hechas.
 *
 * Las que no están marcadas no cuentan: la planilla arranca con lo prescrito y
 * sumar eso sería inventar un entrenamiento que todavía no pasó.
 */
export function volumeKg(sheet) {
  const total = rowsOf(sheet)
    .filter((row) => row.done && !row.failed)
    .reduce((sum, row) => sum + (Number(row.weight) || 0) * (Number(row.reps) || 0), 0);
  return Math.round(total * 100) / 100;
}

/** Si todas las series de un ejercicio ya están hechas, para marcar la fila. */
export function isExerciseDone(sheet, position) {
  const rows = sheet?.[position];
  return Array.isArray(rows) && rows.length > 0 && rows.every((row) => row.done);
}

/**
 * Lo hecho, con la forma que espera createSession.
 *
 * Solo las series marcadas y con repeticiones: una serie sin reps no es una
 * serie. El peso vacío vale 0, que es lo correcto en peso corporal.
 */
export function sessionExercises(exercises, sheet) {
  return (exercises || [])
    .map((item, position) => ({
      exerciseId: item.exerciseId,
      sets: (sheet?.[position] || [])
        .filter((row) => row.done && Number(row.reps) > 0)
        .map((row, index) => ({
          setNumber: index + 1,
          weight: Number(row.weight) || 0,
          reps: Number(row.reps),
          failed: !!row.failed,
        })),
    }))
    .filter((item) => item.sets.length > 0);
}

/**
 * Segundos transcurridos, contados con reloj de pared y no con un contador que
 * se incrementa: un setInterval se atrasa y se frena cuando la pestaña pasa a
 * segundo plano, y el cronómetro del gimnasio quedaría corto.
 *
 * `pausedMs` es lo acumulado en pausas cerradas; `pausedAt`, el momento en que
 * empezó la pausa en curso.
 */
export function elapsedSeconds({ startedAt, now, pausedMs = 0, pausedAt = null }) {
  if (!startedAt) return 0;
  const end = pausedAt ?? now;
  return Math.max(0, Math.floor((end - startedAt - pausedMs) / 1000));
}

/** mm:ss, y h:mm:ss recién cuando pasa la hora. */
export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** "3 series" / "1 serie": el plural se escribe una vez y no en cada pantalla. */
export function pluralSets(count) {
  return `${count} ${count === 1 ? "serie" : "series"}`;
}

export function pluralExercises(count) {
  return `${count} ${count === 1 ? "ejercicio" : "ejercicios"}`;
}
