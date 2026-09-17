"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import "./coach-design2.css";
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
      <div className="d2-glass d2-empty">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="d2-coach-empty-title">
          No hay alumnos vinculados aún
        </p>
        <p className="d2-modal-text">
          Generá un código y compartilo con tu alumno.
        </p>
        {onOpenAdd && (
          <button
            type="button"
            onClick={onOpenAdd}
            className="d2-empty-action"
          >
            + Invitar alumno
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="d2-coach-stack">
      {students.map((student) => (
        <div
          key={student.id}
          className="d2-glass d2-coach-row"
        >
          <Link
            href={`/dashboard/coach/alumnos/${student.studentId}`}
            className="d2-coach-student-link"
          >
            <div className="d2-student-initial overflow-hidden">
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

            <div className="d2-student-body">
              <p className="d2-student-name">
                {student.displayName}
              </p>
              {student.email && (
                <p className="d2-student-mail">{student.email}</p>
              )}
            </div>

            <span className="d2-coach-linked-date">
              {formatDate(student.linkedAt)}
            </span>
          </Link>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleRemove(student.studentId, student.displayName)}
            className="d2-coach-icon-button"
            title="Eliminar alumno"
            aria-label={`Eliminar a ${student.displayName || "alumno"}`}
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
