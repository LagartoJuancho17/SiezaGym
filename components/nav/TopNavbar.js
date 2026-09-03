"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountMenu from "@/components/home/AccountMenu";

const TABS = [
  {
    href: "/",
    label: "Inicio",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/rutinas",
    label: "Rutinas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
      </svg>
    ),
  },
  {
    href: "/progreso",
    label: "Progreso",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 20V11" />
        <path d="M12 20V4" />
        <path d="M19 20v-6" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
  },
];

const NOT_BUILT_YET = new Set([]);

export default function TopNavbar({ user, profile }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const userInitial = (
    profile?.displayName ||
    user?.email ||
    "?"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <header
      className={`sticky top-0 z-40 hidden w-full backdrop-blur-xl md:block ${
        isHome ? "border-b border-black/[0.06] bg-[#f4f1ec]/90" : "border-b border-hair/80 bg-bg/85"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-[18px] sm:max-w-xl md:max-w-2xl lg:max-w-5xl lg:px-0">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition active:scale-98"
          aria-label="SiezaGym Inicio"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition ${
              isHome
                ? "bg-gradient-to-br from-orange-500 to-red-600 group-hover:shadow-[0_4px_16px_rgba(234,88,12,0.45)]"
                : "bg-gradient-to-br from-teal2 to-teal text-onlight group-hover:shadow-[0_4px_16px_rgba(63,169,188,0.5)]"
            }`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M6 5h2v14H6zm10 0h2v14h-2zM2 9h2v6H2zm18 0h2v6h-2zM7 11h10v2H7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span
              className={`font-display text-lg tracking-wider leading-none ${
                isHome ? "text-[#18120f]" : "text-white"
              }`}
            >
              SIEZAGYM
            </span>
            <span
              className={`text-[9.5px] font-semibold uppercase tracking-[0.18em] leading-tight ${
                isHome ? "text-orange-600" : "text-teal2"
              }`}
            >
              Training
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav
          aria-label="Navegación escritorio"
          className={`flex items-center gap-1 rounded-full border p-1 backdrop-blur-md ${
            isHome ? "border-black/[0.06] bg-white/70" : "border-hair/80 bg-glass/60"
          }`}
        >
          {TABS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            const isPending = NOT_BUILT_YET.has(tab.href);

            const linkClass = `flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              active
                ? isHome
                  ? "bg-[#18120f] text-white shadow-[0_2px_10px_rgba(24,18,15,0.2)]"
                  : "bg-teal/15 text-teal2 border border-teal/30 shadow-[0_0_12px_rgba(63,169,188,0.2)]"
                : isPending
                ? "text-faint/60 cursor-default"
                : isHome
                ? "text-[#7a716a] hover:bg-black/[0.04] hover:text-[#18120f]"
                : "text-muted hover:bg-glass2 hover:text-white"
            }`;

            if (isPending) {
              return (
                <button
                  key={tab.href}
                  type="button"
                  title="Próximamente"
                  className={linkClass}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            }

            return (
              <Link key={tab.href} href={tab.href} className={linkClass}>
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/rutinas/nueva"
            className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition hover:opacity-90 active:scale-95 ${
              isHome
                ? "bg-[#18120f] text-white shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
                : "bg-white text-onlight shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>Nueva rutina</span>
          </Link>

          {user ? (
            <AccountMenu
              initial={userInitial}
              photoURL={profile?.photoURL}
              email={profile?.email || user?.email}
              size="sm"
              variant={isHome ? "light" : "dark"}
            />
          ) : (
            <Link
              href="/login"
              className="text-xs font-semibold text-teal2 hover:underline"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
