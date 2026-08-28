// Funciones puras sobre ejercicios ya cargados en memoria - sin Firebase Admin SDK,
// para poder importarse desde Client Components (el picker) sin arrastrar el SDK
// de servidor al bundle del navegador.
import { normalizeSearchText } from "@/lib/text/normalize";

export function filterExercises(exercises, { query, muscleGroup, equipment } = {}) {
  const normalizedQuery = query ? normalizeSearchText(query.trim()) : "";

  return exercises.filter((exercise) => {
    if (equipment && exercise.equipment !== equipment) {
      return false;
    }
    if (muscleGroup && !(muscleGroup in exercise.muscleWeights)) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = normalizeSearchText(`${exercise.nameEs} ${exercise.nameEn}`);
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });
}

export function primaryMuscle(muscleWeights) {
  const entries = Object.entries(muscleWeights || {});
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}
