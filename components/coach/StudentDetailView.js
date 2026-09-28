"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/design2/PageShell";
import Image from "next/image";
import StudentVolumeChart from "@/components/coach/StudentVolumeChart";
import { assignRoutineToStudentAction, unassignRoutineAction } from "@/app/dashboard/coach/actions";
import "./coach-design2.css";

function formatDateTime(iso) {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

function formatDuration(totalSec) {
  const mins = Math.round((totalSec || 0) / 60);
  return mins < 1 ? "<1 min" : `${mins} min`;
}

export default function StudentDetailView({
  studentProfile,
  sessions = [],
  catalogExercises = [],
  assignments = [],
  coachRoutines = [],
}) {
  const router = useRouter();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState(coachRoutines[0]?.id || "");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unassigningId, setUnassigningId] = useState(null);

  const studentTargetId = studentProfile.studentId || studentProfile.uid || studentProfile.id;
  const exerciseLookup = new Map((catalogExercises || []).map((e) => [e.id, e]));
  const chartPoints = [...(sessions || [])].reverse();
  const initial = (studentProfile.displayName || "?").charAt(0).toUpperCase();

  // Agrupar asignaciones por semana
  const assignmentsByWeek = new Map();
  for (const asg of assignments || []) {
    const wk = asg.weekNumber != null ? asg.weekNumber : 0;
    if (!assignmentsByWeek.has(wk)) {
      assignmentsByWeek.set(wk, []);
    }
    assignmentsByWeek.get(wk).push(asg);
  }

  const sortedWeeks = [...assignmentsByWeek.keys()].sort((a, b) => {
    if (a === 0) return 1;
    if (b === 0) return -1;
    return a - b;
  });

  async function handleAssign(e) {
    e.preventDefault();
    if (!selectedRoutineId) {
      setError("Por favor elegí una rutina para asignar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await assignRoutineToStudentAction({
        studentId: studentTargetId,
        routineId: selectedRoutineId,
        weekNumber: selectedWeek,
        note,
      });
      setAssignModalOpen(false);
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err.message || "Error al asignar la rutina.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnassign(assignmentId) {
    if (!window.confirm("¿Seguro que querés quitar esta rutina asignada?")) return;
    setUnassigningId(assignmentId);
    try {
      await unassignRoutineAction({
        studentId: studentTargetId,
        assignmentId,
      });
      router.refresh();
    } catch (err) {
      alert(err.message || "Error al quitar la rutina.");
    } finally {
      setUnassigningId(null);
    }
  }

  return (
    <PageShell
      title={studentProfile.displayName || "Sin nombre"}
      eyebrow="Seguimiento del alumno"
      backHref="/dashboard/coach"
      backLabel="Volver a alumnos"
    >
      <div className="d2-coach-stack">
        <header className="d2-glass d2-coach-row">
          <div className="d2-student-initial overflow-hidden">
            {studentProfile.photoURL ? (
              <Image
                src={studentProfile.photoURL}
                alt=""
                width={44}
                height={44}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              initial
            )}
          </div>
          <div className="d2-student-body">
            <p className="d2-student-name">
              {studentProfile.displayName || "Sin nombre"}
            </p>
            <p className="d2-student-mail">{studentProfile.email}</p>
          </div>
        </header>

        <div className="d2-coach-summary">
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Sesiones recientes</p>
            <p className="d2-coach-number">{sessions.length}</p>
          </div>
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Última sesión</p>
            <p className="d2-student-name mt-2">
              {sessions[0] ? formatShortDate(sessions[0].finishedAt) : "—"}
            </p>
          </div>
        </div>

        {/* Sección de Asignación Semanal de Rutinas */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="d2-coach-section-title mb-0">Programa semanal de rutinas</p>
              <p className="d2-coach-muted">Rutinas asignadas organizadas por semana</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSelectedRoutineId(coachRoutines[0]?.id || "");
                setAssignModalOpen(true);
              }}
              className="d2-seg d2-seg-on flex items-center gap-1 cursor-pointer"
            >
              + Asignar rutina
            </button>
          </div>

          {(assignments || []).length === 0 ? (
            <div className="d2-glass d2-empty">
              <p>Todavía no le asignaste ninguna rutina a este alumno.</p>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSelectedRoutineId(coachRoutines[0]?.id || "");
                  setAssignModalOpen(true);
                }}
                className="d2-empty-action"
              >
                + Asignar primera rutina
              </button>
            </div>
          ) : (
            <div className="d2-coach-stack">
              {sortedWeeks.map((wk) => {
                const weekAssignments = assignmentsByWeek.get(wk) || [];
                const weekLabel = wk > 0 ? `Semana ${wk}` : "Sin semana específica";

                return (
                  <div key={wk} className="d2-coach-stack">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted px-1">
                      {weekLabel}
                    </p>
                    {weekAssignments.map((asg) => (
                      <div key={asg.id} className="d2-glass d2-coach-card">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="d2-student-name">{asg.routineName}</p>
                            <p className="d2-coach-muted mt-1">
                              {asg.exercises?.length || 0}{" "}
                              {asg.exercises?.length === 1 ? "ejercicio" : "ejercicios"}
                              {asg.lastCompletedAt
                                ? ` · Completada el ${formatShortDate(asg.lastCompletedAt)}`
                                : " · Pendiente"}
                            </p>
                            {asg.note && (
                              <p className="text-xs text-muted mt-1 italic">
                                &ldquo;{asg.note}&rdquo;
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnassign(asg.id)}
                            disabled={unassigningId === asg.id}
                            className="d2-coach-muted cursor-pointer hover:underline text-xs p-1"
                          >
                            {unassigningId === asg.id ? "Quitando..." : "Quitar"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <p className="d2-coach-section-title">
            Volumen por sesión
          </p>
          <StudentVolumeChart points={chartPoints} />
        </section>

        <section>
          <p className="d2-coach-section-title">
            Historial por fecha y rutina
          </p>
          {sessions.length === 0 ? (
            <p className="d2-glass d2-empty">
              Todavía no entrenó.
            </p>
          ) : (
            <div className="d2-coach-stack">
              {sessions.map((session) => (
                <div key={session.id} className="d2-glass d2-coach-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="d2-student-name">
                        {session.routineName || "Sesión libre"}
                      </p>
                      <p className="d2-coach-muted mt-1">
                        {formatDateTime(session.finishedAt)} · {formatDuration(session.durationSeconds)}
                      </p>
                    </div>
                    <span className="d2-coach-value">
                      {session.totalVolumeKg}kg
                    </span>
                  </div>
                  <div className="d2-coach-sets">
                    {session.exercises.map((exerciseInSession, i) => {
                      const catalogExercise = exerciseLookup.get(exerciseInSession.exerciseId);
                      return (
                        <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                          <span className="font-medium">
                            {catalogExercise?.nameEs || "Ejercicio"}
                          </span>
                          <span className="d2-coach-muted">
                            {(exerciseInSession.sets || [])
                              .map((s) => `${s.weight}kg×${s.reps}`)
                              .join(", ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Asignación por Semana */}
      {assignModalOpen && (
        <div className="d2-modal">
          <div className="d2-glass-strong d2-modal-card">
            <h2 className="d2-modal-title">Asignar rutina por semana</h2>
            <p className="d2-modal-text">
              Asigná una rutina a {studentProfile.displayName || "este alumno"} para una semana determinada.
            </p>

            <form onSubmit={handleAssign} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="d2-label block mb-1">Elegí la rutina</label>
                {coachRoutines.length === 0 ? (
                  <p className="text-xs text-muted">
                    No tenés rutinas creadas todavía. Creá una desde la sección Rutinas.
                  </p>
                ) : (
                  <select
                    value={selectedRoutineId}
                    onChange={(e) => setSelectedRoutineId(e.target.value)}
                    className="w-full d2-glass p-3 rounded-xl border border-[var(--d2-border)] text-sm"
                    style={{ background: "rgba(var(--d2-glass-tint), var(--d2-glass-1))", color: "var(--d2-text)" }}
                  >
                    {coachRoutines.map((r) => (
                      <option key={r.id} value={r.id} style={{ background: "var(--d2-bg)", color: "var(--d2-text)" }}>
                        {r.name} ({r.exercises?.length || 0} ejercicios)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="d2-label block mb-1">Semana del programa</label>
                <div className="d2-segs">
                  {[1, 2, 3, 4].map((wk) => (
                    <button
                      key={wk}
                      type="button"
                      className={`d2-seg ${selectedWeek === wk ? "d2-seg-on" : ""}`}
                      onClick={() => setSelectedWeek(wk)}
                    >
                      Semana {wk}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="d2-label block mb-1">Nota para el alumno (opcional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej: Mantener técnica estricta y subir 2.5kg"
                  className="w-full d2-glass p-3 rounded-xl border border-[var(--d2-border)] text-sm"
                  style={{ background: "rgba(var(--d2-glass-tint), var(--d2-glass-1))", color: "var(--d2-text)" }}
                />
              </div>

              {error && (
                <p className="d2-modal-text text-center text-xs" style={{ color: "var(--d2-error)" }}>
                  {error}
                </p>
              )}

              <div className="d2-modal-actions">
                <button
                  type="submit"
                  disabled={busy || coachRoutines.length === 0}
                  className="d2-modal-primary"
                >
                  {busy ? "Asignando..." : `Asignar a Semana ${selectedWeek}`}
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="d2-modal-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
