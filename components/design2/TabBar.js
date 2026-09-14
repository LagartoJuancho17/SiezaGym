"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ListIcon, ClockIcon, TrendIcon, UserIcon } from "./Icons";

const TABS = [
  { href: "/", label: "Inicio", Icon: HomeIcon, match: (path) => path === "/" },
  { href: "/rutinas", label: "Rutinas", Icon: ListIcon, match: (path) => path.startsWith("/rutinas") },
  { href: "/historial", label: "Historial", Icon: ClockIcon, match: (path) => path.startsWith("/historial") },
  { href: "/progreso", label: "Progreso", Icon: TrendIcon, match: (path) => path.startsWith("/progreso") },
  { href: "/perfil", label: "Perfil", Icon: UserIcon, match: (path) => path.startsWith("/perfil") },
];

/**
 * Barra inferior del rediseño: la sección activa es una pastilla negra con la
 * etiqueta y un disco blanco; el resto son discos de vidrio sin texto.
 */
export default function TabBar() {
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-3"
    >
      {/* La referencia tiene cuatro destinos y la app tiene cinco, asi que el
          ancho no sobra. El contenedor reparte con justify-between y la
          etiqueta activa se recorta antes que desbordar la pantalla. */}
      <div className="flex w-full max-w-[420px] items-center justify-between gap-1.5">
        {TABS.map(({ href, label, Icon, match }) => {
          const isActive = match(pathname);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex h-[54px] min-w-0 flex-1 items-center gap-2 rounded-full bg-[var(--d2-ink)] py-1.5 pl-4 pr-1.5 text-white shadow-[0_10px_30px_rgba(17,19,21,0.4)]"
                  : "d2-glass flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full transition active:scale-95"
              }
            >
              {isActive ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{label}</span>
                  <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-white text-[var(--d2-ink)]">
                    <Icon size={20} width={1.9} />
                  </span>
                </>
              ) : (
                <Icon size={20} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
