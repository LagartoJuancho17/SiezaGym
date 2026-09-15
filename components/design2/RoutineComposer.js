"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRoutine } from "@/app/(app)/rutinas/actions";
import { isTimeBasedRegistration, MUSCLE_GROUP_LABELS } from "@/lib/exercises/constants";
import { muscleDistribution } from "@/lib/routines/summary";
import { primaryMuscleLabel } from "@/lib/exercises/browse";
import { ArrowLeftIcon, CloseIcon, PlusIcon, WeightIcon } from "./Icons";
import ExercisePicker from "./ExercisePicker";

/** Lo que se prescribe por defecto al agregar un ejercicio. */
function defaultItemFor(exercise) {
  return {
    exerciseId: exercise.id,
    exerciseSource: exercise.source === "custom" ? "custom" : "catalog",
    // En los ejercicios de tiempo, targetReps son segundos y no repeticiones.
    targetSets: 3,
    targetReps: isTimeBasedRegistration(exercise.registrationType) ? 30 : 10,
    targetRIR: null,
    techniqueNote: "",
  };
}

export default function RoutineComposer({ exercises }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [items, setItems] = useState([]);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const lookup = useMemo(() => new Map(exercises.map((item) => [item.id, item])), [exercises]);
  const addedIds = useMemo(() => new Set(items.map((item) => item.exerciseId)), [items]);

  // El reparto sale de muscleWeights del catalogo, no de una estimacion.
  const muscles = useMemo(
    () => muscleDistribution({ exercises: items }, lookup).slice(0, 5),
    [items, lookup],
  );

  function addChosen(chosen) {
    setItems((current) => [
      ...current,
      ...chosen.filter((exercise) => !addedIds.has(exercise.id)).map(defaultItemFor),
    ]);
    setPicking(false);
  }

  function patch(exerciseId, changes) {
    setItems((current) =>
      current.map((item) => (item.exerciseId === exerciseId ? { ...item, ...changes } : item)),
    );
  }

  async function save() {
    setError("");
    if (!name.trim()) return setError("Ponele un nombre a la rutina.");
    if (!items.length) return setError("Agregá al menos un ejercicio.");

    setSaving(true);
    try {
      const id = await createRoutine({ name: name.trim(), note: "", exercises: items });
      router.push(`/rutinas/${id}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo guardar la rutina.");
      setSaving(false);
    }
  }

  return (
    <>
      <header className="d2-compose-head">
        <Link href="/rutinas" aria-label="Volver a rutinas" className="d2-back">
          <ArrowLeftIcon size={20} width={1.8} />
        </Link>
        <h1 className="d2-page-title">Nueva rutina</h1>
        <button type="button" onClick={save} disabled={saving} className="d2-save">
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </header>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre de la rutina"
        aria-label="Nombre de la rutina"
        maxLength={60}
        className="d2-name-field"
      />

      <p className="d2-label">
        {items.length === 0
          ? "Ejercicios"
          : `Ejercicios · ${items.length}`}
      </p>

      {items.length > 0 && (
        <div className="d2-panel">
          {items.map((item) => {
            const exercise = lookup.get(item.exerciseId);
            const timeBased = isTimeBasedRegistration(exercise?.registrationType);
            return (
              <div key={item.exerciseId} className="d2-ex">
                <span className="d2-ex-thumb">
                  {exercise?.mediaUrl ? (
                    <Image src={exercise.mediaUrl} alt="" width={54} height={54} unoptimized />
                  ) : (
                    <WeightIcon size={22} width={1.5} />
                  )}
                </span>

                <span className="d2-ex-body">
                  <span className="d2-ex-name">{exercise?.nameEs || item.exerciseId}</span>
                  <span className="d2-ex-muscle">{primaryMuscleLabel(exercise) || "Sin datos"}</span>
                </span>

                <span className="d2-ex-sets">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    inputMode="numeric"
                    value={item.targetSets}
                    onChange={(event) => patch(item.exerciseId, { targetSets: Number(event.target.value) || 1 })}
                    aria-label={`Series de ${exercise?.nameEs || "el ejercicio"}`}
                    className="d2-num"
                  />
                  ×
                  <input
                    type="number"
                    min="1"
                    max="300"
                    inputMode="numeric"
                    value={item.targetReps}
                    onChange={(event) => patch(item.exerciseId, { targetReps: Number(event.target.value) || 1 })}
                    aria-label={timeBased ? "Segundos por serie" : "Repeticiones por serie"}
                    className="d2-num"
                  />
                  {timeBased ? "s" : ""}
                </span>

                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((row) => row.exerciseId !== item.exerciseId))}
                  aria-label={`Quitar ${exercise?.nameEs || "el ejercicio"}`}
                  className="d2-ex-remove"
                >
                  <CloseIcon size={15} width={1.8} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button type="button" onClick={() => setPicking(true)} className="d2-add">
        <PlusIcon size={17} width={1.8} />
        Agregar ejercicio
      </button>

      {muscles.length > 0 && (
        <>
          <p className="d2-label">Músculos que trabaja</p>
          <div className="d2-panel d2-muscles">
            {muscles.map((row) => (
              <div key={row.muscle} className="d2-muscle-row">
                <p className="d2-muscle-head">
                  <span>{MUSCLE_GROUP_LABELS[row.muscle] || row.muscle}</span>
                  <span>{Math.round(row.pct * 100)}%</span>
                </p>
                <span className="d2-muscle-bar">
                  <span style={{ width: `${Math.round(row.pct * 100)}%` }} />
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {error && <p className="d2-glass d2-error">{error}</p>}

      {picking && (
        <ExercisePicker
          exercises={exercises}
          alreadyAdded={addedIds}
          onCancel={() => setPicking(false)}
          onConfirm={addChosen}
        />
      )}
    </>
  );
}
