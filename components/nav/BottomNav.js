"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isWorkout = pathname.startsWith("/rutinas") || pathname.startsWith("/sesion");
  const isHistory = pathname.startsWith("/historial");
  const isProgress = pathname.startsWith("/progreso");
  const isProfile = pathname.startsWith("/perfil");

  const NAV_ITEMS = [
    {
      href: "/",
      label: "Inicio",
      isActive: isHome,
      icon: (
        /* Bento / Dashboard layout icon: 2 rounded blocks on left, 1 tall rounded block on right */
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
          <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="2" />
          <rect x="4.5" y="13" width="6.5" height="6.5" rx="2" />
          <rect x="13" y="4.5" width="6.5" height="15" rx="2.5" />
        </svg>
      ),
    },
    {
      href: "/rutinas",
      label: "Rutinas",
      isActive: isWorkout,
      icon: (
        /* Solid Gym Dumbbell with inner & outer plates */
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
          <rect x="2" y="10.5" width="2" height="3" rx="0.8" />
          <rect x="4.5" y="7" width="2" height="10" rx="1" />
          <rect x="7" y="5" width="3" height="14" rx="1.2" />
          <rect x="9.5" y="10.5" width="5" height="3" />
          <rect x="14" y="5" width="3" height="14" rx="1.2" />
          <rect x="17.5" y="7" width="2" height="10" rx="1" />
          <rect x="20" y="10.5" width="2" height="3" rx="0.8" />
        </svg>
      ),
    },
    {
      href: "/historial",
      label: "Historial",
      isActive: isHistory,
      icon: (
        /* Solid Clipboard with top clip and cutout text lines */
        <svg viewBox="0 0 24 24" width="22" height="22">
          <rect x="8.5" y="2.5" width="7" height="3.5" rx="1.5" fill="#FFFFFF" />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7 5h10A2.5 2.5 0 0 1 19.5 7.5v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19.5v-12A2.5 2.5 0 0 1 7 5zm2 5.5a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1z"
          />
        </svg>
      ),
    },
    {
      href: "/progreso",
      label: "Progreso",
      isActive: isProgress,
      icon: (
        /* Solid Wall Calendar with top binder rings and cutout grid */
        <svg viewBox="0 0 24 24" width="22" height="22">
          <rect x="7.5" y="2.5" width="2" height="3.5" rx="1" fill="#FFFFFF" />
          <rect x="14.5" y="2.5" width="2" height="3.5" rx="1" fill="#FFFFFF" />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7 5h10A2.5 2.5 0 0 1 19.5 7.5v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19.5v-12A2.5 2.5 0 0 1 7 5zm0 4.5h10V18a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 18V9.5zm2.5 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
          />
        </svg>
      ),
    },
    {
      href: "/perfil",
      label: "Perfil",
      isActive: isProfile,
      icon: (
        /* Three horizontal dots */
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
          <circle cx="6" cy="12" r="2.2" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="18" cy="12" r="2.2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:hidden">
      <nav
        aria-label="Navegación móvil"
        className="pointer-events-auto flex items-center p-1 rounded-[10px] bg-[#B9B4B4] shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
        style={{
          width: "292px",
          height: "60px",
        }}
      >
        {NAV_ITEMS.map((item, idx) => {
          const isNextActive = idx < NAV_ITEMS.length - 1 && NAV_ITEMS[idx + 1].isActive;

          return (
            <div key={item.label} className="flex-1 h-full flex items-center">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={item.isActive ? "page" : undefined}
                className={`flex-1 h-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                  item.isActive
                    ? "rounded-[10px] bg-[#F1602F] text-white shadow-sm"
                    : "text-white hover:bg-black/[0.04]"
                }`}
              >
                {item.icon}
              </Link>

              {/* Exact vertical divider between adjacent inactive items matching reference screenshot */}
              {idx < NAV_ITEMS.length - 1 && !item.isActive && !isNextActive && (
                <div className="h-full w-[1px] bg-[#AFAAA9]" />
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
