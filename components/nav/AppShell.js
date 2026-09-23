"use client";

import ActiveWorkoutBar from "@/components/design2/ActiveWorkoutBar";

export default function AppShell({ children }) {
  return (
    <main className="min-h-screen bg-bg text-text antialiased">
      {children}
      <ActiveWorkoutBar />
    </main>
  );
}

