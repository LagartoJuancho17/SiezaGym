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
];

export const DEFAULT_THEME = "plata";

/** Donde se recuerda el tema elegido desde el selector. */
export const THEME_STORAGE_KEY = "d2-theme-v2";

/**
 * Herramienta de diseño optativa. El valor anterior de d2-theme no se migra:
 * todos ven el nuevo acabado plata al recibir esta versión del diseño.
 */
export const SHOW_THEME_SWITCHER = process.env.NODE_ENV === "development"
  && process.env.NEXT_PUBLIC_D2_THEME_SWITCHER === "true";

export function isValidTheme(id) {
  return THEMES.some((theme) => theme.id === id);
}
