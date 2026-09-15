"use client";

import { usePathname } from "next/navigation";

/**
 * Chrome viejo (TopNavbar + BottomNav bordo).
 *
 * El rediseño (design2) va pantalla por pantalla y trae su propia navegación,
 * así que las que ya se rediseñaron se excluyen acá. Cuando el rediseño cubra
 * toda la app, esto se borra junto con los componentes viejos.
 */
const REDESIGNED = ["/", "/rutinas"];

export default function LegacyChrome({ top, bottom, children }) {
  const pathname = usePathname() || "/";
  const isRedesigned = REDESIGNED.includes(pathname);

  return (
    <>
      {!isRedesigned && top}
      <main className="w-full min-h-screen">{children}</main>
      {!isRedesigned && bottom}
    </>
  );
}
