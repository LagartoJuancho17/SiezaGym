/**
 * Semana de la portada.
 *
 * Todo el calculo va en UTC sobre las claves de texto "YYYY-MM-DD": la zona
 * horaria ya se resolvio antes, cuando `toLocalDayKey` convirtio cada sesion a
 * su dia en Argentina. Volver a usar fechas locales aca correria el dia en un
 * runtime que no esta en Buenos Aires.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAY_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];

const MONTH_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const pad = (value) => String(value).padStart(2, "0");

function toUTC(dayKey) {
  const [year, month, day] = String(dayKey).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function toKey(ms) {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Lunes de la semana en la que cae ese dia. La semana arranca en lunes. */
export function mondayKeyOf(dayKey) {
  const ms = toUTC(dayKey);
  const weekday = (new Date(ms).getUTCDay() + 6) % 7;
  return toKey(ms - weekday * DAY_MS);
}

/** Mueve N semanas: negativo hacia atras, positivo hacia adelante. */
export function shiftWeeks(mondayKey, delta) {
  return toKey(toUTC(mondayKey) + Number(delta || 0) * 7 * DAY_MS);
}

/** Los siete dias de la semana, de lunes a domingo. */
export function weekCells(mondayKey, { trainedDayKeys = [], todayKey = null } = {}) {
  const trained = trainedDayKeys instanceof Set ? trainedDayKeys : new Set(trainedDayKeys);
  const start = toUTC(mondayKey);

  return Array.from({ length: 7 }, (_, index) => {
    const ms = start + index * DAY_MS;
    const key = toKey(ms);
    return {
      key,
      day: new Date(ms).getUTCDate(),
      initial: WEEKDAY_INITIALS[index],
      trained: trained.has(key),
      isToday: key === todayKey,
      // No se puede entrenar en el futuro: esos dias se muestran apagados en
      // vez de como dias sin entrenar.
      isFuture: todayKey ? key > todayKey : false,
    };
  });
}

/** "8 – 14 sep" y, si la semana cruza de mes, "29 sep – 5 oct". */
export function weekRangeLabel(mondayKey) {
  const start = new Date(toUTC(mondayKey));
  const end = new Date(toUTC(mondayKey) + 6 * DAY_MS);
  const startMonth = MONTH_SHORT[start.getUTCMonth()];
  const endMonth = MONTH_SHORT[end.getUTCMonth()];

  if (startMonth === endMonth) {
    return `${start.getUTCDate()} – ${end.getUTCDate()} ${endMonth}`;
  }
  return `${start.getUTCDate()} ${startMonth} – ${end.getUTCDate()} ${endMonth}`;
}

/** Cuantos dias de esa semana se entreno. */
export function trainedDaysInWeek(mondayKey, trainedDayKeys) {
  return weekCells(mondayKey, { trainedDayKeys }).filter((cell) => cell.trained).length;
}

/** No se navega al futuro: no hay nada que mirar ahi. */
export function isCurrentWeek(mondayKey, todayKey) {
  return mondayKey === mondayKeyOf(todayKey);
}
