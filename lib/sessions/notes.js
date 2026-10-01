/**
 * Notas por ejercicio que se escriben mientras se entrena ("subir 2,5 kg la
 * próxima", "molestó el hombro").
 *
 * Viven en cada ejercicio de la sesión guardada (`sessions/{id}.exercises[].note`)
 * y no en la rutina: la rutina dice qué hacer (eso es `techniqueNote`), la
 * sesión cuenta cómo salió. La próxima vez que se entrena ese ejercicio se
 * muestra la última nota, que es para lo que se escribe.
 */

export const EXERCISE_NOTE_MAX = 500;

/** Texto limpio y acotado, o "" si no hay nada que guardar. */
export function cleanExerciseNote(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, EXERCISE_NOTE_MAX).trim();
}

/**
 * Los ejercicios de una sesión con la nota saneada: se guarda solo si tiene
 * texto, así las sesiones sin notas quedan exactamente como antes.
 */
export function withCleanNotes(exercises) {
  return (exercises || []).map((exercise) => {
    const { note, ...rest } = exercise || {};
    const clean = cleanExerciseNote(note);
    return clean ? { ...rest, note: clean } : rest;
  });
}

/**
 * La nota más reciente de cada ejercicio, de una lista de sesiones.
 *
 * No da por hecho que las sesiones vengan ordenadas: se queda con la de
 * `finishedAt` más nuevo. Una sesión sin nota para ese ejercicio no pisa una
 * nota anterior, porque lo útil es "lo último que anotaste", no "lo que
 * anotaste en la última sesión".
 */
export function lastNotesByExercise(sessions) {
  const result = {};
  for (const session of sessions || []) {
    const when = session?.finishedAt ? Date.parse(session.finishedAt) : 0;
    for (const exercise of session?.exercises || []) {
      const note = cleanExerciseNote(exercise?.note);
      if (!note || !exercise?.exerciseId) continue;
      const previous = result[exercise.exerciseId];
      if (!previous || when > previous.at) {
        result[exercise.exerciseId] = { note, at: when, finishedAt: session.finishedAt || null };
      }
    }
  }

  return Object.fromEntries(
    Object.entries(result).map(([id, { note, finishedAt }]) => [id, { note, finishedAt }]),
  );
}
