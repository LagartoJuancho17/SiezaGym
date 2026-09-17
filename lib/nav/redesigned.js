/**
 * Qué pantallas ya pasaron por el rediseño (design2).
 *
 * El rediseño avanza pantalla por pantalla y cada pantalla rediseñada trae su
 * propia navegación, así que el chrome viejo (TopNavbar + BottomNav bordo) se
 * apaga en estas rutas. Cuando el rediseño cubra toda la app, este módulo y
 * LegacyChrome se borran juntos.
 *
 * Vive separado del componente para poder probarlo: acertar o no una ruta
 * dinámica es la diferencia entre una pantalla limpia y una con dos barras.
 */

const EXACT = ["/", "/rutinas", "/rutinas/nueva", "/perfil", "/progreso", "/historial", "/dashboard", "/dashboard/items", "/dashboard/coach"];

// El detalle de una rutina y su edición son rutas dinámicas: el id es cualquier
// cosa menos una barra.
const PATTERNS = [/^\/rutinas\/[^/]+$/, /^\/rutinas\/[^/]+\/editar$/, /^\/historial\/[^/]+$/, /^\/progreso\/[^/]+$/, /^\/dashboard\/coach\/alumnos\/[^/]+$/, /^\/dashboard\/items\/[^/]+\/edit$/];

export function isRedesigned(pathname) {
  const path = pathname || "/";
  if (EXACT.includes(path)) return true;
  return PATTERNS.some((pattern) => pattern.test(path));
}
