"use client";

import { useTransition } from "react";
import Image from "next/image";
import { removeStudent } from "@/app/dashboard/coach/actions";

function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export default function StudentList({ students }) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(studentId, displayName) {
    if (!confirm(`¿Eliminar a ${displayName} de tu lista?`)) return;
    startTransition(async () => {
      try {
        await removeStudent(studentId);
      } catch {
        alert("Error al eliminar el alumno.");
      }
    });
  }

  if (students.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-hair bg-glass p-10 text-center">
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto text-faint"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="mt-3 text-sm font-medium text-muted">
          No hay alumnos vinculados aún
        </p>
        <p className="mt-1 text-xs text-faint">
          Generá un código y compartilo con tu alumno.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((student) => (
        <div
          key={student.id}
          className="flex items-center gap-4 rounded-[16px] border border-hair bg-glass p-4 transition hover:bg-glass2"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-glass2 text-sm font-semibold text-teal2">
            {student.photoURL ? (
              <Image
                src={student.photoURL}
                alt=""
                width={40}
                height={40}
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              (student.displayName || "?").charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">
              {student.displayName}
            </p>
            {student.email && (
              <p className="truncate text-xs text-faint">{student.email}</p>
            )}
          </div>

          <span className="shrink-0 text-xs text-faint">
            {formatDate(student.linkedAt)}
          </span>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleRemove(student.studentId, student.displayName)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-red-500/15 hover:text-red-400"
            title="Eliminar alumno"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
