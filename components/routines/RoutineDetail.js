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
import { assignRoutine, logExerciseSet, completeAssignmentSession } from "@/app/(app)/rutinas/[id]/actions";
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

  // Fila de una serie de un ejercicio asignado: override local (si el alumno
  // ya la tocó en esta sesión) o lo ya guardado en Firestore, o el target
  // como default. item.targetReps/targetWeight quedan como punto de partida
  // editable porque en la práctica cada serie puede variar (10/12/14 reps
  // subiendo carga, por ejemplo).
  const getSetLogRow = (exerciseIndex, setIndex, item) => {
    const local = logStates[exerciseIndex]?.[setIndex];
    if (local) return local;
    const saved = routine.exerciseLogs?.[exerciseIndex]?.sets?.[setIndex];
    if (saved) {
      return {
        reps: String(saved.reps ?? ""),
        weight: saved.weight != null ? String(saved.weight) : "",
        saved: true,
      };
    }
    return {
      reps: item.targetReps != null ? String(item.targetReps) : "",
      weight: item.targetWeight != null ? String(item.targetWeight) : "",
      saved: false,
    };
  };

  const updateSetLogField = (exerciseIndex, setIndex, field, value, item) => {
    setLogStates((prev) => {
      const current = prev[exerciseIndex]?.[setIndex] || getSetLogRow(exerciseIndex, setIndex, item);
      return {
        ...prev,
        [exerciseIndex]: {
          ...(prev[exerciseIndex] || {}),
          [setIndex]: { ...current, [field]: value, saved: false },
        },
      };
    });
  };

  const isExerciseFullyLogged = (exerciseIndex, item) => {
    const targetSets = Number(item.targetSets) || 0;
    if (targetSets === 0) return false;
    for (let setIndex = 0; setIndex < targetSets; setIndex += 1) {
      if (!getSetLogRow(exerciseIndex, setIndex, item).saved) return false;
    }
    return true;
  };

  const handleLogSet = async (exerciseIndex, setIndex, item) => {
    const row = getSetLogRow(exerciseIndex, setIndex, item);
    const key = `${exerciseIndex}-${setIndex}`;
    setLogStatus({ key, status: "saving" });
    try {
      await logExerciseSet(routine.assignmentId, exerciseIndex, setIndex, {
        reps: row.reps,
        weight: row.weight,
      });
      setLogStates((prev) => ({
        ...prev,
        [exerciseIndex]: { ...(prev[exerciseIndex] || {}), [setIndex]: { ...row, saved: true } },
      }));
      setLogStatus(null);
    } catch (err) {
      console.error(err);
      setLogStatus({ key, status: "error" });
      setTimeout(() => setLogStatus(null), 3000);
    }
  };

  const getExerciseSets = (item, exerciseIndex) => {
    if (workoutActive) {
      if (readOnly) {
        const count = Number(item.targetSets) || 1;
        return Array.from({ length: count }, (_, sIdx) => {
          const row = getSetLogRow(exerciseIndex, sIdx, item);
          return {
            setNumber: sIdx + 1,
            weight: row.weight,
            reps: row.reps,
            saved: row.saved,
          };
        });
      }
      const sets = performedSets[item.exerciseId] || [];
      return sets.map((s, sIdx) => ({
        setNumber: sIdx + 1,
        weight: s.weight,
        reps: s.reps,
        failed: s.failed,
      }));
    }

    if (Array.isArray(item.sets) && item.sets.length > 0) {
      return item.sets.map((s, sIdx) => ({
        setNumber: sIdx + 1,
        weight: s.weight != null && s.weight !== "" ? String(s.weight) : (item.targetWeight != null ? String(item.targetWeight) : ""),
        reps: s.reps != null && s.reps !== "" ? String(s.reps) : (item.targetReps != null ? String(item.targetReps) : "10"),
        rir: s.rir ?? item.targetRIR,
      }));
    }

    const count = Number(item.targetSets) || 3;
    return Array.from({ length: count }, (_, sIdx) => ({
      setNumber: sIdx + 1,
      weight: item.targetWeight != null ? String(item.targetWeight) : "",
      reps: item.targetReps != null ? String(item.targetReps) : "10",
      rir: item.targetRIR,
    }));
  };

  const handleUpdateSetField = (exerciseIndex, setIndex, field, value) => {
    setExercisesList((prev) => {
      const next = [...prev];
      const targetItem = { ...next[exerciseIndex] };
      const currentSets = getExerciseSets(targetItem, exerciseIndex);
      const updatedSets = currentSets.map((s, idx) => {
        if (idx === setIndex) {
          return { ...s, [field]: value };
        }
        return s;
      });
      targetItem.sets = updatedSets;
      targetItem.targetSets = updatedSets.length;
      if (setIndex === 0) {
        if (field === "weight") targetItem.targetWeight = value === "" ? null : Number(value);
        if (field === "reps") targetItem.targetReps = value === "" ? 10 : Number(value);
        if (field === "rir") targetItem.targetRIR = value === "" ? null : Number(value);
      }
      next[exerciseIndex] = targetItem;
      return next;
    });
  };

  const handleAddSetToExercise = (exerciseIndex) => {
    setExercisesList((prev) => {
      const next = [...prev];
      const targetItem = { ...next[exerciseIndex] };
      const currentSets = getExerciseSets(targetItem, exerciseIndex);
      const last = currentSets[currentSets.length - 1];
      const newSet = {
        setNumber: currentSets.length + 1,
        weight: last?.weight || "",
        reps: last?.reps || "10",
        rir: last?.rir ?? null,
      };
      targetItem.sets = [...currentSets, newSet];
      targetItem.targetSets = targetItem.sets.length;
      next[exerciseIndex] = targetItem;
      return next;
    });
  };

  const handleRemoveSetFromExercise = (exerciseIndex) => {
    setExercisesList((prev) => {
      const next = [...prev];
      const targetItem = { ...next[exerciseIndex] };
      const currentSets = getExerciseSets(targetItem, exerciseIndex);
      if (currentSets.length <= 1) return prev;
      targetItem.sets = currentSets.slice(0, -1);
      targetItem.targetSets = targetItem.sets.length;
      next[exerciseIndex] = targetItem;
      return next;
    });
  };

  const handleStartWorkout = () => {
    const seeded = {};
    for (const [i, item] of exercisesList.entries()) {
      const sets = getExerciseSets(item, i);
      seeded[item.exerciseId] = sets.map((s) => ({
        weight: s.weight != null && s.weight !== "" ? String(s.weight) : (item.targetWeight != null ? String(item.targetWeight) : ""),
        reps: s.reps != null && s.reps !== "" ? String(s.reps) : (item.targetReps != null ? String(item.targetReps) : "10"),
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

    if (readOnly) {
      // Rutina asignada: cada serie ya se guardó al tocar "Listo". Acá solo
      // cerramos el timer y dejamos la duración en la asignación, visible
      // para el coach.
      try {
        let loggedSetsCount = 0;
        let totalVolumeKg = 0;
        exercisesList.forEach((item, exerciseIndex) => {
          const targetSets = Number(item.targetSets) || 0;
          for (let setIndex = 0; setIndex < targetSets; setIndex += 1) {
            const row = getSetLogRow(exerciseIndex, setIndex, item);
            if (row.saved) {
              loggedSetsCount += 1;
              totalVolumeKg += (Number(row.weight) || 0) * (Number(row.reps) || 0);
            }
          }
        });
        await completeAssignmentSession(routine.assignmentId, workoutSeconds);
        setLastSessionSummary({
          totalSetsCompleted: loggedSetsCount,
          totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
        });
        setSessionSaveStatus(null);
        setShowFinishModal(true);
      } catch (err) {
        console.error(err);
        setSessionSaveStatus("error");
        setWorkoutPaused(false);
      }
      return;
    }

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

  const durationMinutes = estimatedDurationMinutes(currentRoutineWithExercises, exerciseLookup) || 55;
  const totalSetsCount = totalSets(currentRoutineWithExercises) || 18;

  const topMuscles = useMemo(() => {
    if (!distribution || distribution.length === 0) {
      return [
        { name: "Pecho", pct: 45, color: "#E05338" },
        { name: "Hombros", pct: 30, color: "#9D362E" },
        { name: "Tríceps", pct: 25, color: "#4F0A0A" },
      ];
    }

    const top3 = distribution.slice(0, 3);
    const sum = top3.reduce((acc, d) => acc + d.pct, 0) || 1;
    const colors = ["#E05338", "#9D362E", "#4F0A0A"];

    let remaining = 100;
    return top3.map((d, i) => {
      const isLast = i === top3.length - 1;
      const pct = isLast ? remaining : Math.round((d.pct / sum) * 100);
      remaining -= pct;
      return {
        name: MUSCLE_GROUP_LABELS[d.muscle] || d.muscle,
        pct: Math.max(5, pct),
        color: colors[i] || "#4F0A0A",
      };
    });
  }, [distribution]);

  return (
    <div className="relative min-h-screen w-full bg-[#1A0507]">
      {/* ── TOP HERO (Athletic Dumbbells on Red Gym Rubber Floor) ── */}
      <div className="relative w-full h-[32vh] min-h-[260px] max-h-[300px] overflow-hidden bg-[#2D0608] flex flex-col justify-between">
        <Image
          src="/hero-gym.jpg"
          alt={routine.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark contrast gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140305]/95 via-[#140305]/40 to-[#140305]/65" />

        {/* Top Control Bar */}
        <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 max-w-[760px] mx-auto w-full">
          {/* Back Button */}
          <Link
            href="/rutinas"
            aria-label="Volver a rutinas"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60 active:scale-95 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Options Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Más opciones"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60 active:scale-95 shadow-sm"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-30 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#1F0708] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setMode("edit");
                    }}
                    className="flex h-10 w-full items-center rounded-xl px-3 text-left text-xs font-semibold text-white/90 hover:bg-white/10"
                  >
                    Editar completa
                  </button>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDuplicate}
                    className="flex h-10 w-full items-center rounded-xl px-3 text-left text-xs font-semibold text-white/90 hover:bg-white/10 disabled:opacity-40"
                  >
                    Duplicar
                  </button>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    disabled={showOnHomeBusy}
                    onClick={() => {
                      setMenuOpen(false);
                      handleToggleShowOnHome();
                    }}
                    className="flex h-10 w-full items-center rounded-xl px-3 text-left text-xs font-semibold text-white/90 hover:bg-white/10 disabled:opacity-40"
                  >
                    {showOnHome ? "Quitar del inicio" : "Mostrar en inicio"}
                  </button>
                )}
                {isCoach && students.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setAssignModalOpen(true);
                    }}
                    className="flex h-10 w-full items-center rounded-xl px-3 text-left text-xs font-semibold text-[#FF5524] hover:bg-[#FF5524]/10"
                  >
                    Asignar a alumno
                  </button>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmingDelete(true);
                    }}
                    className="flex h-10 w-full items-center rounded-xl px-3 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    Eliminar rutina
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title Overlay at bottom-left */}
        <div className="relative z-10 px-5 pb-9 sm:px-8 max-w-[760px] mx-auto w-full">
          <h1 className="font-sans text-[34px] sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-none">
            {routine.name}
          </h1>
          <p className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/80">
            RUTINA DE ENTRENAMIENTO
          </p>
        </div>
      </div>

      {/* ── BONE CONTENT CARD (Overlaps Hero with rounded-t-[32px]) ── */}
      <div className="-mt-6 relative z-10 min-h-screen rounded-t-[32px] bg-[#EDE8E1] border-t border-[#5A1215]/20 px-5 pt-6 pb-36 sm:px-8 shadow-xl">
        <div className="mx-auto max-w-[720px]">
          {/* Delete confirmation alert if triggered */}
          {confirmingDelete && (
            <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-[#141414]">
                ¿Eliminar &quot;{routine.name}&quot;?
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
                  className="h-9 rounded-full border border-black/15 bg-white px-4 text-xs font-semibold text-[#141414]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Metric Strip matching Screenshot */}
          <div className="flex items-center justify-around rounded-2xl border border-[#D5CEC4] bg-[#E3DDD3]/60 py-3.5 px-2">
            <div className="flex items-center gap-2 px-2">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#E05338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 5h2v14H6zm10 0h2v14h-2zM2 9h2v6H2zm18 0h2v6h-2zM7 11h10v2H7z" />
              </svg>
              <p className="text-xs text-[#575049]">
                <strong className="font-bold text-[#141414] text-sm">{exercisesList.length}</strong> ejercicios
              </p>
            </div>
            <div className="h-6 w-px bg-[#D0C8BD]" />
            <div className="flex items-center gap-2 px-2">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#E05338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
              <p className="text-xs text-[#575049]">
                <strong className="font-bold text-[#141414] text-sm">{durationMinutes}</strong> min
              </p>
            </div>
            <div className="h-6 w-px bg-[#D0C8BD]" />
            <div className="flex items-center gap-2 px-2">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#E05338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 12 12 17 22 12" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
              <p className="text-xs text-[#575049]">
                <strong className="font-bold text-[#141414] text-sm">{totalSetsCount}</strong> series
              </p>
            </div>
          </div>

          <div className="my-5 border-b border-[#DCD6CC]" />

          {/* DISTRIBUCIÓN MUSCULAR */}
          <div className="flex flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E05338] mb-2.5">
              DISTRIBUCIÓN MUSCULAR
            </p>
            <div className="flex h-7 sm:h-8 w-full overflow-hidden rounded-lg shadow-xs">
              {topMuscles.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-center text-xs font-bold text-white transition-all"
                  style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                >
                  {m.pct}%
                </div>
              ))}
            </div>
            <div className="mt-2 flex w-full justify-between text-xs font-semibold text-[#575049]">
              {topMuscles.map((m) => (
                <span key={m.name} style={{ width: `${m.pct}%` }} className="text-center truncate px-0.5">
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          <div className="my-5 border-b border-[#DCD6CC]" />

          {/* EXERCISE LIST */}
          <div className="flex flex-col">
            {exercisesList.map((item, index) => {
              const exercise = exerciseLookup.get(item.exerciseId);
              const timeBased = isTimeBasedRegistration(exercise?.registrationType);
              const subtitle = `${item.targetSets || 3} series × ${item.targetReps || 10} ${timeBased ? "seg" : "reps"}`;
              const primary = primaryMuscle(exercise);
              const muscleName = primary ? (MUSCLE_GROUP_LABELS[primary] || primary) : "General";
              const isExpanded = expandedIndex === index;

              const setsForExercise = getExerciseSets(item, index);

              return (
                <div key={`${item.exerciseId}-${index}`} className="border-b border-[#DCD6CC] py-3.5">
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    {/* Exercise Thumbnail */}
                    <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white border border-[#DCD6CC] shadow-xs group-hover:border-[#E05338]/40 transition-colors">
                      {exercise?.mediaUrl ? (
                        <Image
                          src={exercise.mediaUrl}
                          alt={exercise?.nameEs || "Ejercicio"}
                          fill
                          className="object-contain p-1.5"
                          unoptimized
                        />
                      ) : (
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#756C65" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 5h2v14H6zm10 0h2v14h-2zM2 9h2v6H2zm18 0h2v6h-2zM7 11h10v2H7z" />
                        </svg>
                      )}
                    </div>

                    {/* Exercise Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-sans text-[15px] font-bold text-[#141414] group-hover:text-[#E05338] transition-colors">
                          {exercise?.nameEs || item.exerciseId}
                        </h3>
                        {exercise?.source === "custom" && (
                          <span className="shrink-0 rounded-full bg-[#E05338]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#E05338]">
                            Tuyo
                          </span>
                        )}
                        {readOnly && isExerciseFullyLogged(index, item) && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-600/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-700">
                            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Listo
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#575049]">
                        {subtitle}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-[#8C827A] capitalize">
                        {muscleName}
                      </p>
                    </div>

                    {/* Dropdown Chevron Icon */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center text-[#8C827A] transition-transform duration-200 group-hover:text-[#E05338] ${isExpanded ? "rotate-180 text-[#E05338]" : ""}`}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Dropdown Expanded Body: Fila por cada serie individual */}
                  {isExpanded && (
                    <div className="mt-3 rounded-2xl border border-[#D5CEC4] bg-[#EAE5DC]/85 p-3 sm:p-4 shadow-xs transition-all duration-200">
                      {/* Sub-cabecera */}
                      <div className="flex items-center justify-between px-1 pb-2 border-b border-[#DCD6CC]">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E05338]">
                            Series de {exercise?.nameEs || "ejercicio"}
                          </span>
                          <span className="rounded-full bg-[#E05338]/10 px-2 py-0.5 text-[10px] font-bold text-[#E05338]">
                            {setsForExercise.length} {setsForExercise.length === 1 ? "serie" : "series"}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-[#756C65]">
                          Peso individual · {timeBased ? "Segundos" : "Repeticiones"}
                        </span>
                      </div>

                      {/* Header de columnas */}
                      <div className="grid grid-cols-[36px_1fr_16px_1fr_auto] items-center gap-2 px-1 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#756C65]">
                        <span className="text-center">Set</span>
                        <span className="text-center">Peso (kg)</span>
                        <span />
                        <span className="text-center">{timeBased ? "Tiempo (s)" : "Reps"}</span>
                        <span className="text-right min-w-[70px]">{workoutActive ? (readOnly ? "Estado" : "Fallo") : "RIR"}</span>
                      </div>

                      {/* Filas de series individuales: una fila por cada serie con su peso y repeticiones por separado */}
                      <div className="mt-1 flex flex-col gap-2">
                        {setsForExercise.map((setRow, setIndex) => {
                          const isLogged = workoutActive && readOnly && setRow.saved;
                          const statusKey = `${index}-${setIndex}`;
                          const isSaving = logStatus?.key === statusKey && logStatus?.status === "saving";
                          const hasError = logStatus?.key === statusKey && logStatus?.status === "error";

                          return (
                            <div
                              key={setIndex}
                              className={`grid grid-cols-[36px_1fr_16px_1fr_auto] items-center gap-2 rounded-xl border p-2 shadow-2xs transition ${
                                isLogged
                                  ? "border-green-600/40 bg-green-500/10"
                                  : hasError
                                  ? "border-red-500/50 bg-red-50"
                                  : "border-[#DCD6CC] bg-white"
                              }`}
                            >
                              {/* Número de serie */}
                              <span className="font-mono text-center text-xs font-bold text-[#E05338]">
                                #{setIndex + 1}
                              </span>

                              {/* Peso (kg) */}
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  placeholder="0"
                                  disabled={readOnly && (!workoutActive || isLogged)}
                                  value={setRow.weight ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (workoutActive) {
                                      if (readOnly) {
                                        updateSetLogField(index, setIndex, "weight", val, item);
                                      } else {
                                        handleUpdateSet(item.exerciseId, setIndex, "weight", val);
                                      }
                                    } else {
                                      handleUpdateSetField(index, setIndex, "weight", val);
                                    }
                                  }}
                                  className="font-mono h-10 w-full rounded-lg border border-[#D5CEC4] bg-[#F4F1EA] px-2 text-center text-sm font-bold text-[#141414] outline-none transition focus:border-[#E05338] focus:bg-white disabled:opacity-75 disabled:bg-gray-100"
                                />
                                <span className="pointer-events-none absolute right-2 text-[10px] font-semibold text-[#8C827A]">
                                  kg
                                </span>
                              </div>

                              {/* Separador × */}
                              <span className="text-center text-xs font-bold text-[#8C827A]">
                                ×
                              </span>

                              {/* Repeticiones o Segundos */}
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  placeholder={timeBased ? "seg" : "reps"}
                                  disabled={readOnly && (!workoutActive || isLogged)}
                                  value={setRow.reps ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (workoutActive) {
                                      if (readOnly) {
                                        updateSetLogField(index, setIndex, "reps", val, item);
                                      } else {
                                        handleUpdateSet(item.exerciseId, setIndex, "reps", val);
                                      }
                                    } else {
                                      handleUpdateSetField(index, setIndex, "reps", val);
                                    }
                                  }}
                                  className="font-mono h-10 w-full rounded-lg border border-[#D5CEC4] bg-[#F4F1EA] px-2 text-center text-sm font-bold text-[#141414] outline-none transition focus:border-[#E05338] focus:bg-white disabled:opacity-75 disabled:bg-gray-100"
                                />
                                <span className="pointer-events-none absolute right-2 text-[10px] font-semibold text-[#8C827A]">
                                  {timeBased ? "s" : "r"}
                                </span>
                              </div>

                              {/* Columna de Acción o RIR */}
                              {workoutActive ? (
                                readOnly ? (
                                  <button
                                    type="button"
                                    disabled={isSaving || isLogged}
                                    onClick={() => handleLogSet(index, setIndex, item)}
                                    className={`flex h-10 min-w-[70px] items-center justify-center rounded-lg px-2 text-xs font-bold transition disabled:opacity-70 ${
                                      isLogged
                                        ? "bg-green-600 text-white shadow-xs"
                                        : "bg-[#E05338] text-white hover:bg-[#D0452C] active:scale-95"
                                    }`}
                                  >
                                    {isLogged ? "Listo ✓" : isSaving ? "..." : "Listo"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSet(item.exerciseId, setIndex, "failed", !setRow.failed)}
                                    className={`flex h-10 min-w-[60px] items-center justify-center rounded-lg border text-xs font-bold transition ${
                                      setRow.failed
                                        ? "border-red-500 bg-red-100 text-red-600"
                                        : "border-[#DCD6CC] bg-[#F4F1EA] text-[#8C827A] hover:text-[#141414]"
                                    }`}
                                  >
                                    {setRow.failed ? "Fallo" : "RPE"}
                                  </button>
                                )
                              ) : (
                                <div className="flex items-center justify-end min-w-[70px]">
                                  {!readOnly ? (
                                    <select
                                      value={setRow.rir ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? null : Number(e.target.value);
                                        handleUpdateSetField(index, setIndex, "rir", val);
                                      }}
                                      className="font-mono h-10 rounded-lg border border-[#D5CEC4] bg-[#F4F1EA] px-2 text-xs font-bold text-[#141414] outline-none focus:border-[#E05338]"
                                    >
                                      <option value="">RIR —</option>
                                      <option value="0">RIR 0</option>
                                      <option value="1">RIR 1</option>
                                      <option value="2">RIR 2</option>
                                      <option value="3">RIR 3</option>
                                    </select>
                                  ) : (
                                    <span className="font-mono rounded-lg border border-[#DCD6CC] bg-[#F4F1EA] px-2.5 py-2 text-xs font-bold text-[#575049]">
                                      {setRow.rir != null ? `RIR ${setRow.rir}` : "RIR —"}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Botonera inferior de la serie */}
                      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCD6CC] pt-3">
                        <div className="flex items-center gap-2">
                          {(!readOnly || workoutActive) && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (workoutActive) {
                                    handleAddSet(item.exerciseId);
                                  } else {
                                    handleAddSetToExercise(index);
                                  }
                                }}
                                className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-[#DCD6CC] bg-white px-2.5 text-xs font-bold text-[#575049] transition hover:border-[#E05338] hover:text-[#E05338]"
                              >
                                + Agregar serie
                              </button>
                              {setsForExercise.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (workoutActive) {
                                      handleRemoveSet(item.exerciseId);
                                    } else {
                                      handleRemoveSetFromExercise(index);
                                    }
                                  }}
                                  className="flex h-8 items-center rounded-lg border border-[#DCD6CC] bg-white px-2.5 text-xs font-semibold text-[#8C827A] transition hover:text-[#141414]"
                                >
                                  Sacar última
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {exercise && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailExercise(exercise);
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-[#E05338] hover:underline"
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              Ver técnica
                            </button>
                          )}

                          {!readOnly && !workoutActive && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRoutineChanges();
                              }}
                              disabled={saveStatus === "saving"}
                              className="flex h-8 items-center gap-1.5 rounded-full bg-[#E05338] px-3.5 text-xs font-bold text-white transition hover:bg-[#D0452C] active:scale-95 disabled:opacity-50"
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {routine.exercises.some((item) => exerciseLookup.get(item.exerciseId)?.mediaUrl) && (
            <div className="mt-4">
              <MediaAttribution />
            </div>
          )}

          {/* Primary Action Button ("Empezar entrenamiento" matching Screenshot) */}
          <div className="sticky bottom-24 z-20 mt-8">
            {!workoutActive ? (
              <button
                type="button"
                onClick={handleStartWorkout}
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-[#E05338] text-[16px] font-bold text-white shadow-[0_8px_24px_rgba(224,83,56,0.38)] transition-all hover:bg-[#D0452C] active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
                Empezar entrenamiento
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-[#E05338]/40 bg-[#1A0507]/95 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-md text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`absolute inline-flex h-full w-full rounded-full bg-[#E05338] opacity-75 ${workoutPaused ? "" : "animate-ping"}`} />
                      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${workoutPaused ? "bg-amber-400" : "bg-[#E05338]"}`} />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#E05338]">
                      {workoutPaused ? "En pausa" : "Entrenando"}
                    </span>
                  </div>
                  <div className="font-mono text-xl font-bold tracking-wider">
                    {formatWorkoutTime(workoutSeconds)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setWorkoutPaused((v) => !v)}
                    className="flex h-8 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    {workoutPaused ? "Reanudar" : "Pausar"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleFinishWorkout}
                  disabled={sessionSaveStatus === "saving"}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-destructive text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:opacity-60"
                >
                  {sessionSaveStatus === "saving" ? "Guardando…" : "Terminar entrenamiento"}
                </button>
              </div>
            )}
          </div>
        </div>
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
                href={readOnly ? "/rutinas" : "/progreso"}
                onClick={handleCloseFinishModal}
                className="flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-onlight shadow-lg transition hover:opacity-90 active:scale-95"
              >
                {readOnly ? "Volver a rutinas" : "Ver mi progreso"}
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
