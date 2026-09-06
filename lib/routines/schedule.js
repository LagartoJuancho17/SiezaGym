// Agrupa rutinas en mes -> semana para la vista de Rutinas.
//
// Importante: la app no tiene programacion semanal. Nadie dice "esta rutina va
// en la semana 2". Lo unico real es cuando se creo la rutina (createdAt) o
// cuando el coach la asigno (assignedAt), asi que agrupamos por eso.

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Fecha con la que cada item entra al calendario. */
export function referenceDateOf(item) {
  return item?.assignedAt || item?.createdAt || item?.lastUsedAt || null;
}

/** Semana del mes, 1 a 5. Dias 1-7 son la semana 1, 8-14 la 2, y asi. */
export function weekOfMonth(day) {
  return Math.ceil(day / 7);
}

export function monthLabel(year, monthIndex) {
  return `${MONTH_LABELS[monthIndex]} ${year}`;
}

/**
 * @param items rutinas y asignaciones ya enriquecidas
 * @param toParts (isoDate) => { year, month, day } en la zona horaria de la app
 * @returns meses del mas nuevo al mas viejo, con sus semanas de la 1 en adelante
 */
export function groupByMonthAndWeek(items, toParts) {
  const months = new Map();

  for (const item of items || []) {
    const iso = referenceDateOf(item);
    if (!iso) continue;
    const parts = toParts(iso);
    if (!parts) continue;

    const monthKey = `${parts.year}-${String(parts.month + 1).padStart(2, "0")}`;
    if (!months.has(monthKey)) {
      months.set(monthKey, {
        monthKey,
        year: parts.year,
        month: parts.month,
        label: monthLabel(parts.year, parts.month),
        weeks: new Map(),
        total: 0,
      });
    }

    const monthEntry = months.get(monthKey);
    const week = weekOfMonth(parts.day);
    if (!monthEntry.weeks.has(week)) {
      monthEntry.weeks.set(week, { week, label: `Semana ${week}`, items: [] });
    }
    monthEntry.weeks.get(week).items.push(item);
    monthEntry.total += 1;
  }

  return [...months.values()]
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    .map((entry) => ({
      monthKey: entry.monthKey,
      label: entry.label,
      total: entry.total,
      weeks: [...entry.weeks.values()].sort((a, b) => a.week - b.week),
    }));
}

/** Rutinas sin ninguna fecha: no entran al calendario pero no se pierden. */
export function itemsWithoutDate(items) {
  return (items || []).filter((item) => !referenceDateOf(item));
}
