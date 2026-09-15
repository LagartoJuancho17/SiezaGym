import { normalizeSearchText } from "@/lib/text/normalize";

/** Las tres solapas de la pantalla de Rutinas. */
export const ROUTINE_KINDS = ["todas", "propias", "asignadas"];

export const KIND_LABELS = {
  todas: "Todas",
  propias: "Propias",
  asignadas: "Asignadas",
};

function matchesKind(item, kind) {
  if (kind === "propias") return !item.isAssigned;
  if (kind === "asignadas") return !!item.isAssigned;
  return true;
}

/**
 * Rutinas que quedan visibles con la busqueda y la solapa elegidas.
 * La busqueda ignora tildes y mayusculas, y conserva el orden recibido.
 */
export function visibleRoutines(items, { query = "", kind = "todas" } = {}) {
  const term = normalizeSearchText(String(query ?? "").trim());
  const safeKind = ROUTINE_KINDS.includes(kind) ? kind : "todas";

  return (items || []).filter((item) => {
    if (!matchesKind(item, safeKind)) return false;
    if (!term) return true;
    return normalizeSearchText(item.name || "").includes(term);
  });
}

/** Cuantas rutinas hay de cada tipo, para los contadores de las solapas. */
export function countByKind(items) {
  const list = items || [];
  return {
    todas: list.length,
    propias: list.filter((item) => !item.isAssigned).length,
    asignadas: list.filter((item) => item.isAssigned).length,
  };
}

/**
 * Los meses solo se muestran cuando no hay filtro activo: con una busqueda en
 * curso, repartir tres resultados entre acordeones de mes y semana los esconde
 * en vez de mostrarlos.
 */
export function shouldGroupByMonth({ query = "", kind = "todas" } = {}) {
  return String(query ?? "").trim() === "" && kind === "todas";
}
