"use client";

import { useRef, useState } from "react";
import { assignRoutine } from "@/app/(app)/rutinas/[id]/actions";

export default function AssignStudentButton({ routineId, students, modalOpen, onClose }) {
  const [assigning, setAssigning] = useState(false);
  const [assignedTo, setAssignedTo] = useState(null);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  async function handleAssign(studentId, studentName) {
    setAssigning(true);
    setError(null);
    try {
      await assignRoutine(routineId, studentId);
      setAssignedTo(studentName);
      setTimeout(() => {
        onClose();
        setAssignedTo(null);
      }, 1500);
    } catch (err) {
      setError(err.message || "Error al asignar.");
    } finally {
      setAssigning(false);
    }
  }

  if (!modalOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="mx-4 w-full max-w-sm rounded-[24px] border border-hair bg-deep p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg uppercase tracking-wide text-text">
            Asignar rutina
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-faint transition hover:bg-glass2 hover:text-text"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
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

        <p className="mt-3 text-sm text-muted">
          Elegí el alumno al que querés asignarle esta rutina.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {assignedTo ? (
            <div className="rounded-[14px] border border-teal/30 bg-teal/10 p-4 text-center text-sm text-teal2">
              Asignada a {assignedTo}
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-[14px] border border-hair bg-glass p-4 text-center text-sm text-faint">
              No tenés alumnos vinculados.
            </div>
          ) : (
            students.map((student) => (
              <button
                key={student.studentId}
                type="button"
                disabled={assigning}
                onClick={() =>
                  handleAssign(student.studentId, student.displayName)
                }
                className="flex items-center gap-3 rounded-[14px] border border-hair bg-glass p-3 text-left transition hover:border-teal2 hover:bg-glass2 disabled:opacity-40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/20 text-sm font-semibold text-teal2">
                  {(student.displayName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {student.displayName || "Sin nombre"}
                  </p>
                  {student.email && (
                    <p className="truncate text-xs text-faint">
                      {student.email}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-[14px] border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-full border border-hair text-sm font-medium text-muted transition hover:bg-glass2 hover:text-text"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
