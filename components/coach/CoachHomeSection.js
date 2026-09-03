"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddStudentModal from "@/components/coach/AddStudentModal";
import StudentList from "@/components/coach/StudentList";

export default function CoachHomeSection({ students, isAdmin }) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <section
      aria-label="Panel del entrenador"
      className="rounded-3xl border border-hair/80 bg-glass/60 p-4 sm:p-5 backdrop-blur-md"
    >
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-teal2" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Panel Coach
          </p>
        </div>
        {isAdmin && (
          <span className="rounded-full border border-hair bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
            Admin
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex min-h-[105px] flex-col justify-between rounded-2xl border border-hair/70 bg-glass/80 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-text">Alumnos</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-teal2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="font-mono-digit text-2xl font-bold text-teal2">
              {students.length}
            </div>
            <p className="mt-0.5 text-[11px] text-faint">
              {students.length === 1 ? "alumno activo" : "alumnos activos"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex min-h-[105px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-teal/40 bg-teal/10 p-3.5 text-center transition hover:bg-teal/20 active:scale-95"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal2">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-teal2">
            + Agregar alumno
          </span>
        </button>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-muted">
          Alumnos vinculados ({students.length})
        </p>
        <StudentList students={students} onOpenAdd={() => setModalOpen(true)} />
      </div>

      <AddStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
