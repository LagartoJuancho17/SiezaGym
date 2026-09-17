/**
 * Lo que dibuja la pantalla de progreso, sin React.
 *
 * Todo sale de las sesiones guardadas. Lo único estimado es el 1RM, que se
 * calcula con Epley a partir de una serie real, y la pantalla lo rotula como
 * estimado en vez de presentarlo como un peso levantado.
 */

import { estimatedOneRepMax } from "@/lib/epley";

/**
 * Kilos en una unidad que se lea de un vistazo.
 * Arriba de una tonelada el número entero deja de decir nada útil.
 */
export function formatKg(kg) {
  const value = Number(kg) || 0;
  if (value <= 0) return "0";
  if (value >= 1000) {
    const tons = value / 1000;
    return `${tons.toFixed(tons >= 10 ? 0 : 1).replace(".", ",")} t`;
  }
  return `${Math.round(value)} kg`;
}

/**
 * Las barras del volumen semanal, con la altura ya normalizada contra la
 * semana más alta.
 *
 * La altura sale relativa y no absoluta a propósito: el gráfico compara
 * semanas entre sí, no contra un objetivo que nadie fijó. Una semana en cero
 * conserva una línea mínima visible, porque una barra de altura cero se lee
 * como "no hay dato" y no como "no entrenaste".
 */
export function weekBars(points) {
  const rows = points || [];
  const max = rows.reduce((top, row) => Math.max(top, Number(row.totalVolumeKg) || 0), 0);

  return rows.map((row) => {
    const kg = Number(row.totalVolumeKg) || 0;
    return {
      key: row.weekStartKey,
      kg,
      empty: kg === 0,
      // 4% es el mínimo para que la barra vacía se vea como barra.
      heightPct: max > 0 ? Math.max(4, Math.round((kg / max) * 100)) : 4,
    };
  });
}

/** "+20%" / "−5%" / "—". El signo menos es el de verdad, no un guion. */
export function trendLabel(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return "—";
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `−${Math.abs(pct)}%`;
}

/**
 * Un renglón por ejercicio: cuántas veces lo hiciste, tu mejor marca estimada
 * y cuándo fue la última.
 *
 * Ordena por lo último entrenado y no por la mejor marca: la pregunta al abrir
 * progreso es "cómo vengo", y lo que estás entrenando ahora va primero.
 */
export function exerciseProgress(sessions, { limit = 12 } = {}) {
  const byExercise = new Map();

  for (const session of sessions || []) {
    for (const exercise of session.exercises || []) {
      if (!exercise.exerciseId) continue;

      const row = byExercise.get(exercise.exerciseId) || {
        exerciseId: exercise.exerciseId,
        sessions: 0,
        bestOneRepMax: 0,
        lastAt: null,
      };

      row.sessions += 1;
      if (session.finishedAt && (!row.lastAt || session.finishedAt > row.lastAt)) {
        row.lastAt = session.finishedAt;
      }
      for (const set of exercise.sets || []) {
        if (set.failed) continue;
        const value = estimatedOneRepMax(set.weight, set.reps);
        if (value > row.bestOneRepMax) row.bestOneRepMax = value;
      }

      byExercise.set(exercise.exerciseId, row);
    }
  }

  return [...byExercise.values()]
    .map((row) => ({ ...row, bestOneRepMax: Math.round(row.bestOneRepMax * 10) / 10 }))
    .sort((a, b) => String(b.lastAt || "").localeCompare(String(a.lastAt || "")))
    .slice(0, limit);
}
