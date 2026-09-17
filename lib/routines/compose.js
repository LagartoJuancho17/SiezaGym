/** Reorder without mutating the prescription or losing per-set settings. */
export function moveExercise(items, from, to) {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Search only changes visibility, never the selection that will be added. */
export function chosenExercises(exercises, chosen) {
  return exercises.filter((exercise) => chosen.has(exercise.id));
}
