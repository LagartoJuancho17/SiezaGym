"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Inicio",
    icon: (
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    ),
  },
  {
    href: "/rutinas",
    label: "Rutinas",
    icon: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
      </>
    ),
  },
  {
    href: "/progreso",
    label: "Progreso",
    icon: (
      <>
        <path d="M5 20V11" />
        <path d="M12 20V4" />
        <path d="M19 20v-6" />
      </>
    ),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  },
];

// Rutas de estas tabs que todavia no existen como pantalla real - se
// muestran en el nav (matchea el diseño) pero no navegan a un 404.
const NOT_BUILT_YET = new Set(["/perfil"]);

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="sticky bottom-0 flex items-center gap-2.5 px-[18px] pb-6"
      style={{ background: "linear-gradient(to top, var(--bg) 58%, transparent)" }}
    >
      <div className="grid flex-1 grid-cols-4 items-center justify-items-center rounded-full border border-hair bg-nav p-1.5 backdrop-blur-[20px]">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const className = `flex h-[46px] w-[46px] items-center justify-center rounded-full transition ${
            active ? "bg-glass2 text-text" : "text-faint hover:text-text"
          }`;
          const icon = (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {tab.icon}
            </svg>
          );

          if (NOT_BUILT_YET.has(tab.href)) {
            return (
              <button key={tab.href} type="button" aria-label={tab.label} className={className}>
                {icon}
              </button>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} aria-label={tab.label} className={className}>
              {icon}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Empezar sesión vacía"
        className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(63,169,188,0.4)] transition hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(140deg, var(--teal2) 0%, var(--teal) 55%, #1C5F6C 100%)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
    </nav>
  );
}
