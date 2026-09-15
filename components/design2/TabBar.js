"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PlayIcon, TrendIcon, UserIcon } from "./Icons";

const TABS = [
  { href: "/", label: "Inicio", Icon: HomeIcon, match: (path) => path === "/" },
  { href: "/progreso", label: "Progreso", Icon: TrendIcon, match: (path) => path.startsWith("/progreso") },
  { href: "/rutinas", label: "Rutinas", Icon: PlayIcon, match: (path) => path.startsWith("/rutinas") },
  { href: "/perfil", label: "Perfil", Icon: UserIcon, match: (path) => path.startsWith("/perfil") },
];

/**
 * Barra inferior del rediseño: la sección activa es una pastilla negra con la
 * etiqueta y un disco blanco; el resto son discos de vidrio sin texto.
 */
export default function TabBar({ activePath } = {}) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath ?? "/";

  return (
    <nav
      aria-label="Navegación principal"
      className="d2-tabbar"
    >
      {/* Historial se abre desde «Ver todo» en Actividad reciente. */}
      <div className="d2-glass d2-tabbar-shell">
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
              {isActive ? (
                <>
                  <span className="d2-tab-label">{label}</span>
                  <span className="d2-tab-active-icon">
                    <Icon size={16} width={1.5} />
                  </span>
                </>
              ) : (
                <Icon size={20} width={1.5} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
