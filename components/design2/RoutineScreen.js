"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUP_LABELS } from "@/lib/exercises/constants";
import {
  appendSet,
  doneCount,
  dropSet,
  elapsedSeconds,
  formatClock,
  isExerciseDone,
  plannedCount,
  pluralSets,
  sessionExercises,
  startSheet,
  volumeKg,
} from "@/lib/routines/workout";
import {
  deleteRoutine,
  duplicateRoutine,
  setRoutineShowOnHome,
} from "@/app/(app)/rutinas/actions";
import {
  assignRoutine,
  finishAssignmentWorkout,
  finishRoutineWorkout,
  logExerciseSet,
} from "@/app/(app)/rutinas/[id]/actions";
import RoutineExercise from "./RoutineExercise";
import TabBar from "./TabBar";
import {
  ArrowLeftIcon,
  MoreIcon,
  PauseIcon,
  PlayIcon,
} from "./Icons";

/**
 * Detalle de una rutina y entrenamiento en curso.
 *
 * Son dos estados de la misma pantalla y no dos pantallas: entrenando se
 * cargan los mismos ejercicios en el mismo orden, y cambiar de pantalla al
 * empezar obligaría a volver a buscar dónde estaba cada uno.
 *
 * Nada de lo que se muestra se inventa. Las series y los ejercicios se cuentan
 * de la rutina; el tiempo es una estimación y está rotulado como tal; el
 * volumen sale de las series que se marcaron como hechas.
 */
