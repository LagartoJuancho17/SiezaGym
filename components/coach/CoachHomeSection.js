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
      className="rounded-3xl border border-[#6B1717] bg-[#EDE8E1] p-4 sm:p-5 shadow-sm text-[#141414]"
    >
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#FF5733]" />
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF5733]">
            Panel Coach
          </p>
        </div>
        {isAdmin && (
          <span className="rounded-full border border-[#D5CEC4] bg-[#DFD8CE] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6E665E]">
            Admin
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex min-h-[105px] flex-col justify-between rounded-2xl border border-[#D5CEC4] bg-[#E3DDD3] p-3.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-[#141414]">Alumnos</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-[#FF5733]"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="font-sans text-2xl font-extrabold text-[#FF5733]">
              {students.length}
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-[#756C65]">
              {students.length === 1 ? "alumno activo" : "alumnos activos"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex min-h-[105px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#FF5733]/40 bg-[#FF5733]/10 p-3.5 text-center transition hover:bg-[#FF5733]/20 active:scale-95"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF5733]/20 text-[#FF5733]">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </div>
          <span className="text-xs font-bold text-[#FF5733]">
            + Agregar alumno
          </span>
        </button>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold text-[#6E665E]">
          Alumnos vinculados ({students.length})
        </p>
        <StudentList students={students} onOpenAdd={() => setModalOpen(true)} />
      </div>

      <AddStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
