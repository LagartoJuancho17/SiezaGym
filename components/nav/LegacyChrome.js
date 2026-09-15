"use client";

import { usePathname } from "next/navigation";
import { isRedesigned } from "@/lib/nav/redesigned";

/**
 * Chrome viejo (TopNavbar + BottomNav bordo).
 *
 * Las pantallas ya rediseñadas traen su propia navegación y quedan afuera. La
 * lista de rutas vive en lib/nav/redesigned.js, que se prueba aparte.
 */
export default function LegacyChrome({ top, bottom, children }) {
  const pathname = usePathname() || "/";
  const redesigned = isRedesigned(pathname);

  return (
    <>
      {!redesigned && top}
      <main className="w-full min-h-screen">{children}</main>
      {!redesigned && bottom}
    </>
  );
}
