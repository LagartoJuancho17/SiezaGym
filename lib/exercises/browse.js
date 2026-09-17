import { normalizeSearchText } from "@/lib/text/normalize";
import { MUSCLE_GROUP_LABELS } from "@/lib/exercises/constants";

/**
 * Los 16 grupos musculares agrupados en seis regiones.
 *
 * El filtro del buscador usa regiones y no grupos: dieciseis botones no entran
 * en una fila de telefono y obligan a elegir entre "deltoide anterior" y
 * "deltoide lateral" para encontrar un press militar.
 */
export const MUSCLE_REGIONS = [
  { id: "pecho", label: "Pecho", muscles: ["pecho"] },
  { id: "espalda", label: "Espalda", muscles: ["dorsal", "espaldaAltaTrapecio"] },
  { id: "hombros", label: "Hombros", muscles: ["deltoideAnterior", "deltoideLateral", "deltoidePosterior"] },
  { id: "brazos", label: "Brazos", muscles: ["biceps", "triceps", "antebrazo"] },
  { id: "piernas", label: "Piernas", muscles: ["cuadriceps", "isquiotibiales", "gluteo", "aductores", "gemelo"] },
  { id: "core", label: "Core", muscles: ["abdomen", "lumbar"] },
];

/** El musculo que mas trabaja el ejercicio, para mostrarlo abajo del nombre. */
export function primaryMuscleOf(exercise) {
  const weights = Object.entries(exercise?.muscleWeights || {});
  if (!weights.length) return null;
  const [muscle] = weights.reduce((best, entry) => (entry[1] > best[1] ? entry : best));
  return muscle;
}

export function primaryMuscleLabel(exercise) {
  const muscle = primaryMuscleOf(exercise);
  return muscle ? MUSCLE_GROUP_LABELS[muscle] || muscle : null;
}

function worksRegion(exercise, regionId) {
  const region = MUSCLE_REGIONS.find((item) => item.id === regionId);
  if (!region) return true;
  const weights = exercise?.muscleWeights || {};
  return region.muscles.some((muscle) => (weights[muscle] || 0) > 0);
}

/**
 * Ejercicios que quedan visibles con el texto y la region elegidos.
 * La busqueda mira el nombre en castellano y en ingles, sin tildes.
 */
export function filterExercises(exercises, { query = "", region = null } = {}) {
  const term = normalizeSearchText(String(query ?? "").trim());

  return (exercises || []).filter((exercise) => {
    if (region && !worksRegion(exercise, region)) return false;
    if (!term) return true;
    const haystack = normalizeSearchText(`${exercise.nameEs || ""} ${exercise.nameEn || ""}`);
    return haystack.includes(term);
  });
}

/** Cuantos ejercicios hay por region, para no ofrecer filtros vacios. */
export function countByRegion(exercises) {
  return Object.fromEntries(
    MUSCLE_REGIONS.map((region) => [
      region.id,
      (exercises || []).filter((exercise) => worksRegion(exercise, region.id)).length,
    ]),
  );
}
