import { EQUIPMENT_LABELS, isTimeBasedRegistration } from "@/lib/exercises/constants";
import { primaryMuscleLabel } from "@/lib/exercises/browse";
import { prescriptionSummary } from "@/lib/routines/prescription";
import { plannedSets, sessionExercises } from "@/lib/routines/workout";

/**
 * Ejercicios sumados en medio del entrenamiento ("hoy la máquina estaba
 * libre"). No cambian la rutina guardada: van al final de la planilla, con
 * 3 series para cargar, y solo quedan en la sesión si se marcan series.
 * Mismo criterio que WorkoutDraft.agregarEjercicios en iOS.
 */
export const LIVE_SETS = 3;
export const LIVE_REPS = 10;
export const LIVE_SECONDS = 30;

/** Un ejercicio del catálogo con la forma que dibuja la planilla (shapeExercise). */
export function liveExercise(exercise, position) {
  const timeBased = isTimeBasedRegistration(exercise?.registrationType);
  const item = {
    exerciseId: exercise.id,
    exerciseSource: exercise.source === "custom" ? "custom" : "catalog",
    targetSets: LIVE_SETS,
    targetReps: timeBased ? LIVE_SECONDS : LIVE_REPS,
    targetWeight: null,
  };
  return {
    position,
    live: true,
    exerciseId: exercise.id,
    exerciseSource: item.exerciseSource,
    name: exercise.nameEs || exercise.id,
    muscle: primaryMuscleLabel(exercise) || "Sin datos",
    mediaUrl: exercise.mediaUrl || null,
    videoUrl: exercise.videoUrl || null,
    description: "",
    timeBased,
    showWeight: exercise.registrationType === "peso_reps",
    equipment: EQUIPMENT_LABELS[exercise.equipment] || null,
    techniqueNote: "",
    lastNote: null,
    group: "",
    groupColor: "",
    summary: prescriptionSummary(item, { timeBased }),
    sets: plannedSets(item),
  };
}

/** Los nuevos, numerados después de lo que ya hay en la planilla. */
export function appendLive(existing, chosen, firstPosition) {
  const start = firstPosition + existing.length;
  return [...existing, ...chosen.map((exercise, index) => liveExercise(exercise, start + index))];
}

/** Las filas iniciales de la planilla para los ejercicios nuevos, por posición. */
export function liveRows(added) {
  return Object.fromEntries(
    added.map((exercise) => [
      exercise.position,
      exercise.sets.map((set) => ({ setNumber: set.setNumber, reps: set.reps, weight: set.weight, done: false })),
    ]),
  );
}

/**
 * Lo hecho en los ejercicios agregados, con la forma de createSession. Se usa
 * en las rutinas asignadas, donde el resto de la sesión lo arma el servidor
 * con lo que ya quedó registrado.
 */
export function liveSessionExercises(extra, sheet, notes = {}) {
  const subSheet = Object.fromEntries(extra.map((exercise, index) => [index, sheet?.[exercise.position] || []]));
  const subNotes = Object.fromEntries(extra.map((exercise, index) => [index, notes?.[exercise.position]]));
  return sessionExercises(extra, subSheet, subNotes).map((exercise, index) => ({
    ...exercise,
    exerciseSource: extra.find((e) => e.exerciseId === exercise.exerciseId)?.exerciseSource || "catalog",
    order: index,
  }));
}

/**
 * Del lado del servidor: lo que manda el navegador de los ejercicios
 * agregados, limpio. Ids de texto, hasta 20 ejercicios y 20 series, reps
 * positivas; lo demás se descarta.
 */
export function cleanLiveExercises(raw, startOrder = 0) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 20)
    .filter((exercise) => typeof exercise?.exerciseId === "string" && exercise.exerciseId.length <= 120)
    .map((exercise, index) => ({
      exerciseId: exercise.exerciseId,
      exerciseSource: exercise.exerciseSource === "custom" ? "custom" : "catalog",
      order: startOrder + index,
      ...(typeof exercise.note === "string" && exercise.note.trim() ? { note: exercise.note.trim().slice(0, 500) } : {}),
      sets: (Array.isArray(exercise.sets) ? exercise.sets : [])
        .slice(0, 20)
        .filter((set) => Number(set?.reps) > 0)
        .map((set, setIndex) => ({
          setNumber: setIndex + 1,
          weight: Math.max(0, Number(set.weight) || 0),
          reps: Math.round(Number(set.reps)),
          failed: !!set.failed,
        })),
    }))
    .filter((exercise) => exercise.sets.length > 0);
}
