"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS, REGISTRATION_TYPE_LABELS } from "@/lib/exercises/constants";
import { totalSets, estimatedDurationMinutes, muscleDistribution } from "@/lib/routines/summary";
import { deleteRoutine, duplicateRoutine } from "@/app/rutinas/actions";
import RoutineBuilder from "@/components/routines/RoutineBuilder";

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

  const exerciseLookup = useMemo(
    () => new Map([...catalogExercises, ...customExercises].map((e) => [e.id, e])),
    [catalogExercises, customExercises],
  );

  const distribution = useMemo(
    () => muscleDistribution(routine, exerciseLookup),
    [routine, exerciseLookup],
  );

  if (mode === "edit") {
    return (
      <main className="min-h-screen bg-bg px-[18px] py-7 text-text">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
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
      </main>
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
    <main className="min-h-screen bg-bg px-[18px] py-7 text-text">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="flex items-start justify-between gap-3">
          <Link href="/rutinas" aria-label="Volver" className="mt-1 text-faint transition hover:text-text">
            ←
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
                  Editar
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
            <p className="text-sm text-text">¿Eliminar &quot;{routine.name}&quot;? No afecta a las sesiones ya registradas con ella.</p>
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
          <h1 className="font-display text-[28px] uppercase leading-none">{routine.name}</h1>
          <p className="mt-2 text-sm text-faint">
            {routine.exercises.length} ejercicios, ~{estimatedDurationMinutes(routine)} min
          </p>
          {routine.note ? <p className="mt-2 text-sm text-muted">{routine.note}</p> : null}
        </div>

        {distribution.length ? (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
              Distribución muscular
            </p>
            <div className="-mx-[18px] flex gap-4 overflow-x-auto px-[18px] pb-1">
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

        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
              {routine.exercises.length} ejercicios
            </p>
            <span className="font-mono-digit text-xs text-faint">{totalSets(routine)} series</span>
          </div>
          <div className="flex flex-col gap-2">
            {routine.exercises.map((item) => {
              const exercise = exerciseLookup.get(item.exerciseId);
              return (
                <div key={item.exerciseId} className="rounded-2xl border border-hair bg-glass p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-text">
                      {exercise?.nameEs || "Ejercicio"}
                    </span>
                    <span className="font-mono-digit shrink-0 text-xs text-faint">
                      {item.targetSets} × {item.targetRepRangeLow}-{item.targetRepRangeHigh}
                      {item.targetRIR != null ? ` @RIR${item.targetRIR}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-faint">
                    {exercise ? EQUIPMENT_LABELS[exercise.equipment] : ""}
                    {exercise ? ` · ${REGISTRATION_TYPE_LABELS[exercise.registrationType]}` : ""}
                    {" · "}Descanso {item.restSeconds}s
                  </p>
                  {item.techniqueNote ? (
                    <p className="mt-1 text-xs text-muted">{item.techniqueNote}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          disabled
          title="La sesión en vivo todavía no está construida"
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-onlight"
        >
          ▶ Empezar entrenamiento
        </button>
      </div>
    </main>
  );
}
