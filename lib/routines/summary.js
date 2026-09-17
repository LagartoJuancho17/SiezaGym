import { MUSCLE_GROUPS, isTimeBasedRegistration } from "@/lib/exercises/constants";
import { plannedSets } from "@/lib/routines/workout";

const SECONDS_PER_SET_WORKING = 40;
const SECONDS_PER_SET_REST = 75;

/**
 * Series de la rutina.
 *
 * Se cuentan sobre las series ya abiertas (plannedSets) y no sobre targetSets:
 * con una prescripción serie por serie, el largo de sets[] es la verdad y
 * targetSets queda como referencia. Así la lista, el detalle y la planilla del
 * entrenamiento muestran siempre el mismo número.
 */
export function totalSets(routine) {
  return (routine?.exercises || []).reduce((total, item) => total + plannedSets(item).length, 0);
}

/**
 * Duración estimada, no medida.
 *
 * rest no es editable por el usuario (se sacó del armador), así que se usa un
 * promedio fijo por serie. En los ejercicios de tiempo, las repeticiones de la
 * serie son su duración en segundos, y con una rampa cada serie aporta lo suyo.
 * La pantalla lo rotula como estimación.
 */
export function estimatedDurationMinutes(routine, exerciseLookup) {
  const seconds = (routine?.exercises || []).reduce((total, item) => {
    const exercise = exerciseLookup?.get(item.exerciseId);
    const timeBased = !!exercise && isTimeBasedRegistration(exercise.registrationType);

    return (
      total +
      plannedSets(item).reduce((sum, set) => {
        const working = timeBased ? Number(set.reps) || SECONDS_PER_SET_WORKING : SECONDS_PER_SET_WORKING;
        return sum + working + SECONDS_PER_SET_REST;
      }, 0)
    );
  }, 0);

  return Math.round(seconds / 60);
}

// Distribucion muscular de la rutina: para cada ejercicio, sus series se
// reparten entre los musculos segun muscleWeights del ejercicio, y el total
// se normaliza a porcentaje sobre el volumen combinado de la rutina.
export function muscleDistribution(routine, exerciseLookup) {
  const raw = {};
  let totalWeightedSets = 0;

  for (const item of routine?.exercises || []) {
    const exercise = exerciseLookup.get(item.exerciseId);
    if (!exercise) continue;
    const sets = plannedSets(item).length;
    for (const [muscle, weight] of Object.entries(exercise.muscleWeights || {})) {
      const contribution = sets * weight;
      raw[muscle] = (raw[muscle] || 0) + contribution;
      totalWeightedSets += contribution;
    }
  }

  if (totalWeightedSets === 0) return [];

  return MUSCLE_GROUPS.filter((m) => raw[m] > 0)
    .map((m) => ({ muscle: m, pct: raw[m] / totalWeightedSets }))
    .sort((a, b) => b.pct - a.pct);
}
