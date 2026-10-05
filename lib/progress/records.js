import { estimatedOneRepMax } from "@/lib/epley";

/**
 * Récords personales por ejercicio, para que el entrenador vea cuánto levanta
 * su alumno. Puro: recibe sesiones (las de listUserSessions) y no toca
 * Firestore.
 *
 * Un PR es una serie que supera el mejor 1RM estimado (Epley) que ese
 * ejercicio tenía **antes**: la primera vez que se hace un ejercicio no es un
 * récord, es el punto de partida. Las series falladas no cuentan.
 */

const round = (value) => Math.round(value * 10) / 10;

function chronological(sessions) {
  return [...(sessions || [])].sort((a, b) =>
    String(a.finishedAt || "").localeCompare(String(b.finishedAt || "")),
  );
}

/**
 * Las sesiones con cada serie marcada `pr: true` si batió el récord de ese
 * momento. Devuelve copias, en el mismo orden en que llegaron.
 */
export function markRecordSets(sessions) {
  const best = new Map(); // exerciseId -> mejor 1RM hasta ahora
  const marked = new Map(); // session -> copia marcada

  for (const session of chronological(sessions)) {
    const exercises = (session.exercises || []).map((exercise) => {
      const before = best.get(exercise.exerciseId);
      let sessionBest = before ?? 0;
      const sets = (exercise.sets || []).map((set) => {
        const value = set.failed ? 0 : estimatedOneRepMax(set.weight, set.reps);
        const pr = before != null && value > sessionBest;
        if (value > sessionBest) sessionBest = value;
        return { ...set, pr };
      });
      if (sessionBest > 0) best.set(exercise.exerciseId, Math.max(before ?? 0, sessionBest));
      return { ...exercise, sets };
    });
    marked.set(session, { ...session, exercises });
  }

  return (sessions || []).map((session) => marked.get(session));
}

/**
 * El mejor de cada ejercicio: la serie con mayor 1RM estimado (con su peso,
 * reps y fecha), el peso más alto levantado, el máximo de repeticiones en
 * una serie (lo que cuenta en dominadas o flexiones sin peso) y en cuántos
 * entrenamientos apareció. Ordenado de mayor a menor 1RM.
 */
export function personalRecords(sessions, { limit = 20 } = {}) {
  const rows = new Map();

  for (const session of sessions || []) {
    for (const exercise of session.exercises || []) {
      if (!exercise.exerciseId) continue;
      const row = rows.get(exercise.exerciseId) || {
        exerciseId: exercise.exerciseId,
        bestOneRepMax: 0,
        bestSet: null,
        bestAt: null,
        maxWeightKg: 0,
        maxReps: 0,
        sessions: 0,
      };
      row.sessions += 1;
      for (const set of exercise.sets || []) {
        if (set.failed) continue;
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        if (weight > row.maxWeightKg) row.maxWeightKg = weight;
        if (reps > row.maxReps) row.maxReps = reps;
        const value = estimatedOneRepMax(weight, reps);
        // Empate: gana la más vieja, que es la que lo consiguió primero.
        const older = String(session.finishedAt || "") < String(row.bestAt || "~");
        if (value > row.bestOneRepMax || (value === row.bestOneRepMax && value > 0 && older)) {
          row.bestOneRepMax = value;
          row.bestSet = { weight, reps };
          row.bestAt = session.finishedAt || null;
        }
      }
      rows.set(exercise.exerciseId, row);
    }
  }

  return [...rows.values()]
    .filter((row) => row.bestOneRepMax > 0 || row.maxReps > 0)
    .map((row) => ({ ...row, bestOneRepMax: round(row.bestOneRepMax) }))
    .sort((a, b) => b.bestOneRepMax - a.bestOneRepMax || b.maxReps - a.maxReps)
    .slice(0, limit);
}
