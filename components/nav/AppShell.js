"use client";

import { usePathname } from "next/navigation";

export default function AppShell({ children }) {
  const pathname = usePathname() || "/";

  return (
    <main className="min-h-screen bg-bg text-text antialiased">
      <div key={pathname} className="d2-route-transition">
        {children}
      </div>
    </main>
  );
}
