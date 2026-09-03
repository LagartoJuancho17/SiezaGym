"use client";

import { usePathname } from "next/navigation";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main
      className={`min-h-screen transition-colors ${
        isHome ? "bg-[#f4f1ec] text-[#18120f]" : "bg-bg text-text"
      }`}
    >
      {children}
    </main>
  );
}
