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
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
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
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <rect x="2" y="10.75" width="1.5" height="2.5" rx="0.75" />
          <rect x="4" y="7.5" width="2" height="9" rx="1" />
          <rect x="6.5" y="5.5" width="2.5" height="13" rx="1.2" />
          <rect x="8.5" y="10.75" width="7" height="2.5" rx="0.5" />
          <rect x="15" y="5.5" width="2.5" height="13" rx="1.2" />
          <rect x="18" y="7.5" width="2" height="9" rx="1" />
          <rect x="20.5" y="10.75" width="1.5" height="2.5" rx="0.75" />
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
          <rect x="8.5" y="2.5" width="7" height="3.5" rx="1.5" fill="currentColor" />
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.5 5h9A2.5 2.5 0 0 1 19 7.5v12a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19.5v-12A2.5 2.5 0 0 1 7.5 5zm1.5 5.5a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1z"
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
          <rect x="7.5" y="2.5" width="2" height="3.5" rx="1" fill="currentColor" />
          <rect x="14.5" y="2.5" width="2" height="3.5" rx="1" fill="currentColor" />
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7 5h10A2.5 2.5 0 0 1 19.5 7.5v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19.5v-12A2.5 2.5 0 0 1 7 5zm0 4.5a.75.75 0 0 1 .75-.75h8.5a.75.75 0 1 1 0 1.5h-8.5A.75.75 0 0 1 7 9.5zm.5 2.75h1.5a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-1.5a.6.6 0 0 1-.6-.6v-.8a.6.6 0 0 1 .6-.6zm3.5 0h1.5a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-1.5a.6.6 0 0 1-.6-.6v-.8a.6.6 0 0 1 .6-.6zm3.5 0h1.5a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-1.5a.6.6 0 0 1-.6-.6v-.8a.6.6 0 0 1 .6-.6zm-7 3h1.5a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-1.5a.6.6 0 0 1-.6-.6v-.8a.6.6 0 0 1 .6-.6zm3.5 0h1.5a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-1.5a.6.6 0 0 1-.6-.6v-.8a.6.6 0 0 1 .6-.6zm3.5 0h1.5a.6.6 0 0 1 .6.6v.8a.6.6 0 0 1-.6.6h-1.5a.6.6 0 0 1-.6-.6v-.8a.6.6 0 0 1 .6-.6z"
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
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
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
        className="pointer-events-auto flex items-center gap-2.5 rounded-[10px] border border-white/20 bg-white/[0.08] p-2.5 shadow-[0_18px_48px_rgba(0,0,0,0.3)] backdrop-blur-lg"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            aria-current={item.isActive ? "page" : undefined}
            className={`flex h-[52px] w-[52px] items-center justify-center rounded-[10px] border transition-all duration-200 active:scale-95 ${
              item.isActive
                ? "border-white/30 bg-[#FF5524] text-white shadow-[0_6px_20px_rgba(255,85,36,0.55),inset_0_1px_0_rgba(255,255,255,0.35)]"
                : "border-white/80 bg-white/[0.88] text-[#2E2B28] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.18)] backdrop-blur-2xl backdrop-saturate-150 hover:bg-white"
            }`}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
    </div>
  );
}
