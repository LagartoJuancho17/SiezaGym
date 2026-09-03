const APP_TIMEZONE = "America/Argentina/Buenos_Aires";
const localDayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE });

// "YYYY-MM-DD" en horario Argentina, sin importar en que zona corre el runtime.
export function toLocalDayKey(date) {
  return localDayFormatter.format(date);
}

// Racha de dias consecutivos con al menos una sesion terminada. No se corta
// hasta medianoche del dia siguiente al ultimo entrenamiento (si hoy todavia
// no entrenaste pero entrenaste ayer, la racha sigue viva).
export function computeStreak(trainedDayKeys, referenceDate = new Date()) {
  const trained = new Set(trainedDayKeys);
  const today = toLocalDayKey(referenceDate);

  // Ancla al mediodia para que sumar/restar dias no cruce medianoche por DST/runtime.
  const cursor = new Date(`${today}T12:00:00`);
  if (!trained.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (trained.has(toLocalDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
