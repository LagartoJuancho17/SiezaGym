// Agregados por semana para los anillos de la Home. Funciones puras: entran
// sesiones, sale el numero. Sin Firestore y sin React, para poder testearlo.
import { toLocalDayKey } from "@/lib/sessions/streak";

// La semana arranca el lunes, igual que la tira de dias de la app.
function mondayOf(date) {
  const key = toLocalDayKey(date);
  // Anclado al mediodia: restar dias desde medianoche puede cruzar de dia por
  // horario de verano o por la zona del runtime.
  const noon = new Date(`${key}T12:00:00`);
  const offset = (noon.getDay() + 6) % 7;
  noon.setDate(noon.getDate() - offset);
  return noon;
}

/** Clave "YYYY-MM-DD" del lunes de la semana en la que cae esa fecha. */
export function weekStartKey(date) {
  return toLocalDayKey(mondayOf(date));
}

/**
 * Volumen total por semana, de la mas nueva a la mas vieja.
 * Las sesiones sin fecha de fin no entran: no se sabe en que semana van.
 */
export function volumeByWeek(sessions) {
  const totals = new Map();

  for (const session of sessions || []) {
    if (!session?.finishedAt) continue;
    const key = weekStartKey(new Date(session.finishedAt));
    totals.set(key, (totals.get(key) || 0) + (Number(session.totalVolumeKg) || 0));
  }

  return [...totals.entries()]
    .map(([weekKey, kg]) => ({ weekKey, kg: Math.round(kg) }))
    .sort((a, b) => (a.weekKey < b.weekKey ? 1 : -1));
}

/** El mejor volumen semanal del historial. Es la referencia del anillo. */
export function bestWeekVolumeKg(sessions) {
  return volumeByWeek(sessions).reduce((best, week) => Math.max(best, week.kg), 0);
}

/**
 * Que tan buena viene la semana contra la mejor que hiciste.
 * Se recorta en 1: si esta es la mejor, el anillo se completa y no se pasa.
 */
export function weekVolumeShare(sessions, referenceDate = new Date()) {
  const weeks = volumeByWeek(sessions);
  const currentKey = weekStartKey(referenceDate);
  const current = weeks.find((week) => week.weekKey === currentKey)?.kg || 0;
  const best = weeks.reduce((max, week) => Math.max(max, week.kg), 0);

  return {
    kg: current,
    bestKg: best,
    share: best > 0 ? Math.min(1, current / best) : 0,
    isBest: current > 0 && current >= best,
  };
}

/** Dias distintos entrenados en la semana en curso, de 0 a 7. */
export function daysTrainedThisWeek(trainedDayKeys, referenceDate = new Date()) {
  const trained = new Set(trainedDayKeys || []);
  const monday = mondayOf(referenceDate);
  let count = 0;

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(monday);
    day.setDate(day.getDate() + offset);
    if (trained.has(toLocalDayKey(day))) count += 1;
  }
  return count;
}
