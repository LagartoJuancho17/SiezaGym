"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { removeStudent } from "@/app/dashboard/coach/actions";

function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export default function StudentList({ students, onOpenAdd }) {
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
      <div className="rounded-2xl border border-dashed border-[#D5CEC4] bg-[#E3DDD3]/50 p-5 text-center">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto text-[#FF5733]/60"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="mt-2 text-xs font-bold text-[#141414]">
          No hay alumnos vinculados aún
        </p>
        <p className="mt-0.5 text-[11px] text-[#756C65]">
          Generá un código y compartilo con tu alumno.
        </p>
        {onOpenAdd && (
          <button
            type="button"
            onClick={onOpenAdd}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-[#FF5733] px-3 text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
          >
            + Invitar alumno
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((student) => (
        <div
          key={student.id}
          className="flex items-center gap-4 rounded-2xl border border-[#D5CEC4] bg-[#E3DDD3] p-4 transition hover:bg-[#DFD8CE]"
        >
          <Link
            href={`/dashboard/coach/alumnos/${student.studentId}`}
            className="flex min-w-0 flex-1 items-center gap-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FF5733] text-sm font-bold text-white">
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
              <p className="truncate text-sm font-bold text-[#141414]">
                {student.displayName}
              </p>
              {student.email && (
                <p className="truncate text-xs text-[#756C65]">{student.email}</p>
              )}
            </div>

            <span className="shrink-0 text-xs text-[#756C65]">
              {formatDate(student.linkedAt)}
            </span>
          </Link>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleRemove(student.studentId, student.displayName)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#756C65] transition hover:bg-red-500/15 hover:text-red-600"
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
