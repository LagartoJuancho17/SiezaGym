"use client";

import { THEMES } from "./themes";
import { setTheme, useTheme } from "./themeStore";

/**
 * Elegir el fondo de la app.
 *
 * Cada opción dibuja el degradado real de su tema (`data-d2-vars` le presta las
 * variables de ese bloque del CSS), así lo que se toca es lo que se ve y no una
 * copia del color escrita a mano que se desactualiza al retocar el tema.
 *
 * El cambio es inmediato: ThemeRoot lee el mismo estado y repinta la pantalla.
 */
export default function ThemePicker() {
  const theme = useTheme();

  return (
    <div className="d2-themes" role="radiogroup" aria-label="Tema de la aplicación">
      {THEMES.map((item) => {
        const active = item.id === theme;

        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(item.id)}
            className={active ? "d2-theme d2-theme-on" : "d2-theme"}
          >
            <span className="d2-theme-dot" data-d2-vars={item.id} aria-hidden />
            <span className="d2-theme-name">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
