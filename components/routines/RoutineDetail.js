"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  REGISTRATION_TYPE_LABELS,
  isTimeBasedRegistration,
} from "@/lib/exercises/constants";
import { primaryMuscle } from "@/lib/exercises/filters";
import { totalSets, estimatedDurationMinutes, muscleDistribution } from "@/lib/routines/summary";
import { deleteRoutine, duplicateRoutine, updateRoutine, setRoutineShowOnHome } from "@/app/(app)/rutinas/actions";
import { assignRoutine, logExercise } from "@/app/(app)/rutinas/[id]/actions";
import { finishSession } from "@/app/(app)/sesion/actions";
import RoutineBuilder from "@/components/routines/RoutineBuilder";
import AssignStudentButton from "@/components/routines/AssignStudentButton";
import MediaAttribution from "@/components/routines/MediaAttribution";
import ExerciseDetailSheet from "@/components/routines/ExerciseDetailSheet";

function formatWorkoutTime(totalSec) {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

function MuscleRing({ pct, size = "md" }) {
  const percent = Math.round(pct * 100);
  const isSmall = size === "sm";
  const outerClass = isSmall ? "h-9 w-9" : "h-11 w-11";
  const innerClass = isSmall ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[10px]";

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${outerClass}`}
      style={{
        background: `conic-gradient(var(--teal2) 0 ${percent}%, var(--hair) 0)`,
      }}
    >
      <span className={`font-mono-digit flex items-center justify-center rounded-full bg-deep text-text ${innerClass}`}>
        {percent}%
      </span>
    </span>
  );
}

export default function RoutineDetail({
  routine,
  catalogExercises,
  customExercises,
  isCoach = false,
  students = [],
  readOnly = false,
}) {
  const router = useRouter();
  const [mode, setMode] = useState("view");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [showOnHome, setShowOnHome] = useState(routine.showOnHome !== false);
  const [showOnHomeBusy, setShowOnHomeBusy] = useState(false);
  const [logStates, setLogStates] = useState({});
  const [logStatus, setLogStatus] = useState(null);

  // Exercises list for interactive updates
  const [exercisesList, setExercisesList] = useState(routine.exercises || []);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error' | null

  // Active workout timer states
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Series realmente cargadas durante el entrenamiento activo: { [exerciseId]: [{weight, reps, failed}] }
  const [performedSets, setPerformedSets] = useState({});
  const [sessionSaveStatus, setSessionSaveStatus] = useState(null); // 'saving' | 'error' | null
  const [lastSessionSummary, setLastSessionSummary] = useState(null);

  // Live chronometer tick
  useEffect(() => {
    if (!workoutActive || workoutPaused) return;
    const interval = setInterval(() => {
      setWorkoutSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutActive, workoutPaused]);

  const exerciseLookup = useMemo(
    () => new Map([...catalogExercises, ...customExercises].map((e) => [e.id, e])),
    [catalogExercises, customExercises],
  );

  const currentRoutineWithExercises = useMemo(
    () => ({ ...routine, exercises: exercisesList }),
    [routine, exercisesList],
  );

  const distribution = useMemo(
    () => muscleDistribution(currentRoutineWithExercises, exerciseLookup),
    [currentRoutineWithExercises, exerciseLookup],
  );

  const handleUpdateExercise = (index, field, value) => {
    setExercisesList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveRoutineChanges = async () => {
    setSaveStatus("saving");
    try {
      await updateRoutine(routine.id, {
        name: routine.name,
        note: routine.note,
        exercises: exercisesList,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleLogExercise = async (exerciseIndex) => {
    const data = logStates[exerciseIndex] || {};
    setLogStatus({ index: exerciseIndex, status: "saving" });
    try {
      await logExercise(routine.assignmentId, exerciseIndex, data);
      setLogStatus({ index: exerciseIndex, status: "saved" });
      setTimeout(() => setLogStatus(null), 2000);
    } catch (err) {
      console.error(err);
      setLogStatus({ index: exerciseIndex, status: "error" });
      setTimeout(() => setLogStatus(null), 3000);
    }
  };

  const updateLogField = (exerciseIndex, field, value) => {
    setLogStates((prev) => ({
      ...prev,
      [exerciseIndex]: { ...(prev[exerciseIndex] || {}), [field]: value },
    }));
  };

  const handleStartWorkout = () => {
    const seeded = {};
    for (const item of exercisesList) {
      const setCount = Number(item.targetSets) || 1;
      seeded[item.exerciseId] = Array.from({ length: setCount }, () => ({
        weight: item.targetWeight != null ? String(item.targetWeight) : "",
        reps: item.targetReps != null ? String(item.targetReps) : "",
        failed: false,
      }));
    }
    setPerformedSets(seeded);
    setWorkoutActive(true);
    setWorkoutPaused(false);
    setExpandedIndex(0);
    // Smooth scroll to top to see session header
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateSet = (exerciseId, setIndex, field, value) => {
    setPerformedSets((prev) => {
      const sets = [...(prev[exerciseId] || [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: sets };
    });
  };

  const handleAddSet = (exerciseId) => {
    setPerformedSets((prev) => {
      const sets = prev[exerciseId] || [];
      const last = sets[sets.length - 1];
      return {
        ...prev,
        [exerciseId]: [...sets, { weight: last?.weight || "", reps: last?.reps || "", failed: false }],
      };
    });
  };

  const handleRemoveSet = (exerciseId) => {
    setPerformedSets((prev) => {
      const sets = prev[exerciseId] || [];
      if (sets.length <= 1) return prev;
      return { ...prev, [exerciseId]: sets.slice(0, -1) };
    });
  };

  const handleFinishWorkout = async () => {
    setWorkoutPaused(true);
    setSessionSaveStatus("saving");

    const exercises = exercisesList
      .map((item) => ({
        exerciseId: item.exerciseId,
        sets: (performedSets[item.exerciseId] || [])
          .filter((set) => set.weight !== "" && set.reps !== "" && Number(set.reps) > 0)
          .map((set, index) => ({
            setNumber: index + 1,
            weight: Number(set.weight) || 0,
            reps: Number(set.reps) || 0,
            failed: !!set.failed,
          })),
      }))
      .filter((exercise) => exercise.sets.length > 0);

    if (exercises.length === 0) {
      setSessionSaveStatus("error");
      setWorkoutPaused(false);
      return;
    }

    try {
      const result = await finishSession({
        source: { type: "routine", routineId: routine.id },
        routineName: routine.name,
        durationSeconds: workoutSeconds,
        exercises,
      });
      setLastSessionSummary(result);
      setSessionSaveStatus(null);
      setShowFinishModal(true);
    } catch (err) {
      console.error(err);
      setSessionSaveStatus("error");
      setWorkoutPaused(false);
    }
  };

  const handleCloseFinishModal = () => {
    setShowFinishModal(false);
    setWorkoutActive(false);
    setWorkoutPaused(false);
    setWorkoutSeconds(0);
    setPerformedSets({});
    setLastSessionSummary(null);
  };

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-5 px-[18px] pb-[100px] lg:px-0">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
              Editar
            </p>
            <h1 className="font-display mt-1 text-[26px] uppercase leading-none">
              {routine.name}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setMode("view")}
            className="text-sm font-medium text-faint transition hover:text-text"
          >
            Cancelar
          </button>
        </header>
        <RoutineBuilder
          mode="edit"
          routine={routine}
          catalogExercises={catalogExercises}
          customExercises={customExercises}
        />
      </div>
    );
  }

  async function handleDuplicate() {
    setBusy(true);
    await duplicateRoutine(routine.id);
    router.push("/rutinas");
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    await deleteRoutine(routine.id);
  }

  async function handleToggleShowOnHome() {
    const next = !showOnHome;
    setShowOnHomeBusy(true);
    setShowOnHome(next);
    try {
      await setRoutineShowOnHome(routine.id, next);
    } catch (err) {
      console.error(err);
      setShowOnHome(!next);
    } finally {
      setShowOnHomeBusy(false);
    }
  }

  return (
    <div className="relative flex flex-col gap-6 px-[18px] pb-[110px] lg:px-0">
      {/* Mobile Active Workout Floating / Sticky Banner */}
      {workoutActive && (
        <div className="sticky top-2 z-40 mb-1 flex items-center justify-between gap-3 rounded-2xl border border-teal/40 bg-deep/95 p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-teal opacity-75 ${
                  workoutPaused ? "" : "animate-ping"
                }`}
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  workoutPaused ? "bg-amber-400" : "bg-teal2"
                }`}
              />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal2">
                {workoutPaused ? "En pausa" : "Entrenando"}
              </p>
              <div className="font-mono-digit text-xl font-bold tracking-wider text-white">
                {formatWorkoutTime(workoutSeconds)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWorkoutPaused((v) => !v)}
              className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
            >
              {workoutPaused ? (
                <>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Reanudar
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Pausar
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleFinishWorkout}
              disabled={sessionSaveStatus === "saving"}
              className="flex h-9 items-center justify-center rounded-full bg-destructive px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              {sessionSaveStatus === "saving" ? "Guardando…" : "Terminar"}
            </button>
          </div>
        </div>
      )}

      {sessionSaveStatus === "error" && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
          No se pudo guardar la sesión — revisá que haya al menos una serie con peso y reps cargados, y probá de nuevo.
        </div>
      )}

      {/* Main Responsive Layout: 2-Column Split on Desktop, Single Column on Mobile */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[360px_1fr] xl:grid-cols-[380px_1fr] lg:gap-8 lg:items-start">
        
        {/* ── LEFT COLUMN: Routine Sidebar / Overview (Sticky on Desktop) ── */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
          {/* Header Navigation & Menu */}
          <header className="flex items-center justify-between gap-3">
            <Link
              href="/rutinas"
              aria-label="Volver a rutinas"
              className="flex h-9 items-center gap-2 rounded-full py-1 text-faint transition hover:bg-glass hover:text-text sm:px-2.5"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
                Rutinas
              </span>
            </Link>

            <div className="relative">
              {readOnly && (
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-teal2">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Plan del entrenador
                </span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Más opciones"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-hair text-text transition hover:border-teal2"
                >
                  ⋮
                </button>
              )}
              {menuOpen ? (
                <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-2xl border border-hair bg-deep shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setMode("edit");
                    }}
                    className="flex h-11 w-full items-center px-4 text-left text-sm text-text transition hover:bg-glass2"
                  >
                    Editar completa
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDuplicate}
                    className="flex h-11 w-full items-center px-4 text-left text-sm text-text transition hover:bg-glass2 disabled:opacity-40"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    disabled={showOnHomeBusy}
                    onClick={() => {
                      setMenuOpen(false);
                      handleToggleShowOnHome();
                    }}
                    className="flex h-11 w-full items-center px-4 text-left text-sm text-text transition hover:bg-glass2 disabled:opacity-40"
                  >
                    {showOnHome ? "Quitar del inicio" : "Mostrar en inicio"}
                  </button>
                  {isCoach && students.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setAssignModalOpen(true);
                      }}
                      className="flex h-11 w-full items-center px-4 text-left text-sm text-teal2 transition hover:bg-teal/10"
                    >
                      Asignar a alumno
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmingDelete(true);
                    }}
                    className="flex h-11 w-full items-center px-4 text-left text-sm text-destructive transition hover:bg-destructive/10"
                  >
                    Eliminar
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          {confirmingDelete ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-sm text-text">
                ¿Eliminar &quot;{routine.name}&quot;? No afecta a las sesiones ya registradas con ella.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDelete}
                  className="h-9 rounded-full bg-destructive px-4 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="h-9 rounded-full border border-hair px-4 text-xs font-semibold text-text"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}

          {/* Routine Title & Metrics */}
          <div className="rounded-3xl border border-hair/80 bg-glass/60 p-4 sm:p-5 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal2">
              Rutina de entrenamiento
            </p>
            <h1 className="font-display mt-1 text-[28px] sm:text-[32px] lg:text-[34px] uppercase leading-none tracking-wide text-white">
              {routine.name}
            </h1>
            {routine.note ? (
              <p className="mt-2.5 rounded-xl border border-hair/50 bg-white/[0.02] p-2.5 text-xs italic text-muted">
                {routine.note}
              </p>
            ) : null}

            {/* Quick Metrics Grid */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-hair/70 bg-glass/80 py-2.5 px-2 text-center">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-faint">
                  Ejercicios
                </span>
                <span className="font-mono-digit mt-1 block text-base sm:text-lg font-bold text-white">
                  {exercisesList.length}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-hair/70 bg-glass/80 py-2.5 px-2 text-center">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-faint">
                  Duración
                </span>
                <span className="font-mono-digit mt-1 block text-base sm:text-lg font-bold text-teal2">
                  ~{estimatedDurationMinutes(currentRoutineWithExercises, exerciseLookup)}m
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-hair/70 bg-glass/80 py-2.5 px-2 text-center">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-faint">
                  Series
                </span>
                <span className="font-mono-digit mt-1 block text-base sm:text-lg font-bold text-white">
                  {totalSets(currentRoutineWithExercises)}
                </span>
              </div>
            </div>
          </div>

          {/* Muscle Distribution */}
          {distribution.length ? (
            <div className="rounded-3xl border border-hair/80 bg-glass/60 p-4 sm:p-5 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
                  Distribución muscular
                </p>
                <span className="text-[11px] text-faint">
                  {distribution.length} {distribution.length === 1 ? "grupo" : "grupos"}
                </span>
              </div>

              {/* Mobile: Horizontal scroll */}
              <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none lg:hidden">
                {distribution.map(({ muscle, pct }) => (
                  <div key={muscle} className="flex shrink-0 flex-col items-center gap-1.5">
                    <MuscleRing pct={pct} />
                    <span className="max-w-[72px] truncate text-[10.5px] text-muted">
                      {MUSCLE_GROUP_LABELS[muscle]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop: Structured list */}
              <div className="hidden lg:flex flex-col gap-2">
                {distribution.map(({ muscle, pct }) => {
                  const percent = Math.round(pct * 100);
                  return (
                    <div
                      key={muscle}
                      className="flex items-center justify-between rounded-xl border border-hair/70 bg-glass/60 px-3 py-2 transition hover:border-white/20"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <MuscleRing pct={pct} size="sm" />
                        <span className="truncate text-xs font-medium text-text">
                          {MUSCLE_GROUP_LABELS[muscle]}
                        </span>
                      </div>
                      <span className="font-mono-digit text-xs font-bold text-teal2 shrink-0">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Desktop Primary Action & Active Workout Controls (Sticky in Left Sidebar) */}
          <div className="hidden lg:block">
            {!workoutActive ? (
              <button
                type="button"
                onClick={handleStartWorkout}
                className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-white text-[15.5px] font-semibold text-onlight shadow-[0_10px_28px_rgba(255,255,255,0.22)] transition-all hover:opacity-95 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Empezar entrenamiento
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-teal/40 bg-deep/95 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-teal opacity-75 ${
                          workoutPaused ? "" : "animate-ping"
                        }`}
                      />
                      <span
                        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                          workoutPaused ? "bg-amber-400" : "bg-teal2"
                        }`}
                      />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal2">
                      {workoutPaused ? "En pausa" : "Entrenando"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWorkoutPaused((v) => !v)}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
                  >
                    {workoutPaused ? (
                      <>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Reanudar
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                        Pausar
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono-digit py-1 text-center text-3xl font-bold tracking-widest text-white">
                  {formatWorkoutTime(workoutSeconds)}
                </div>

                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  disabled={sessionSaveStatus === "saving"}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-destructive text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:opacity-60"
                >
                  {sessionSaveStatus === "saving" ? "Guardando…" : "Terminar entrenamiento"}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT COLUMN: Exercises Workspace ── */}
        <main className="min-w-0 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
                {exercisesList.length} {exercisesList.length === 1 ? "ejercicio" : "ejercicios"}
              </p>
              <p className="text-[11px] text-faint">
                Tocá cualquier ejercicio para ajustar series, reps, peso o RIR
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-digit rounded-lg border border-hair/70 bg-glass px-2.5 py-1 text-xs text-faint">
                {totalSets(currentRoutineWithExercises)} series
              </span>
            </div>
          </div>

          {/* Exercises Accordion List */}
          <div className="flex flex-col gap-3">
            {exercisesList.map((item, index) => {
              const exercise = exerciseLookup.get(item.exerciseId);
              const timeBased = isTimeBasedRegistration(exercise?.registrationType);
              const isExpanded = expandedIndex === index;

              const muscle = primaryMuscle(exercise?.muscleWeights);
              const muscleLabel = muscle ? MUSCLE_GROUP_LABELS[muscle] : "";
              const equipLabel = EQUIPMENT_LABELS[exercise?.equipment] || "";
              const subtitleParts = [muscleLabel, equipLabel].filter(Boolean);
              const subtitle = subtitleParts.join(" · ");

              return (
                <div
                  key={item.exerciseId || index}
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isExpanded
                      ? "border-teal/50 bg-deep/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                      : "border-hair bg-glass hover:border-white/20"
                  }`}
                >
                  {/* Exercise Clickable Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="flex w-full items-center gap-3.5 p-3.5 sm:p-4 text-left transition"
                  >
                    {exercise?.mediaUrl ? (
                      <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
                        <Image
                          src={exercise.mediaUrl}
                          alt=""
                          width={60}
                          height={60}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-glass2 text-faint">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <circle cx="12" cy="8.5" r="3.2" />
                          <path d="M5 20a7 7 0 0 1 14 0" />
                        </svg>
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] sm:text-base font-semibold text-text">
                          {exercise?.nameEs || "Ejercicio"}
                        </span>
                        {exercise?.source === "custom" && (
                          <span className="shrink-0 rounded-full bg-teal/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-teal2">
                            Tuyo
                          </span>
                        )}
                      </div>

                      {subtitle && (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {subtitle}
                          {exercise?.unilateral ? " · Unilateral" : ""}
                        </p>
                      )}

                      {/* Badges / Metrics */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-faint">
                        <span className="rounded bg-white/10 px-2 py-0.5 font-medium text-white">
                          {item.targetSets} {item.targetSets === 1 ? "serie" : "series"} × {item.targetReps} {timeBased ? "seg" : "reps"}
                        </span>
                        {item.targetWeight ? (
                          <span className="rounded bg-teal/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal2">
                            {item.targetWeight} kg
                          </span>
                        ) : null}
                        {item.targetRIR != null ? (
                          <span className="rounded bg-white/5 border border-hair/50 px-1.5 py-0.5 text-[11px] text-faint">
                            RIR {item.targetRIR}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Dropdown Chevron Icon */}
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hair transition-transform duration-300 ${
                        isExpanded ? "rotate-180 border-teal/40 bg-teal/15 text-teal2" : "text-faint"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  {/* Dropdown Expanded Body */}
                  {isExpanded && readOnly && (
                    <div className="border-t border-hair/60 bg-black/20 p-4 transition-all duration-300">
                      {/* Target values (read-only) */}
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-glass px-2.5 py-1 text-xs text-faint">
                          {item.targetSets} series × {item.targetReps} {timeBased ? "seg" : "reps"}
                        </span>
                        {item.targetWeight ? (
                          <span className="rounded-lg bg-glass px-2.5 py-1 text-xs font-mono text-teal2">
                            {item.targetWeight} kg
                          </span>
                        ) : null}
                        {item.targetRIR != null ? (
                          <span className="rounded-lg bg-glass px-2.5 py-1 text-xs text-faint">
                            RIR {item.targetRIR}
                          </span>
                        ) : null}
                      </div>

                      {/* Logging form: ¿Qué hiciste? */}
                      <div className="mt-3 space-y-2.5 border-t border-hair/50 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal2">
                          ¿Qué hiciste?
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div>
                            <label className="block text-[10px] text-faint">Series</label>
                            <input
                              type="number"
                              min="0"
                              placeholder={String(item.targetSets || 3)}
                              value={logStates[index]?.actualSets ?? ""}
                              onChange={(e) => updateLogField(index, "actualSets", e.target.value)}
                              className="mt-0.5 w-full rounded-lg border border-hair/60 bg-glass px-2.5 py-2 font-mono-digit text-xs text-text outline-none transition focus:border-teal2"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-faint">
                              {timeBased ? "Seg" : "Reps"}
                            </label>
                            <input
                              type="text"
                              placeholder={String(item.targetReps || 10)}
                              value={logStates[index]?.actualReps ?? ""}
                              onChange={(e) => updateLogField(index, "actualReps", e.target.value)}
                              className="mt-0.5 w-full rounded-lg border border-hair/60 bg-glass px-2.5 py-2 font-mono-digit text-xs text-text outline-none transition focus:border-teal2"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-faint">Peso (kg)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              placeholder={item.targetWeight ? String(item.targetWeight) : "0"}
                              value={logStates[index]?.actualWeight ?? ""}
                              onChange={(e) => updateLogField(index, "actualWeight", e.target.value)}
                              className="mt-0.5 w-full rounded-lg border border-hair/60 bg-glass px-2.5 py-2 font-mono-digit text-xs text-text outline-none transition focus:border-teal2"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-faint">RIR</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              placeholder={item.targetRIR != null ? String(item.targetRIR) : "-"}
                              value={logStates[index]?.finalRIR ?? ""}
                              onChange={(e) => updateLogField(index, "finalRIR", e.target.value)}
                              className="mt-0.5 w-full rounded-lg border border-hair/60 bg-glass px-2.5 py-2 font-mono-digit text-xs text-text outline-none transition focus:border-teal2"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setDetailExercise(exercise)}
                            className="flex items-center gap-1.5 text-xs font-medium text-teal2 transition hover:underline"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            Ver técnica
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLogExercise(index)}
                            disabled={logStatus?.index === index && logStatus?.status === "saving"}
                            className="flex h-8 items-center gap-1.5 rounded-full bg-teal px-3.5 text-xs font-semibold text-onlight transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                          >
                            {logStatus?.index === index && logStatus?.status === "saving" ? (
                              <span>Guardando...</span>
                            ) : logStatus?.index === index && logStatus?.status === "saved" ? (
                              <span className="flex items-center gap-1">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Guardado
                              </span>
                            ) : (
                              <span>Registrar</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && !readOnly && (
                    <div className="border-t border-hair/60 bg-black/20 p-4 transition-all duration-300">
                      {workoutActive ? (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal2">
                              Series {timeBased ? "(seg)" : "reales"}
                            </p>
                            <span className="text-[10px] text-faint">
                              Peso (kg) · {timeBased ? "Segundos" : "Reps"}
                            </span>
                          </div>

                          {(performedSets[item.exerciseId] || []).map((set, setIndex) => (
                            <div
                              key={setIndex}
                              className="flex items-center gap-2 rounded-xl border border-hair/80 bg-glass p-2.5"
                            >
                              <span className="font-mono-digit w-6 shrink-0 text-center text-xs font-semibold text-teal2">
                                #{setIndex + 1}
                              </span>
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  placeholder="kg"
                                  value={set.weight}
                                  onChange={(e) =>
                                    handleUpdateSet(item.exerciseId, setIndex, "weight", e.target.value)
                                  }
                                  className="font-mono-digit h-10 w-full rounded-lg border border-hair bg-glass2 px-2.5 text-center text-sm text-white outline-none focus:border-teal2"
                                />
                                <span className="pointer-events-none absolute right-2 top-2.5 text-[10px] text-faint">
                                  kg
                                </span>
                              </div>
                              <span className="shrink-0 text-xs text-faint">×</span>
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  placeholder={timeBased ? "seg" : "reps"}
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateSet(item.exerciseId, setIndex, "reps", e.target.value)
                                  }
                                  className="font-mono-digit h-10 w-full rounded-lg border border-hair bg-glass2 px-2.5 text-center text-sm text-white outline-none focus:border-teal2"
                                />
                                <span className="pointer-events-none absolute right-2 top-2.5 text-[10px] text-faint">
                                  {timeBased ? "seg" : "reps"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSet(item.exerciseId, setIndex, "failed", !set.failed)
                                }
                                aria-pressed={set.failed}
                                aria-label="Marcar serie fallada"
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                                  set.failed
                                    ? "border-destructive/50 bg-destructive/20 text-destructive"
                                    : "border-hair/60 bg-glass2 text-faint hover:text-white"
                                }`}
                              >
                                ✕
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddSet(item.exerciseId)}
                              className="h-9 flex-1 rounded-lg border border-dashed border-hair text-xs font-semibold text-faint transition hover:border-teal2 hover:text-teal2"
                            >
                              + Serie
                            </button>
                            {(performedSets[item.exerciseId] || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(item.exerciseId)}
                                className="h-9 rounded-lg border border-hair px-3 text-xs font-semibold text-faint transition hover:text-white"
                              >
                                Sacar última
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {/* Series Stepper */}
                          <div className="rounded-xl border border-hair/80 bg-glass p-2.5">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-teal2">
                              Series
                            </span>
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateExercise(
                                    index,
                                    "targetSets",
                                    Math.max(1, (Number(item.targetSets) || 1) - 1),
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-glass2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                              >
                                -
                              </button>
                              <span className="font-mono-digit text-base font-semibold text-white">
                                {item.targetSets || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateExercise(
                                    index,
                                    "targetSets",
                                    (Number(item.targetSets) || 1) + 1,
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-glass2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Reps or Seconds Stepper */}
                          <div className="rounded-xl border border-hair/80 bg-glass p-2.5">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-teal2">
                              {timeBased ? "Segundos" : "Repeticiones"}
                            </span>
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateExercise(
                                    index,
                                    "targetReps",
                                    Math.max(1, (Number(item.targetReps) || 10) - (timeBased ? 5 : 1)),
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-glass2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                              >
                                -
                              </button>
                              <span className="font-mono-digit text-base font-semibold text-white">
                                {item.targetReps || 10}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateExercise(
                                    index,
                                    "targetReps",
                                    (Number(item.targetReps) || 10) + (timeBased ? 5 : 1),
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-glass2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Weight (Peso en kg) Stepper */}
                          <div className="rounded-xl border border-hair/80 bg-glass p-2.5">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-teal2">
                              Peso (kg)
                            </span>
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateExercise(
                                    index,
                                    "targetWeight",
                                    Math.max(0, (Number(item.targetWeight) || 0) - 2.5),
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-glass2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                              >
                                -
                              </button>
                              <span className="font-mono-digit text-sm font-semibold text-white">
                                {item.targetWeight ? `${item.targetWeight}k` : "0k"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateExercise(
                                    index,
                                    "targetWeight",
                                    (Number(item.targetWeight) || 0) + 2.5,
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-glass2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* RIR (Reps in Reserve) Selector */}
                          <div className="rounded-xl border border-hair/80 bg-glass p-2.5">
                            <span className="block text-[11px] font-semibold uppercase tracking-wider text-teal2">
                              RIR (Reserva)
                            </span>
                            <div className="mt-2 flex items-center justify-between gap-1">
                              {[null, 0, 1, 2, 3].map((val) => {
                                const isSelected = item.targetRIR === val;
                                return (
                                  <button
                                    key={String(val)}
                                    type="button"
                                    onClick={() => handleUpdateExercise(index, "targetRIR", val)}
                                    className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-semibold transition active:scale-95 ${
                                      isSelected
                                        ? "bg-teal text-onlight"
                                        : "border border-hair/60 bg-glass2 text-faint hover:text-white"
                                    }`}
                                  >
                                    {val === null ? "-" : val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom row inside accordion */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hair/50 pt-3">
                        {exercise ? (
                          <button
                            type="button"
                            onClick={() => setDetailExercise(exercise)}
                            className="flex items-center gap-1.5 text-xs font-medium text-teal2 transition hover:underline"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            Ver técnica y músculos
                          </button>
                        ) : <div />}

                        {!workoutActive && (
                          <button
                            type="button"
                            onClick={handleSaveRoutineChanges}
                            disabled={saveStatus === "saving"}
                            className="flex h-8 items-center gap-1.5 rounded-full bg-teal px-3.5 text-xs font-semibold text-onlight transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                          >
                            {saveStatus === "saving" ? (
                              <span>Guardando...</span>
                            ) : saveStatus === "saved" ? (
                              <span className="flex items-center gap-1">
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Guardado
                              </span>
                            ) : (
                              <span>Guardar cambios</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {routine.exercises.some((item) => exerciseLookup.get(item.exerciseId)?.mediaUrl) ? (
            <div className="mt-3">
              <MediaAttribution />
            </div>
          ) : null}

          {/* Mobile Bottom Workout Button */}
          <div className="mt-3 lg:hidden">
            {!workoutActive ? (
              <button
                type="button"
                onClick={handleStartWorkout}
                className="flex h-[54px] w-full sm:max-w-md sm:mx-auto items-center justify-center gap-2.5 rounded-full bg-white text-[16px] font-semibold text-onlight shadow-[0_8px_28px_rgba(255,255,255,0.22)] transition-all hover:opacity-95 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Empezar entrenamiento
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="flex h-[54px] w-full sm:max-w-md sm:mx-auto items-center justify-center gap-2 rounded-full border border-destructive/50 bg-destructive/15 text-[15.5px] font-semibold text-destructive transition hover:bg-destructive/25 active:scale-[0.98]"
              >
                Finalizar entrenamiento en curso
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Workout Finish Summary Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-hair bg-deep p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal/20 text-teal2">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl uppercase tracking-wide text-white">
              ¡Entrenamiento completado!
            </h2>
            <p className="mt-1 text-xs text-muted">
              Has entrenado con la rutina &quot;{routine.name}&quot;
            </p>

            <div className="my-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-hair bg-glass p-3">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-faint">
                  Tiempo
                </p>
                <p className="font-mono-digit mt-1 text-lg font-bold text-white">
                  {formatWorkoutTime(workoutSeconds)}
                </p>
              </div>
              <div className="rounded-2xl border border-hair bg-glass p-3">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-faint">
                  Series
                </p>
                <p className="font-mono-digit mt-1 text-lg font-bold text-white">
                  {lastSessionSummary?.totalSetsCompleted ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-hair bg-glass p-3">
                <p className="text-[10.5px] font-medium uppercase tracking-wider text-faint">
                  Volumen
                </p>
                <p className="font-mono-digit mt-1 text-lg font-bold text-teal2">
                  {lastSessionSummary?.totalVolumeKg ?? 0}kg
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/progreso"
                onClick={handleCloseFinishModal}
                className="flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-onlight shadow-lg transition hover:opacity-90 active:scale-95"
              >
                Ver mi progreso
              </Link>
              <button
                type="button"
                onClick={handleCloseFinishModal}
                className="h-11 w-full rounded-full border border-hair text-sm font-semibold text-faint transition hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {detailExercise ? (
        <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} />
      ) : null}

      {assignModalOpen && (
        <AssignStudentButton
          routineId={routine.id}
          students={students}
          modalOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
        />
      )}
    </div>
  );
}