export default function RoutineScreen({ routine }) {
  const router = useRouter();

  const [openId, setOpenId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // "delete" | "discard" | "assign" | "done"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showOnHome, setShowOnHome] = useState(routine.showOnHome);

  // Entrenamiento en curso.
  const [running, setRunning] = useState(false);
  const [sheet, setSheet] = useState({});
  const [clock, setClock] = useState({ startedAt: null, pausedMs: 0, pausedAt: null });
  const [now, setNow] = useState(0);
  const [savingSet, setSavingSet] = useState(null); // `${exerciseId}-${index}`
  const [summary, setSummary] = useState(null);

  const seconds = elapsedSeconds({ ...clock, now });
  const paused = clock.pausedAt != null;
  const done = doneCount(sheet);
  const planned = plannedCount(sheet);
  const volume = volumeKg(sheet);

  // El cronómetro se lee del reloj del sistema en cada tick. Un contador que se
  // incrementa se atrasa y se frena con la pestaña en segundo plano, y el
  // entrenamiento quedaría más corto de lo que fue.
  useEffect(() => {
    if (!running || paused) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running, paused]);

  // Recargar con un entrenamiento abierto pierde todo lo cargado.
  useEffect(() => {
    if (!running) return undefined;
    function warn(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  function start() {
    setSheet(startSheet(routine.exercises));
    setClock({ startedAt: Date.now(), pausedMs: 0, pausedAt: null });
    setNow(Date.now());
    setRunning(true);
    setError("");
    setMenuOpen(false);
    // Se abre el primero: entrenando, el primer ejercicio es el que se carga.
    setOpenId(routine.exercises.length > 0 ? 0 : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function togglePause() {
    setClock((current) => {
      if (current.pausedAt == null) return { ...current, pausedAt: Date.now() };
      return {
        ...current,
        pausedMs: current.pausedMs + (Date.now() - current.pausedAt),
        pausedAt: null,
      };
    });
    setNow(Date.now());
  }

  function discard() {
    setRunning(false);
    setSheet({});
    setClock({ startedAt: null, pausedMs: 0, pausedAt: null });
    setModal(null);
    setOpenId(null);
    setError("");
  }

  // La planilla se indexa por posición en la rutina, no por id: una rutina
  // puede repetir el mismo ejercicio y las dos filas son entrenamientos
  // distintos.
  function patchRow(position, index, changes) {
    setSheet((current) => ({
      ...current,
      [position]: current[position].map((row, row_index) =>
        row_index === index ? { ...row, ...changes } : row,
      ),
    }));
  }

  /**
   * Marca o desmarca una serie.
   *
   * En una rutina asignada, marcarla también la escribe en la asignación para
   * que el entrenador la vea en el momento. Desmarcarla es solo local: la API
   * de asignaciones no borra una serie ya cargada, y volver a marcarla
   * sobreescribe esa misma posición.
   */
  async function toggleDone(exercise, index) {
    const row = sheet[exercise.position][index];
    const next = !row.done;
    patchRow(exercise.position, index, { done: next });

    if (!next || !routine.isAssigned) return;

    setSavingSet(`${exercise.position}-${index}`);
    try {
      await logExerciseSet(routine.assignmentId, exercise.position, index, {
        reps: row.reps,
        weight: row.weight,
      });
    } catch (err) {
      patchRow(exercise.position, index, { done: false });
      setError(err.message || "No se pudo guardar la serie.");
    } finally {
      setSavingSet(null);
    }
  }

  async function finish() {
    const exercises = sessionExercises(routine.exercises, sheet);
    if (exercises.length === 0) {
      setError("Marcá al menos una serie con el tilde para guardar el entrenamiento.");
      return;
    }

    // El reloj se congela antes de guardar: los segundos del guardado no son
    // tiempo de entrenamiento.
    const durationSeconds = seconds;
    if (clock.pausedAt == null) setClock((current) => ({ ...current, pausedAt: Date.now() }));
    setBusy(true);
    setError("");

    try {
      // En una asignación las series ya están guardadas de a una: la acción
      // arma la sesión con eso y no con lo que manda el navegador.
      const result = routine.isAssigned
        ? await finishAssignmentWorkout({ assignmentId: routine.assignmentId, durationSeconds })
        : await finishRoutineWorkout({
            routineId: routine.id,
            routineName: routine.name,
            durationSeconds,
            exercises,
          });

      setSummary({
        seconds: durationSeconds,
        sets: result.totalSetsCompleted,
        volumeKg: result.totalVolumeKg,
      });
      setRunning(false);
      setModal("done");
    } catch (err) {
      setError(err.message || "No se pudo guardar el entrenamiento.");
      setClock((current) => ({ ...current, pausedAt: null }));
    } finally {
      setBusy(false);
    }
  }

  function closeSummary() {
    setModal(null);
    setSummary(null);
    setSheet({});
    setClock({ startedAt: null, pausedMs: 0, pausedAt: null });
    setOpenId(null);
    router.refresh();
  }

  async function toggleShowOnHome() {
    const next = !showOnHome;
    setMenuOpen(false);
    setShowOnHome(next);
    try {
      await setRoutineShowOnHome(routine.id, next);
    } catch (err) {
      setShowOnHome(!next);
      setError(err.message || "No se pudo cambiar la portada.");
    }
  }

  async function duplicate() {
    setMenuOpen(false);
    setBusy(true);
    try {
      await duplicateRoutine(routine.id);
      router.push("/rutinas");
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo duplicar la rutina.");
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteRoutine(routine.id);
    } catch (err) {
      setError(err.message || "No se pudo eliminar la rutina.");
      setBusy(false);
    }
  }

  async function assign(studentId) {
    setBusy(true);
    setError("");
    try {
      await assignRoutine(routine.id, studentId);
      setModal(null);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo asignar la rutina.");
    } finally {
      setBusy(false);
    }
  }

  const canEdit = !routine.readOnly;

  return (
    <>
      <div className="d2-page d2-page-dock">
        <header className="d2-compose-head">
          {running ? (
            <button
              type="button"
              onClick={() => setModal("discard")}
              aria-label="Salir del entrenamiento"
              className="d2-back"
            >
              <ArrowLeftIcon size={20} width={1.8} />
            </button>
          ) : (
            <Link href="/rutinas" aria-label="Volver a rutinas" className="d2-back">
              <ArrowLeftIcon size={20} width={1.8} />
            </Link>
          )}

          <h1 className="d2-detail-title">
            {routine.name}
            {routine.isAssigned && <span className="d2-detail-tag">Rutina del coach</span>}
          </h1>

          {!running && (canEdit || routine.students.length > 0) && (
            <div className="d2-menu-wrap">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Opciones de la rutina"
                aria-expanded={menuOpen}
                className="d2-back"
              >
                <MoreIcon size={20} width={1.8} />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="d2-menu-backdrop"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="d2-glass-strong d2-menu">
                    {canEdit && (
                      <Link href={`/rutinas/${routine.id}/editar`} className="d2-menu-item">
                        Editar
                      </Link>
                    )}
                    {canEdit && (
                      <button type="button" onClick={duplicate} disabled={busy} className="d2-menu-item">
                        Duplicar
                      </button>
                    )}
                    {canEdit && (
                      <button type="button" onClick={toggleShowOnHome} className="d2-menu-item">
                        {showOnHome ? "Quitar de la portada" : "Mostrar en la portada"}
                      </button>
                    )}
                    {routine.students.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setModal("assign");
                        }}
                        className="d2-menu-item"
                      >
                        Asignar a un alumno
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setModal("delete");
                        }}
                        className="d2-menu-item"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        {/* Entrenando estos tres números los lleva el dock, que además queda
            siempre a la vista: repetirlos arriba es leer lo mismo dos veces. */}
        {!running && (
          <p className="d2-glass d2-stats">
            <span className="d2-stat">
              <span className="d2-stat-value">{routine.exercises.length}</span>
              <span className="d2-stat-label">
                {routine.exercises.length === 1 ? "ejercicio" : "ejercicios"}
              </span>
            </span>
            <span className="d2-stat">
              <span className="d2-stat-value">{routine.totalSets}</span>
              <span className="d2-stat-label">
                {routine.totalSets === 1 ? "serie" : "series"}
              </span>
            </span>
            <span className="d2-stat">
              <span className="d2-stat-value">{routine.estimatedMinutes}</span>
              {/* Es una cuenta sobre las series prescritas, no un tiempo medido. */}
              <span className="d2-stat-label">min estimados</span>
            </span>
          </p>
        )}

        {!running && routine.note && <p className="d2-glass d2-note">{routine.note}</p>}

        <p className="d2-label">
          {running ? `Planilla · ${pluralSets(planned)}` : `Ejercicios · ${routine.exercises.length}`}
        </p>

        {routine.exercises.length === 0 ? (
          <p className="d2-glass d2-empty">Esta rutina no tiene ejercicios.</p>
        ) : (
          <div className="d2-panel">
            {routine.exercises.map((exercise) => (
              <RoutineExercise
                key={exercise.position}
                exercise={exercise}
                open={openId === exercise.position}
                onToggle={() =>
                  setOpenId((current) => (current === exercise.position ? null : exercise.position))
                }
                running={running}
                rows={sheet[exercise.position] || []}
                done={running && isExerciseDone(sheet, exercise.position)}
                savingSet={
                  savingSet?.startsWith(`${exercise.position}-`)
                    ? Number(savingSet.split("-")[1])
                    : null
                }
                onRowChange={(index, changes) => patchRow(exercise.position, index, changes)}
                onToggleDone={(index) => toggleDone(exercise, index)}
                onAddSet={() =>
                  setSheet((current) => ({
                    ...current,
                    [exercise.position]: appendSet(current[exercise.position]),
                  }))
                }
                onDropSet={() =>
                  setSheet((current) => ({
                    ...current,
                    [exercise.position]: dropSet(current[exercise.position]),
                  }))
                }
              />
            ))}
          </div>
        )}

        {!running && routine.muscles.length > 0 && (
          <>
            <p className="d2-label">Músculos que trabaja</p>
            <div className="d2-panel d2-muscles">
              {routine.muscles.map((row) => (
                <div key={row.muscle} className="d2-muscle-row">
                  <p className="d2-muscle-head">
                    <span>{MUSCLE_GROUP_LABELS[row.muscle] || row.muscle}</span>
                    <span>{row.percent}%</span>
                  </p>
                  <span className="d2-muscle-bar">
                    <span style={{ width: `${row.percent}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p className="d2-glass d2-error">{error}</p>}

        {routine.hasMedia && (
          <p className="d2-credit">
            Animaciones de ejercicios ©{" "}
            <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">
              Gym visual
            </a>
          </p>
        )}
      </div>

      <div className={running ? "d2-dock d2-dock-low" : "d2-dock"}>
        {running ? (
          <div className="d2-glass-strong d2-run">
            <div className="d2-run-top">
              <span className="d2-run-clock">{formatClock(seconds)}</span>
              <span className="d2-run-progress">
                {done} de {pluralSets(planned)}
                {volume > 0 && ` · ${volume} kg`}
                {paused && <span className="d2-run-hold">En pausa</span>}
              </span>
            </div>
            <div className="d2-run-actions">
              <button type="button" onClick={togglePause} className="d2-ghost">
                {paused ? <PlayIcon size={15} width={1.8} /> : <PauseIcon size={15} width={1.8} />}
                {paused ? "Seguir" : "Pausar"}
              </button>
              <button type="button" onClick={finish} disabled={busy} className="d2-finish">
                {busy ? "Guardando…" : "Terminar"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={routine.exercises.length === 0}
            className="d2-start"
          >
            <PlayIcon size={17} width={1.8} />
            Comenzar entrenamiento
          </button>
        )}
      </div>

      {/* Entrenando no hay barra de pestañas: un toque al azar no puede
          hacer perder lo cargado. */}
      {!running && <TabBar />}

      {modal === "discard" && (
        <div className="d2-modal">
          <div className="d2-glass-strong d2-modal-card">
            <h2 className="d2-modal-title">¿Salir del entrenamiento?</h2>
            <p className="d2-modal-text">
              Se pierde lo que cargaste hasta acá{routine.isAssigned ? ", menos las series que ya confirmaste" : ""}.
            </p>
            <div className="d2-modal-actions">
              <button type="button" onClick={discard} className="d2-modal-primary">
                Salir sin guardar
              </button>
              <button type="button" onClick={() => setModal(null)} className="d2-modal-secondary">
                Seguir entrenando
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "delete" && (
        <div className="d2-modal">
          <div className="d2-glass-strong d2-modal-card">
            <h2 className="d2-modal-title">¿Eliminar «{routine.name}»?</h2>
            <p className="d2-modal-text">
              No se puede deshacer. Los entrenamientos que ya hiciste con ella quedan en el historial.
            </p>
            <div className="d2-modal-actions">
              <button type="button" onClick={remove} disabled={busy} className="d2-modal-primary">
                {busy ? "Eliminando…" : "Eliminar"}
              </button>
              <button type="button" onClick={() => setModal(null)} className="d2-modal-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "assign" && (
        <div className="d2-modal">
          <div className="d2-glass-strong d2-modal-card">
            <h2 className="d2-modal-title">Asignar la rutina</h2>
            <p className="d2-modal-text">El alumno la ve en sus rutinas y vos, lo que carga.</p>
            <div className="d2-panel d2-students">
              {routine.students.map((student) => (
                <button
                  key={student.studentId}
                  type="button"
                  onClick={() => assign(student.studentId)}
                  disabled={busy}
                  className="d2-student"
                >
                  <span className="d2-student-initial">
                    {(student.displayName || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="d2-student-body">
                    <span className="d2-student-name">{student.displayName || "Sin nombre"}</span>
                    {student.email && <span className="d2-student-mail">{student.email}</span>}
                  </span>
                </button>
              ))}
            </div>
            {error && <p className="d2-modal-text">{error}</p>}
            <div className="d2-modal-actions">
              <button type="button" onClick={() => setModal(null)} className="d2-modal-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "done" && summary && (
        <div className="d2-modal">
          <div className="d2-glass-strong d2-modal-card">
            <h2 className="d2-modal-title">Entrenamiento guardado</h2>
            <p className="d2-modal-text">{routine.name}</p>
            <div className="d2-summary">
              <span className="d2-summary-cell">
                <span className="d2-summary-value">{formatClock(summary.seconds)}</span>
                <span className="d2-summary-label">tiempo</span>
              </span>
              <span className="d2-summary-cell">
                <span className="d2-summary-value">{summary.sets}</span>
                <span className="d2-summary-label">
                  {summary.sets === 1 ? "serie" : "series"}
                </span>
              </span>
              <span className="d2-summary-cell">
                <span className="d2-summary-value">{summary.volumeKg} kg</span>
                <span className="d2-summary-label">volumen</span>
              </span>
            </div>
            <div className="d2-modal-actions">
              <Link href="/historial" onClick={closeSummary} className="d2-modal-primary">
                Ver el historial
              </Link>
              <button type="button" onClick={closeSummary} className="d2-modal-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
