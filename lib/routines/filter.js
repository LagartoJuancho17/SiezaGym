import { normalizeSearchText } from "@/lib/text/normalize";

/**
 * Rutinas que quedan visibles con lo que se escribio en el buscador.
 * Ignora tildes y mayusculas, y conserva el orden recibido.
 */
export function visibleRoutines(items, query = "") {
  const term = normalizeSearchText(String(query ?? "").trim());
  if (!term) return items || [];
  return (items || []).filter((item) => normalizeSearchText(item.name || "").includes(term));
}

/**
 * Aplana los meses agrupados a una lista de secciones con sus rutinas juntas.
 *
 * La pantalla muestra los meses como un rotulo y no como un acordeon: llegar a
 * una rutina no puede costar dos clics en dos niveles desplegables.
 */
export function monthSections(months, undated = []) {
  const sections = (months || [])
    .map((month) => ({
      monthKey: month.monthKey,
      label: month.label,
      items: (month.weeks || []).flatMap((week) => week.items || []),
    }))
    .filter((section) => section.items.length > 0);

  // Una rutina sin fecha no entra en ningun mes. Va al final y no se descarta:
  // esconderla la haria desaparecer de la pantalla sin aviso.
  if (undated?.length) {
    sections.push({ monthKey: "__sin-fecha__", label: "Sin fecha", items: undated });
  }
  return sections;
}

/**
 * Los meses se muestran solo sin busqueda: con un termino escrito, cortar tres
 * resultados en secciones por mes los esconde en vez de ordenarlos.
 */
export function shouldGroupByMonth(query = "") {
  return String(query ?? "").trim() === "";
}
