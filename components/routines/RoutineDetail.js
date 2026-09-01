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
import { totalSets, estimatedDurationMinutes, muscleDistribution } from "@/lib/routines/summary";
import { deleteRoutine, duplicateRoutine, updateRoutine } from "@/app/(app)/rutinas/actions";
import RoutineBuilder from "@/components/routines/RoutineBuilder";
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

function MuscleRing({ pct }) {
  const percent = Math.round(pct * 100);
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--teal2) 0 ${percent}%, var(--hair) 0)`,
      }}
    >
      <span className="font-mono-digit flex h-8 w-8 items-center justify-center rounded-full bg-deep text-[10px] text-text">
        {percent}%
      </span>
    </span>
  );
}

export default function RoutineDetail({ routine, catalogExercises, customExercises }) {
  const router = useRouter();
  const [mode, setMode] = useState("view");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);

  // Exercises list for interactive updates
  const [exercisesList, setExercisesList] = useState(routine.exercises || []);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error' | null

  // Active workout timer states
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);

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

  const handleStartWorkout = () => {
    setWorkoutActive(true);
    setWorkoutPaused(false);
    // Smooth scroll to top to see session header
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinishWorkout = () => {
    setWorkoutPaused(true);
    setShowFinishModal(true);
  };

  const handleCloseFinishModal = () => {
    setShowFinishModal(false);
    setWorkoutActive(false);
    setWorkoutPaused(false);
    setWorkoutSeconds(0);
  };

  if (mode === "edit") {
    return (
      <div className="flex flex-col gap-5 px-[18px] pb-[100px]">
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

  return (
    <div className="relative flex flex-col gap-5 px-[18px] pb-[110px]">
      {/* Active Workout Floating / Sticky Banner */}
      {workoutActive && (
        <div className="sticky top-2 z-40 mb-1 flex items-center justify-between gap-3 rounded-2xl border border-teal/40 bg-deep/95 p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
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
              className="flex h-9 items-center justify-center rounded-full bg-destructive px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
            >
              Terminar
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-start justify-between gap-3">
        <Link
          href="/rutinas"
          aria-label="Volver"
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full text-faint transition hover:bg-glass hover:text-text"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Más opciones"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hair text-text transition hover:border-teal2"
          >
            ⋮
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-11 z-10 w-44 overflow-hidden rounded-2xl border border-hair bg-deep shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
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

      <div>
        <h1 className="font-display text-[32px] uppercase leading-none text-white">
          {routine.name}
        </h1>
        <p className="mt-2 text-sm text-faint">
          {exercisesList.length} ejercicios · ~{estimatedDurationMinutes(currentRoutineWithExercises, exerciseLookup)} min
        </p>
        {routine.note ? <p className="mt-2 text-sm text-muted">{routine.note}</p> : null}
      </div>

      {distribution.length ? (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Distribución muscular
          </p>
          <div className="-mx-[18px] flex gap-4 overflow-x-auto px-[18px] pb-1 scrollbar-none">
            {distribution.map(({ muscle, pct }) => (
              <div key={muscle} className="flex shrink-0 flex-col items-center gap-1.5">
                <MuscleRing pct={pct} />
                <span className="max-w-[64px] truncate text-[10px] text-muted">
                  {MUSCLE_GROUP_LABELS[muscle]}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Exercises Section with Accordion Dropdown */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
              {exercisesList.length} {exercisesList.length === 1 ? "ejercicio" : "ejercicios"}
            </p>
            <p className="text-[11px] text-faint">
              Tocá cualquier ejercicio para ajustar series, reps, peso o RIR
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-digit text-xs text-faint">
              {totalSets(currentRoutineWithExercises)} series
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {exercisesList.map((item, index) => {
            const exercise = exerciseLookup.get(item.exerciseId);
            const timeBased = isTimeBasedRegistration(exercise?.registrationType);
            const isExpanded = expandedIndex === index;

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
                  className="flex w-full items-center gap-3 p-3 text-left transition"
                >
                  {exercise?.mediaUrl ? (
                    <Image
                      src={exercise.mediaUrl}
                      alt=""
                      width={52}
                      height={52}
                      className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-glass2 text-faint">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <circle cx="12" cy="8.5" r="3.2" />
                        <path d="M5 20a7 7 0 0 1 14 0" />
                      </svg>
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14.5px] font-semibold text-text">
                        {exercise?.nameEs || "Ejercicio"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-faint">
                      <span className="font-medium text-white/90">
                        {item.targetSets} {item.targetSets === 1 ? "serie" : "series"} × {item.targetReps} {timeBased ? "seg" : "reps"}
                      </span>
                      {item.targetWeight ? (
                        <span className="rounded bg-teal/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-teal2">
                          {item.targetWeight} kg
                        </span>
                      ) : null}
                      {item.targetRIR != null ? (
                        <span className="text-white/60">· RIR {item.targetRIR}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Dropdown Chevron Icon */}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hair transition-transform duration-300 ${
                      isExpanded ? "rotate-180 border-teal/40 bg-teal/15 text-teal2" : "text-faint"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>

                {/* Dropdown Expanded Body: Controls for Series, Reps, Weight, RIR */}
                {isExpanded && (
                  <div className="border-t border-hair/60 bg-black/20 p-4 transition-all duration-300">
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
      </section>

      {/* Main Bottom Button: Empezar Entrenamiento */}
      {!workoutActive ? (
        <button
          type="button"
          onClick={handleStartWorkout}
          className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-white text-[16px] font-semibold text-onlight shadow-[0_8px_28px_rgba(255,255,255,0.22)] transition-all hover:opacity-95 active:scale-[0.98]"
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
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full border border-destructive/50 bg-destructive/15 text-[15.5px] font-semibold text-destructive transition hover:bg-destructive/25 active:scale-[0.98]"
        >
          Finalizar entrenamiento en curso
        </button>
      )}

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

            <div className="my-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-hair bg-glass p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                  Tiempo total
                </p>
                <p className="font-mono-digit mt-1 text-xl font-bold text-white">
                  {formatWorkoutTime(workoutSeconds)}
                </p>
              </div>
              <div className="rounded-2xl border border-hair bg-glass p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
                  Series
                </p>
                <p className="font-mono-digit mt-1 text-xl font-bold text-white">
                  {totalSets(currentRoutineWithExercises)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseFinishModal}
              className="h-12 w-full rounded-full bg-white text-sm font-semibold text-onlight shadow-lg transition hover:opacity-90 active:scale-95"
            >
              Cerrar y volver
            </button>
          </div>
        </div>
      )}

      {detailExercise ? (
        <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} />
      ) : null}
    </div>
  );
}

