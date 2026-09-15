import { normalizeSearchText } from "@/lib/text/normalize";

/**
 * La portada muestra las dos últimas sesiones. Una búsqueda consulta todas
 * las sesiones recibidas, conserva su orden y acepta texto con o sin tildes.
 */
export function visibleActivities(activities, query) {
  const term = normalizeSearchText(String(query ?? "").trim());
  if (!term) return activities.slice(0, 2);
  return activities.filter((activity) => normalizeSearchText(activity.name).includes(term));
}
