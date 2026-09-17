"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClockIcon, HomeIcon, PlayIcon, TrendIcon, UserIcon } from "./Icons";

/**
 * Los cinco destinos, en el mismo orden que la barra anterior.
 *
 * El orden importa mientras el rediseño no cubra toda la app: las pantallas que
 * todavía no pasaron muestran la barra vieja, y si las dos no coinciden, tocar
 * el mismo lugar lleva a pantallas distintas según dónde estés parado.
 */
const TABS = [
  { href: "/", label: "Inicio", Icon: HomeIcon, match: (path) => path === "/" },
  { href: "/rutinas", label: "Rutinas", Icon: PlayIcon, match: (path) => path.startsWith("/rutinas") },
  { href: "/historial", label: "Historial", Icon: ClockIcon, match: (path) => path.startsWith("/historial") },
  { href: "/progreso", label: "Progreso", Icon: TrendIcon, match: (path) => path.startsWith("/progreso") },
  { href: "/perfil", label: "Perfil", Icon: UserIcon, match: (path) => path.startsWith("/perfil") || path === "/dashboard" || path.startsWith("/dashboard/") },
];

/**
 * Navegación principal.
 *
 * En teléfono es la barra flotante de abajo: la sección activa es una pastilla
 * con la etiqueta y un disco; el resto, discos de vidrio sin texto.
 *
 * En pantalla ancha es un panel vertical a la izquierda con las cinco
 * etiquetas siempre a la vista. El marcado es el mismo en los dos casos y la
 * diferencia la hace el CSS: una barra que en escritorio esconde los nombres
 * obliga a adivinar por el icono, con lugar de sobra para escribirlos.
 */
export default function TabBar({ activePath } = {}) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath ?? "/";
  const activeIndex = TABS.findIndex((tab) => tab.match(pathname));

  return (
    <nav
      aria-label="Navegación principal"
      className="d2-tabbar"
    >
      <div className="d2-glass d2-tabbar-shell">
        <span
          className="d2-tab-indicator"
          aria-hidden="true"
          style={
            activeIndex >= 0
              ? { transform: `translateY(calc(${activeIndex} * (48px + 4px)))`, opacity: 1 }
              : { opacity: 0 }
          }
        />
        {TABS.map(({ href, label, Icon, match }) => {
          const isActive = match(pathname);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "d2-tab d2-tab-active" : "d2-orb d2-tab"}
            >
              <span className="d2-tab-label">{label}</span>
              <span className="d2-tab-icon">
                <Icon size={isActive ? 16 : 20} width={1.5} />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
