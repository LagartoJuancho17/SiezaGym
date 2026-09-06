"use client";

import { usePathname } from "next/navigation";

export default function AppShell({ children }) {
  return (
    <main className="min-h-screen bg-bg text-text antialiased">
      {children}
    </main>
  );
}
