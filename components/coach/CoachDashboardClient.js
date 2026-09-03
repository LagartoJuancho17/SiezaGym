"use client";

import { useState } from "react";
import Link from "next/link";
import AddStudentModal from "@/components/coach/AddStudentModal";
import StudentList from "@/components/coach/StudentList";

function formatActivityDate(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatActivityDuration(totalSec) {
  const mins = Math.round(totalSec / 60);
  return mins < 1 ? "<1 min" : `${mins} min`;
}

export default function CoachDashboardClient({ students, profile, recentActivity = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const firstName =
    profile?.displayName?.trim().split(/\s+/)[0] || "Entrenador";

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen max-w-md flex-col pt-[52px]">
        <header className="flex items-center gap-3 px-[18px] pb-4">
          <Link
            href="/"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-hair bg-glass text-faint transition hover:text-text"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
              {profile?.isCoach ? "Panel del entrenador" : "Panel del entrenador · vista admin"}
            </p>
            <h1 className="font-display mt-1 text-[23px] uppercase leading-none tracking-[0.005em]">
              {firstName}
            </h1>
          </div>
        </header>

        <div className="flex flex-col gap-3 px-[18px] pb-[100px]">
          <section className="grid grid-cols-2 gap-2.5">
            <div className="flex min-h-[100px] flex-col justify-between rounded-[22px] border border-hair bg-glass p-[15px]">
              <span className="text-[13px] font-semibold tracking-[-0.01em]">
                Alumnos
              </span>
              <div className="font-mono-digit text-2xl tracking-wide text-teal2">
                {students.length}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-teal/40 bg-teal/10 p-[15px] text-center transition hover:bg-teal/20"
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
          </section>

          <StudentList students={students} />

          {recentActivity.length > 0 && (
            <section className="mt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
                Actividad reciente
              </p>
              <div className="flex flex-col gap-2">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-hair bg-glass px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {activity.studentName}
                      </p>
                      <p className="truncate text-xs text-faint">
                        {activity.routineName} · {formatActivityDate(activity.completedAt)}
                      </p>
                    </div>
                    <span className="font-mono-digit shrink-0 text-sm text-teal2">
                      {formatActivityDuration(activity.durationSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="min-h-[30px] flex-1" />
      </div>

      <AddStudentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  );
}
