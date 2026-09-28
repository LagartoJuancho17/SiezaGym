/**
 * Temas del rediseño.
 *
 * Cada tema es un bloque de variables en app/design2.css bajo
 * `.d2[data-d2-theme="..."]`. Acá solo viven el listado y el default, para que
 * agregar uno sea: escribir el bloque CSS y sumar una línea a THEMES.
 */
export const THEMES = [
  { id: "noche", label: "Noche", hint: "Negro con degradado" },
  { id: "plata", label: "Plata", hint: "Gris humo y vidrio esmerilado" },
  { id: "brasa", label: "Brasa", hint: "El bordo de SiezaGym" },
  { id: "electrico", label: "Eléctrico", hint: "Azul eléctrico y magenta" },
  { id: "pliegues", label: "Pliegues", hint: "Luz cálida entre pliegues" },
  { id: "sieza", label: "SIEZA", hint: "Identidad de marca plana" },
];

export const DEFAULT_THEME = "plata";

/** Donde se recuerda el tema elegido desde el selector. */
export const THEME_STORAGE_KEY = "d2-theme-v2";

export function isValidTheme(id) {
  return THEMES.some((theme) => theme.id === id);
}
