"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountMenu from "@/components/home/AccountMenu";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/rutinas", label: "Workout" },
  { href: "/rutinas/planing", label: "Planing" },
  { href: "/progreso/calender", label: "Calender" },
  { href: "/progreso/achievements", label: "Achievements" },
  { href: "/progreso", label: "Health Status" },
];

export default function TopNavbar({ user, profile }) {
  const pathname = usePathname();

  const userInitial = (
    profile?.displayName ||
    user?.email ||
    "?"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <div className="pointer-events-none fixed top-4 left-0 right-0 z-50 hidden px-6 md:block">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between">
        {/* Left side: Empty / minimal logo spacer matching reference Image 1 */}
        <div className="w-12" />

        {/* Center: Frosted pill navbar matching Image 1 */}
        <nav
          aria-label="Navegación principal"
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2 py-1.5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        >
          {TABS.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href || (tab.href === "/rutinas" && pathname.startsWith("/rutinas")) || (tab.href === "/progreso" && pathname.startsWith("/progreso"));

            return (
              <Link
                key={tab.label}
                href={tab.href === "/rutinas/planing" ? "/rutinas" : tab.href.startsWith("/progreso/") ? "/progreso" : tab.href}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-white text-[#141414] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: 4 icons in frosted pill container matching Image 1 */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/20 bg-black/40 p-1 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {/* 1. Smartwatch / Timer Icon */}
          <Link
            href="/rutinas"
            aria-label="Dispositivo / Rutinas"
            title="Workout Tracker"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="4" width="10" height="16" rx="2" />
              <path d="M9 2h6M9 22h6" />
            </svg>
          </Link>

          {/* 2. Notifications Bell with red dot */}
          <button
            type="button"
            aria-label="Notificaciones"
            title="Notificaciones"
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5733]" />
          </button>

          {/* 3. User Avatar / Profile */}
          {user ? (
            <div className="[&_button]:h-8 [&_button]:w-8 [&_button]:border-transparent [&_button]:bg-white/15 [&_button]:text-white hover:[&_button]:bg-white/25">
              <AccountMenu
                initial={userInitial}
                photoURL={profile?.photoURL}
                email={profile?.email || user?.email}
                size="sm"
                variant="hero"
              />
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Iniciar sesión"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </Link>
          )}

          {/* 4. Settings Gear Icon */}
          <Link
            href="/perfil"
            aria-label="Ajustes"
            title="Ajustes"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
