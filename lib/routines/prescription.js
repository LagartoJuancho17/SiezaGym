/**
 * Prescripcion de un ejercicio dentro de una rutina.
 *
 * Hay dos formas de prescribir y el modelo guarda las dos:
 *
 * - Pareja: todas las series iguales. Vive en targetSets / targetReps /
 *   targetWeight / targetRIR, y `sets` queda en null.
 * - Detallada: cada serie con lo suyo, para rampas del tipo 10, 12, 14, 16.
 *   Vive en `sets`, y los target* quedan como referencia de la primera serie.
 *
 * `sanitizeExercises` en lib/routines/routines.js ya acepta las dos.
 */

export function isDetailed(item) {
  return Array.isArray(item?.sets) && item.sets.length > 0;
}

/**
 * Cantidad en caliente, mientras se edita: nunca negativa, pero puede ser 0 el
 * instante en que se borra el campo para escribir un número nuevo. Sin tope
 * de arriba, no hay motivo de negocio para no poder cargar 20 series.
 */
function liveCount(count) {
  return Math.max(0, Number(count) || 0);
}

/** Para una acción a propósito (pasar a detallada): al menos una fila. */
function committedCount(count) {
  return Math.max(1, liveCount(count));
}

/** Pasa de pareja a detallada: arranca con todas las series en el mismo valor. */
export function buildSets(item) {
  const count = committedCount(item?.targetSets);
  return Array.from({ length: count }, (_, index) => ({
    setNumber: index + 1,
    reps: Number(item?.targetReps) || 10,
    weight: item?.targetWeight ?? null,
    rir: item?.targetRIR ?? null,
  }));
}

/**
 * Ajusta la cantidad de series detalladas.
 * Las nuevas copian a la ultima cargada: en el gimnasio una serie nueva casi
 * siempre repite o sube desde la anterior, nunca arranca vacia.
 */
export function resizeSets(sets, count) {
  const target = liveCount(count);
  const current = Array.isArray(sets) ? sets : [];
  const next = current.slice(0, target);

  while (next.length < target) {
    const previous = next[next.length - 1];
    next.push({
      setNumber: next.length + 1,
      reps: previous?.reps ?? 10,
      weight: previous?.weight ?? null,
      rir: previous?.rir ?? null,
    });
  }

  return next.map((set, index) => ({ ...set, setNumber: index + 1 }));
}

/** Vuelve a pareja tomando la primera serie como referencia. */
export function toUniform(item) {
  const first = isDetailed(item) ? item.sets[0] : null;
  return {
    ...item,
    targetSets: isDetailed(item) ? item.sets.length : committedCount(item?.targetSets),
    targetReps: first ? first.reps : item?.targetReps ?? 10,
    targetWeight: first ? first.weight : item?.targetWeight ?? null,
    targetRIR: first ? first.rir : item?.targetRIR ?? null,
    sets: null,
  };
}

/**
 * Cuantas series prescribe, sea cual sea la forma.
 *
 * Preserva `null` (campo recien borrado, todavia escribiendo el numero
 * nuevo) en vez de convertirlo en 0 o en 1: es lo mismo que ya hacen Reps,
 * Peso y RIR, y es lo que deja que el campo se vea en blanco en vez de
 * saltar solo a otro numero. `sanitizeExercises` en routines.js ya sabe
 * convertir un `targetSets` nulo en una rutina guardable.
 */
export function setCount(item) {
  if (isDetailed(item)) return item.sets.length;
  return item?.targetSets == null ? null : liveCount(item.targetSets);
}

/**
 * Resumen corto para la fila cerrada.
 * Con una rampa muestra los valores uno por uno, que es justamente lo que se
 * pierde si se resume como "4 x 10".
 */
export function prescriptionSummary(item, { timeBased = false } = {}) {
  const unit = timeBased ? "s" : "";

  if (isDetailed(item)) {
    const reps = item.sets.map((set) => set.reps);
    const allEqual = reps.every((value) => value === reps[0]);
    if (allEqual) return `${reps.length} × ${reps[0]}${unit}`;
    return reps.join(" · ") + unit;
  }

  return `${setCount(item) ?? 0} × ${Number(item?.targetReps) || 0}${unit}`;
}
