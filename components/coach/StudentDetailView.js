"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CoachPageShell from "@/components/coach/CoachPageShell";
import Image from "next/image";
import StudentVolumeChart from "@/components/coach/StudentVolumeChart";
import { SearchIcon, WeightIcon, ChevronDownIcon } from "@/components/design2/Icons";
import { estimatedOneRepMax, bestSetByEstimatedOneRepMax } from "@/lib/epley";
import { EQUIPMENT_LABELS } from "@/lib/exercises/constants";
import { assignRoutineToStudentAction, unassignRoutineAction } from "@/app/dashboard/coach/actions";
import "./coach-design2.css";

const SPANISH_MUSCLE_NAMES = {
  pecho: "Pecho",
  dorsal: "Dorsal",
  espaldaAltaTrapecio: "Espalda alta",
  deltoideAnterior: "Hombro ant.",
  deltoideLateral: "Hombro lat.",
  deltoidePosterior: "Hombro post.",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebrazo: "Antebrazo",
  cuadriceps: "Cuádriceps",
  isquiotibiales: "Isquiotibiales",
  gluteo: "Glúteos",
  aductores: "Aductores",
  gemelo: "Gemelos",
  abdomen: "Abdomen",
  lumbar: "Lumbar",
};

function getPrimaryMuscle(catalogExercise) {
  if (!catalogExercise?.muscleWeights) return null;
  const entries = Object.entries(catalogExercise.muscleWeights);
  if (!entries.length) return null;
  const sorted = entries.sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
  const top = sorted[0];
  if (!top || !top[0]) return null;
  return SPANISH_MUSCLE_NAMES[top[0]] || top[0];
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatShortDate(iso) {
  if (!iso) return "—";
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
  records = [],
}) {
  const router = useRouter();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState(coachRoutines[0]?.id || "");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unassigningId, setUnassigningId] = useState(null);

  // Historial controls
  const [historySearch, setHistorySearch] = useState("");
  const [selectedRoutineFilter, setSelectedRoutineFilter] = useState("ALL");
  const [expandedSessionIds, setExpandedSessionIds] = useState(() => {
    return new Set((sessions || []).slice(0, 3).map((s) => s.id));
  });

  const studentTargetId = studentProfile.studentId || studentProfile.uid || studentProfile.id;
  const exerciseLookup = new Map((catalogExercises || []).map((e) => [e.id, e]));
  const chartPoints = [...(sessions || [])].reverse();
  const initial = (studentProfile.displayName || "?").charAt(0).toUpperCase();

  // Métricas acumuladas del alumno
  const totalVolumeAll = (sessions || []).reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);
  const totalSetsAll = (sessions || []).reduce(
    (acc, s) => acc + (s.exercises || []).reduce((sum, e) => sum + (e.sets?.length || 0), 0),
    0
  );

  // Rutinas únicas presentes en el historial
  const uniqueRoutines = Array.from(
    new Set((sessions || []).map((s) => s.routineName || "Sesión libre").filter(Boolean))
  );

  // Filtrado de sesiones del historial
  const filteredSessions = (sessions || []).filter((session) => {
    const routineName = session.routineName || "Sesión libre";
    if (selectedRoutineFilter !== "ALL" && routineName !== selectedRoutineFilter) {
      return false;
    }
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();
    if (routineName.toLowerCase().includes(q)) return true;
    return (session.exercises || []).some((ex) => {
      const cat = exerciseLookup.get(ex.exerciseId);
      return (
        cat?.nameEs?.toLowerCase().includes(q) ||
        ex.exerciseId?.toLowerCase().includes(q)
      );
    });
  });

  function toggleSession(sessionId) {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }

  const allExpanded =
    (sessions || []).length > 0 &&
    (sessions || []).every((s) => expandedSessionIds.has(s.id));

  function toggleExpandAll() {
    if (allExpanded) {
      setExpandedSessionIds(new Set());
    } else {
      setExpandedSessionIds(new Set((sessions || []).map((s) => s.id)));
    }
  }

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
    <CoachPageShell
      title={studentProfile.displayName || "Sin nombre"}
      backHref="/dashboard/coach"
      backLabel="Volver a alumnos"
      active="students"
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

        {/* Resumen Global del Alumno */}
        <div className="d2-coach-summary">
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Sesiones recientes</p>
            <p className="d2-coach-number">{sessions.length}</p>
          </div>
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Volumen total</p>
            <p className="d2-coach-number">
              {totalVolumeAll >= 1000
                ? `${(totalVolumeAll / 1000).toFixed(1)}t`
                : `${totalVolumeAll}kg`}
            </p>
            <p className="d2-coach-muted font-mono-digit text-[11px] mt-0.5">
              {totalVolumeAll.toLocaleString("es-AR")} kg acumulados
            </p>
          </div>
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Series completadas</p>
            <p className="d2-coach-number">{totalSetsAll}</p>
            <p className="d2-coach-muted text-[11px] mt-0.5">
              en todo el historial
            </p>
          </div>
          <div className="d2-glass d2-coach-card">
            <p className="d2-coach-muted">Última sesión</p>
            <p className="d2-student-name mt-2">
              {sessions[0] ? formatShortDate(sessions[0].finishedAt) : "—"}
            </p>
            {sessions[0] && (
              <p className="d2-coach-muted text-[11px] truncate mt-0.5">
                {sessions[0].routineName || "Sesión libre"}
              </p>
            )}
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

        {/* Récords por ejercicio: el mejor 1RM estimado y su serie, o las
            reps máximas en los de peso corporal. */}
        {records.length > 0 && (
          <section>
            <div className="mb-2">
              <p className="d2-coach-section-title mb-0">Récords</p>
              <p className="d2-coach-muted">La mejor marca de cada ejercicio, de toda su historia</p>
            </div>
            <div className="d2-coach-records">
              {records.map((record) => {
                const name = exerciseLookup.get(record.exerciseId)?.nameEs || record.exerciseId;
                const withWeight = record.bestOneRepMax > 0 && record.bestSet;
                return (
                  <div key={record.exerciseId} className="d2-coach-record">
                    <span className="d2-coach-record-name">{name}</span>
                    <span className="d2-coach-record-value font-mono-digit">
                      {withWeight ? `${String(record.bestOneRepMax).replace(".", ",")} kg` : `${record.maxReps} reps`}
                      <span className="d2-coach-record-unit">{withWeight ? "1RM est." : "máx."}</span>
                    </span>
                    <span className="d2-coach-muted d2-coach-record-detail">
                      {withWeight
                        ? `Mejor serie ${record.bestSet.weight} kg × ${record.bestSet.reps}${record.bestAt ? ` · ${formatShortDate(record.bestAt)}` : ""}`
                        : `${record.sessions} ${record.sessions === 1 ? "entrenamiento" : "entrenamientos"}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Sección de Analíticas y Gráficos */}
        <section>
          <div className="mb-2">
            <p className="d2-coach-section-title mb-0">
              Volumen por sesión y analíticas
            </p>
            <p className="d2-coach-muted">
              Evolución de volumen, duración, series y distribución muscular
            </p>
          </div>
          <StudentVolumeChart points={chartPoints} catalogExercises={catalogExercises} />
        </section>

        {/* Sección de Historial por Fecha y Rutina */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="d2-coach-section-title mb-0">
                Historial por fecha y rutina
              </p>
              <p className="d2-coach-muted">
                {sessions.length === 1
                  ? "1 entrenamiento registrado"
                  : `${sessions.length} entrenamientos registrados`}
              </p>
            </div>
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="d2-seg text-xs cursor-pointer"
              >
                {allExpanded ? "Colapsar todo" : "Expandir todo"}
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <p className="d2-glass d2-empty">
              Todavía no entrenó.
            </p>
          ) : (
            <>
              {/* Buscador y Filtros de Rutina */}
              <div className="d2-history-controls">
                <div className="d2-history-search-box">
                  <SearchIcon size={16} className="d2-history-search-icon" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Buscar por rutina o ejercicio..."
                    className="d2-history-search-input"
                  />
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => setHistorySearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {uniqueRoutines.length > 1 && (
                  <div className="d2-history-filters-row">
                    <button
                      type="button"
                      onClick={() => setSelectedRoutineFilter("ALL")}
                      className={`d2-history-filter-pill ${selectedRoutineFilter === "ALL" ? "active" : ""}`}
                    >
                      Todas ({sessions.length})
                    </button>
                    {uniqueRoutines.map((rName) => {
                      const count = sessions.filter(
                        (s) => (s.routineName || "Sesión libre") === rName
                      ).length;
                      return (
                        <button
                          key={rName}
                          type="button"
                          onClick={() => setSelectedRoutineFilter(rName)}
                          className={`d2-history-filter-pill ${selectedRoutineFilter === rName ? "active" : ""}`}
                        >
                          {rName} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {filteredSessions.length === 0 ? (
                <div className="d2-glass d2-empty">
                  <p className="d2-coach-muted">
                    No se encontraron entrenamientos con &ldquo;{historySearch}&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setHistorySearch("");
                      setSelectedRoutineFilter("ALL");
                    }}
                    className="d2-empty-action"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="d2-coach-stack">
                  {filteredSessions.map((session) => {
                    const isExpanded = expandedSessionIds.has(session.id);
                    const totalSetsInSession = (session.exercises || []).reduce(
                      (acc, ex) => acc + (ex.sets?.length || 0),
                      0
                    );

                    return (
                      <div key={session.id} className="d2-glass d2-history-session-card">
                        <div
                          className="d2-history-session-head"
                          onClick={() => toggleSession(session.id)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleSession(session.id);
                            }
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="d2-history-session-title">
                              {session.routineName || "Sesión libre"}
                            </p>
                            <p className="d2-coach-muted mt-1">
                              {formatDateTime(session.finishedAt)}
                            </p>
                            <div className="d2-history-badges-row">
                              <span className="d2-history-badge">
                                ⏱️ {formatDuration(session.durationSeconds)}
                              </span>
                              <span className="d2-history-badge">
                                📋 {session.exercises?.length || 0}{" "}
                                {session.exercises?.length === 1 ? "ejercicio" : "ejercicios"}
                              </span>
                              <span className="d2-history-badge">
                                🔢 {totalSetsInSession}{" "}
                                {totalSetsInSession === 1 ? "serie" : "series"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="d2-history-volume-badge">
                                {session.totalVolumeKg}kg
                              </span>
                              <span className="d2-coach-muted block text-[10px] uppercase tracking-wider">
                                volumen
                              </span>
                            </div>
                            <span
                              className={`d2-history-toggle-btn ${isExpanded ? "expanded" : ""}`}
                              aria-hidden="true"
                            >
                              <ChevronDownIcon size={16} />
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="d2-history-exercises-list">
                            {(session.exercises || []).map((exerciseInSession, i) => {
                              const catalogExercise = exerciseLookup.get(exerciseInSession.exerciseId);
                              const sets = exerciseInSession.sets || [];
                              const exerciseVolume = sets.reduce(
                                (acc, s) =>
                                  acc +
                                  (s.failed
                                    ? 0
                                    : (Number(s.weight) || 0) * (Number(s.reps) || 0)),
                                0
                              );
                              const bestSet = bestSetByEstimatedOneRepMax(sets);
                              const primaryMuscle = getPrimaryMuscle(catalogExercise);
                              const eqLabel =
                                EQUIPMENT_LABELS[catalogExercise?.equipment] ||
                                catalogExercise?.equipment;

                              return (
                                <div key={i} className="d2-history-exercise-card">
                                  <div className="d2-history-exercise-header">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="d2-history-exercise-thumb">
                                        {catalogExercise?.mediaUrl ? (
                                          <Image
                                            src={catalogExercise.mediaUrl}
                                            alt=""
                                            width={36}
                                            height={36}
                                            className="h-full w-full object-cover"
                                            unoptimized
                                          />
                                        ) : (
                                          <WeightIcon size={18} />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="d2-history-exercise-title truncate">
                                          {catalogExercise?.nameEs || "Ejercicio"}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                          {eqLabel && (
                                            <span className="d2-history-tag">{eqLabel}</span>
                                          )}
                                          {primaryMuscle && (
                                            <span className="d2-history-tag">{primaryMuscle}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="d2-coach-muted font-mono-digit text-xs block">
                                        {sets.length} {sets.length === 1 ? "serie" : "series"}
                                      </span>
                                      {exerciseVolume > 0 && (
                                        <span className="d2-coach-muted font-mono-digit text-[11px] block">
                                          {exerciseVolume} kg
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="d2-history-sets-grid">
                                    {sets.map((s, setIdx) => {
                                      const e1rm = estimatedOneRepMax(s.weight, s.reps);
                                      const isBest =
                                        bestSet &&
                                        !s.failed &&
                                        s.weight === bestSet.weight &&
                                        s.reps === bestSet.reps;

                                      return (
                                        <div
                                          key={setIdx}
                                          className={`d2-history-set-pill ${isBest ? "top-set" : ""} ${s.failed ? "failed-set" : ""}`}
                                        >
                                          <span className="d2-history-set-num">
                                            S{s.setNumber || setIdx + 1}
                                          </span>
                                          <span className="d2-history-set-val">
                                            {s.weight}kg×{s.reps}
                                          </span>
                                          {e1rm > 0 && !s.failed && (
                                            <span className="d2-history-set-estimate">
                                              ~{Math.round(e1rm)}kg
                                            </span>
                                          )}
                                          {s.pr && !s.failed ? (
                                            <span className="d2-history-pr" title="Récord personal: superó su mejor marca anterior">
                                              🏆 PR
                                            </span>
                                          ) : (
                                            isBest &&
                                            !s.failed && (
                                              <span className="d2-history-star" title="Mejor serie del día">
                                                ★
                                              </span>
                                            )
                                          )}
                                          {s.failed && (
                                            <span
                                              className="text-[10px] font-semibold"
                                              style={{
                                                color: "var(--d2-error, rgba(239, 68, 68, 0.9))",
                                              }}
                                            >
                                              fallada
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
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
    </CoachPageShell>
  );
}
