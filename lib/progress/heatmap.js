/**
 * La grilla de días entrenados.
 *
 * Columnas = semanas de lunes a domingo, filas = día de la semana, igual que
 * cualquier grilla de actividad. Es una función pura para poder probarla: la
 * aritmética de semanas y el corte de los meses es justo donde se cuela un día
 * corrido.
 */

import { toLocalDayKey } from "@/lib/sessions/streak";

export const DAY_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Suma días sobre una clave "YYYY-MM-DD" sin cruzar husos ni horario de verano. */
function shiftDays(dayKey, days) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** El lunes de la semana de esa clave. */
export function mondayOf(dayKey) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  // getUTCDay: 0 es domingo. La semana acá arranca el lunes.
  const offset = (date.getUTCDay() + 6) % 7;
  return shiftDays(dayKey, -offset);
}

/**
 * Las últimas `weeks` semanas hasta la actual, incluida.
 *
 * Los días que todavía no pasaron van marcados aparte: no haber entrenado
 * mañana no es lo mismo que haberte salteado ayer.
 */
export function heatmapWeeks(trainedDayKeys, { weeks = 26, todayKey = toLocalDayKey(new Date()) } = {}) {
  const trained = new Set(trainedDayKeys || []);
  const lastMonday = mondayOf(todayKey);
  const firstMonday = shiftDays(lastMonday, -(weeks - 1) * 7);

  const columns = [];
  const monthTicks = [];
  let previousMonth = null;

  for (let week = 0; week < weeks; week += 1) {
    const monday = shiftDays(firstMonday, week * 7);
    const month = monday.slice(5, 7);
    if (month !== previousMonth) {
      monthTicks.push({ week, label: MONTHS[Number(month) - 1] });
      previousMonth = month;
    }

    const days = [];
    for (let day = 0; day < 7; day += 1) {
      const key = shiftDays(monday, day);
      days.push({ key, trained: trained.has(key), isFuture: key > todayKey });
    }
    columns.push({ monday, days });
  }

  const desde = firstMonday;
  const total = columns.reduce(
    (count, column) => count + column.days.filter((day) => day.trained).length,
    0,
  );

  return { columns, monthTicks, total, desde };
}
