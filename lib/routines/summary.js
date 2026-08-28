import { MUSCLE_GROUPS } from "@/lib/exercises/constants";

const SECONDS_PER_SET_WORKING = 40;

export function totalSets(routine) {
  return routine.exercises.reduce((total, e) => total + (Number(e.targetSets) || 0), 0);
}

export function estimatedDurationMinutes(routine) {
  const seconds = routine.exercises.reduce((total, e) => {
    const sets = Number(e.targetSets) || 0;
    const rest = Number(e.restSeconds) || 0;
    return total + sets * (SECONDS_PER_SET_WORKING + rest);
  }, 0);
  return Math.round(seconds / 60);
}

// Distribucion muscular de la rutina: para cada ejercicio, sus targetSets se
// reparten entre los musculos segun muscleWeights del ejercicio, y el total
// se normaliza a porcentaje sobre el volumen combinado de la rutina.
export function muscleDistribution(routine, exerciseLookup) {
  const raw = {};
  let totalWeightedSets = 0;

  for (const item of routine.exercises) {
    const exercise = exerciseLookup.get(item.exerciseId);
    if (!exercise) continue;
    const sets = Number(item.targetSets) || 0;
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
