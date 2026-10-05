/**
 * Colores y categorías de los bloques de una rutina (Movilidad, Fuerza...).
 *
 * `groupColor` en Firestore guarda uno de dos formatos:
 * - el id de un color de la paleta ("teal", "red"...), o
 * - un color libre "#rrggbb" elegido con el selector.
 *
 * Los siete primeros ids son los de siempre y la app de iOS los conoce por
 * nombre; los nuevos y los libres allá caen en "teal" (GroupColor.resuelto),
 * así que agregar colores acá no rompe nada del otro lado.
 */

export const GROUP_COLORS = [
  { id: "teal", label: "Verde azulado", hex: "#10b981" },
  { id: "amber", label: "Ámbar", hex: "#f59e0b" },
  { id: "blue", label: "Celeste", hex: "#38bdf8" },
  { id: "purple", label: "Violeta", hex: "#c084fc" },
  { id: "rose", label: "Rosa", hex: "#fb7185" },
  { id: "emerald", label: "Esmeralda", hex: "#34d399" },
  { id: "indigo", label: "Índigo", hex: "#818cf8" },
  { id: "red", label: "Rojo", hex: "#ef4444" },
  { id: "orange", label: "Naranja", hex: "#fb923c" },
  { id: "yellow", label: "Amarillo", hex: "#facc15" },
  { id: "lime", label: "Lima", hex: "#a3e635" },
  { id: "cyan", label: "Cian", hex: "#22d3ee" },
  { id: "pink", label: "Chicle", hex: "#f472b6" },
  { id: "fuchsia", label: "Fucsia", hex: "#e879f9" },
  { id: "slate", label: "Gris", hex: "#94a3b8" },
];

export const PRESET_GROUPS = [
  { name: "Calentamiento", color: "emerald" },
  { name: "Movilidad", color: "teal" },
  { name: "Fuerza", color: "amber" },
  { name: "Potencia", color: "red" },
  { name: "Hipertrofia", color: "orange" },
  { name: "Técnica", color: "cyan" },
  { name: "Core", color: "purple" },
  { name: "Superserie", color: "fuchsia" },
  { name: "Cardio", color: "rose" },
  { name: "Accesorios", color: "slate" },
  { name: "Estiramiento", color: "lime" },
  { name: "Descanso", color: "blue" },
];

const BY_ID = new Map(GROUP_COLORS.map((color) => [color.id, color]));
const HEX = /^#[0-9a-f]{6}$/i;

/** Sin grupo no hay color; con nombre y sin color, el de siempre: teal. */
export const DEFAULT_GROUP_COLOR = "teal";

export function isCustomColor(value) {
  return typeof value === "string" && HEX.test(value.trim());
}

/**
 * Lo que se guarda: un id conocido, un "#rrggbb" en minúsculas, o "".
 *
 * Cualquier otra cosa se descarta en vez de guardarse tal cual: el valor
 * termina en un atributo style y en un nombre de clase, y un string
 * arbitrario ahí no tiene nada que hacer.
 */
export function normalizeGroupColor(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (BY_ID.has(trimmed)) return trimmed;
  if (HEX.test(trimmed)) return trimmed.toLowerCase();
  return "";
}

/** El hex de cualquier valor guardado, o el de teal si no se reconoce. */
export function groupColorHex(value) {
  const normalized = normalizeGroupColor(value);
  if (BY_ID.has(normalized)) return BY_ID.get(normalized).hex;
  if (normalized) return normalized;
  return BY_ID.get(DEFAULT_GROUP_COLOR).hex;
}

export function groupColorLabel(value) {
  const normalized = normalizeGroupColor(value);
  if (BY_ID.has(normalized)) return BY_ID.get(normalized).label;
  return normalized ? "Color propio" : BY_ID.get(DEFAULT_GROUP_COLOR).label;
}

function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Clase y variables CSS para pintar un bloque.
 *
 * Los estilos de design2.css leen --d2-grp-c/-bg/-bd; con las variables en
 * línea cualquier color funciona igual, sin una regla CSS por color. La clase
 * se mantiene para los ids conocidos (y "d2-grp-custom" para los libres) por
 * si algo necesita distinguirlos.
 */
export function groupTone(value) {
  const normalized = normalizeGroupColor(value) || DEFAULT_GROUP_COLOR;
  const hex = groupColorHex(normalized);
  return {
    className: BY_ID.has(normalized) ? `d2-grp-${normalized}` : "d2-grp-custom",
    style: {
      "--d2-grp-c": hex,
      "--d2-grp-bg": rgba(hex, 0.12),
      "--d2-grp-bd": rgba(hex, 0.35),
    },
  };
}

/**
 * Los bloques que la persona ya usó en otras rutinas, para ofrecerlos de
 * nuevo con un toque: "Pierna pesada" en violeta una vez, y la próxima rutina
 * lo tiene a mano.
 *
 * Deja afuera los que ya son atajos fijos (mismo nombre y color), no repite
 * el mismo par nombre+color, y los ordena por cuántas veces se usaron.
 */
export function savedGroupPresets(routines, { limit = 8 } = {}) {
  const fixed = new Set(PRESET_GROUPS.map((preset) => `${preset.name.toLowerCase()}|${preset.color}`));
  const counts = new Map();

  for (const routine of routines || []) {
    for (const exercise of routine?.exercises || []) {
      const name = typeof exercise?.group === "string" ? exercise.group.trim() : "";
      if (!name) continue;
      const color = normalizeGroupColor(exercise.groupColor) || DEFAULT_GROUP_COLOR;
      const key = `${name.toLowerCase()}|${color}`;
      if (fixed.has(key)) continue;
      const entry = counts.get(key) || { name, color, uses: 0 };
      entry.uses += 1;
      counts.set(key, entry);
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name, "es"))
    .slice(0, limit)
    .map(({ name, color }) => ({ name, color }));
}
