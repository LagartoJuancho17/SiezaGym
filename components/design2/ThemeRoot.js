"use client";

import { useTheme } from "./themeStore";

/**
 * Contenedor del rediseño: pone `data-d2-theme`, del que cuelgan todas las
 * variables de color, vidrio y fondo.
 *
 * El tema se cambia desde Perfil › Configuración. El estado vive en
 * components/design2/themeStore.js, así el selector y este contenedor leen lo
 * mismo y el fondo cambia en el momento.
 */
export default function ThemeRoot({ children, forcedTheme, className = "" }) {
  const theme = useTheme();

  return (
    <div className={`d2${className ? ` ${className}` : ""}`} data-d2-theme={forcedTheme || theme}>
      {children}
    </div>
  );
}
