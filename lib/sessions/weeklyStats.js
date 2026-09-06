// Estadisticas semanales para /progreso: volumen, sesiones y comparativa
// contra la semana anterior. Semana = lunes a domingo, siempre en horario
// Argentina, sin importar en que zona corre el server.
import { toLocalDayKey } from "./streak";

// Lunes 00:00 (hora Argentina) de la semana de `referenceDate`, devuelto como
// Date anclado al mediodia para que sumar/restar dias no cruce medianoche
// por DST/runtime (mismo truco que computeStreak).
export function startOfWeekLocal(referenceDate = new Date()) {
  const dayKey = toLocalDayKey(referenceDate);
  const result = new Date(`${dayKey}T12:00:00`);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  return result;
}

// Resta `days` dias a un Date anclado al mediodia y devuelve su day-key local.
function dayKeyMinus(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return toLocalDayKey(d);
}

// Volumen total (kg) de la semana actual. Usa totalVolumeKg ya calculado al
// crear la sesion (suma de peso x reps, sin series falladas).
export function computeWeeklyVolume(sessions, referenceDate = new Date()) {
  const weekStartKey = toLocalDayKey(startOfWeekLocal(referenceDate));
  return round2(
    (sessions || []).reduce((total, session) => {
      if (!session.finishedAt) return total;
      const dayKey = toLocalDayKey(new Date(session.finishedAt));
      if (dayKey < weekStartKey) return total;
      return total + (Number(session.totalVolumeKg) || 0);
    }, 0),
  );
}

// Sesiones de esta semana y de la anterior (lunes a domingo ambas).
export function computeWeeklySessionCounts(sessions, referenceDate = new Date()) {
  const weekStart = startOfWeekLocal(referenceDate);
  const thisWeekStartKey = toLocalDayKey(weekStart);
  const lastWeekStartKey = dayKeyMinus(weekStart, 7);

  let thisWeek = 0;
  let lastWeek = 0;
  for (const session of sessions || []) {
    if (!session.finishedAt) continue;
    const dayKey = toLocalDayKey(new Date(session.finishedAt));
    if (dayKey >= thisWeekStartKey) thisWeek += 1;
    else if (dayKey >= lastWeekStartKey) lastWeek += 1;
  }
  return { thisWeek, lastWeek };
}

// % de variacion de sesiones vs la semana anterior. null si no hay base
// (la semana pasada fue 0) o si ambas son 0: no tiene sentido mostrar numero.
export function computeEffectivenessPct(thisWeekCount, lastWeekCount) {
  const current = Number(thisWeekCount) || 0;
  const previous = Number(lastWeekCount) || 0;
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// Volumen por semana de las ultimas `weeksCount` semanas (incluye la actual,
// aunque este incompleta). Devuelve puntos en orden cronologico, con las
// semanas sin sesiones en 0 para que la linea no mienta.
// Cada punto: { weekStartKey: "YYYY-MM-DD", totalVolumeKg: number }
export function computeVolumeByWeek(sessions, weeksCount = 12, referenceDate = new Date()) {
  const weekStart = startOfWeekLocal(referenceDate);

  const volumeByWeekStart = new Map();
  for (const session of sessions || []) {
    if (!session.finishedAt) continue;
    const sessionWeekStartKey = toLocalDayKey(startOfWeekLocal(new Date(session.finishedAt)));
    volumeByWeekStart.set(
      sessionWeekStartKey,
      (volumeByWeekStart.get(sessionWeekStartKey) || 0) + (Number(session.totalVolumeKg) || 0),
    );
  }

  const points = [];
  for (let i = weeksCount - 1; i >= 0; i -= 1) {
    const weekStartKey = dayKeyMinus(weekStart, i * 7);
    points.push({
      weekStartKey,
      totalVolumeKg: round2(volumeByWeekStart.get(weekStartKey) || 0),
    });
  }
  return points;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
