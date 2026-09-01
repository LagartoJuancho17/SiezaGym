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
    <section aria-label="Panel del entrenador" className="mb-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex min-h-[132px] flex-col justify-between rounded-[26px] border border-hair bg-glass p-[15px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[13px] font-semibold tracking-[-0.01em]">
              Alumnos
            </span>
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
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
            <div className="font-mono-digit text-2xl tracking-wide text-teal2">
              {students.length}
            </div>
            <p className="mt-2 text-[11px] text-faint">
              {students.length === 1 ? "alumno activo" : "alumnos activos"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-[26px] border border-dashed border-teal/40 bg-teal/10 p-[15px] text-center transition hover:bg-teal/20"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            className="text-teal2"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span className="text-[13px] font-semibold text-teal2">
            Agregar alumno
          </span>
        </button>
      </div>

      <h2 className="mb-2 mt-4 flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em]">
        Alumnos vinculados
        {isAdmin && (
          <span className="rounded-full border border-hair px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
            vista admin
          </span>
        )}
      </h2>

      <StudentList students={students} />

      <AddStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
