/**
 * Temas del rediseño.
 *
 * Cada tema es un bloque de variables en app/design2.css bajo
 * `.d2[data-d2-theme="..."]`. Acá solo viven el listado y el default, para que
 * agregar uno sea: escribir el bloque CSS y sumar una línea a THEMES.
 */
export const THEMES = [
  { id: "noche", label: "Noche", hint: "Negro con degradado" },
  { id: "plata", label: "Plata", hint: "Calcado de la referencia" },
  { id: "brasa", label: "Brasa", hint: "El bordo de SiezaGym" },
];

export const DEFAULT_THEME = "noche";

/** Donde se recuerda el tema elegido desde el selector. */
export const THEME_STORAGE_KEY = "d2-theme";

/**
 * El selector es una herramienta para diseñar, no una función del producto: por
 * eso solo aparece en desarrollo. Poné `true` si querés mostrarlo también en
 * producción (por ejemplo, para enseñar los temas en la defensa del TP).
 */
export const SHOW_THEME_SWITCHER = process.env.NODE_ENV === "development";

export function isValidTheme(id) {
  return THEMES.some((theme) => theme.id === id);
}
