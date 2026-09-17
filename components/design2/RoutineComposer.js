"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRoutine, updateRoutine } from "@/app/(app)/rutinas/actions";
import { isTimeBasedRegistration, MUSCLE_GROUP_LABELS } from "@/lib/exercises/constants";
import { muscleDistribution } from "@/lib/routines/summary";
import { ArrowLeftIcon, PlusIcon } from "./Icons";
import ExerciseItem from "./ExerciseItem";
import ExercisePicker from "./ExercisePicker";
import { moveExercise } from "@/lib/routines/compose";

/** Lo que se prescribe por defecto al agregar un ejercicio. */
function defaultItemFor(exercise) {
  return {
    exerciseId: exercise.id,
    exerciseSource: exercise.source === "custom" ? "custom" : "catalog",
    targetSets: 3,
    // En los ejercicios de tiempo, targetReps son segundos y no repeticiones.
    targetReps: isTimeBasedRegistration(exercise.registrationType) ? 30 : 10,
    targetWeight: null,
    targetRIR: null,
    techniqueNote: "",
    // null = todas las series iguales. Se llena al prescribir una por una.
    sets: null,
  };
}

/**
 * Armar una rutina, nueva o existente.
 *
 * Con `routine` entra en modo edición: arranca con lo que ya estaba cargado y
 * guarda sobre la misma rutina. Es la misma pantalla a propósito, porque editar
 * es agregar, sacar y volver a prescribir, exactamente lo mismo que crear.
 */
export default function RoutineComposer({ exercises, routine = null }) {
  const router = useRouter();
  const editing = !!routine;
  const [name, setName] = useState(routine?.name || "");
  const [note, setNote] = useState(routine?.note || "");
  const [createdExercises, setCreatedExercises] = useState([]);
  const [items, setItems] = useState(routine?.exercises || []);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const availableExercises = useMemo(() => [...exercises, ...createdExercises], [exercises, createdExercises]);
  const lookup = useMemo(() => new Map(availableExercises.map((item) => [item.id, item])), [availableExercises]);
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

  function replace(exerciseId, next) {
    setItems((current) => current.map((item) => (item.exerciseId === exerciseId ? next : item)));
  }

  async function save() {
    setError("");
    if (!name.trim()) return setError("Ponele un nombre a la rutina.");
    if (!items.length) return setError("Agregá al menos un ejercicio.");

    setSaving(true);
    try {
      const payload = { name: name.trim(), note: note.trim(), exercises: items };
      if (editing) {
        await updateRoutine(routine.id, payload);
        router.push(`/rutinas/${routine.id}`);
      } else {
        const id = await createRoutine(payload);
        router.push(`/rutinas/${id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo guardar la rutina.");
      setSaving(false);
    }
  }

  return (
    <>
      <header className="d2-compose-head">
        <Link
          href={editing ? `/rutinas/${routine.id}` : "/rutinas"}
          aria-label={editing ? "Volver a la rutina" : "Volver a rutinas"}
          className="d2-back"
        >
          <ArrowLeftIcon size={20} width={1.8} />
        </Link>
        <h1 className="d2-page-title">{editing ? "Editar rutina" : "Nueva rutina"}</h1>
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

      <p className="d2-label">{items.length === 0 ? "Ejercicios" : `Ejercicios · ${items.length}`}</p>

      {items.length > 0 && (
        <div className="d2-panel">
          {items.map((item, index) => (
            <div key={item.exerciseId}>
            <ExerciseItem
              key={item.exerciseId}
              item={item}
              exercise={lookup.get(item.exerciseId)}
              onChange={(next) => replace(item.exerciseId, next)}
              onRemove={() =>
                setItems((current) => current.filter((row) => row.exerciseId !== item.exerciseId))
              }
            />
            {items.length > 1 && <div className="d2-reorder">
              <button type="button" aria-label={`Subir ${lookup.get(item.exerciseId)?.nameEs || "ejercicio"}`} disabled={index === 0}
                onClick={() => setItems((current) => moveExercise(current, index, index - 1))}>↑</button>
              <button type="button" aria-label={`Bajar ${lookup.get(item.exerciseId)?.nameEs || "ejercicio"}`} disabled={index === items.length - 1}
                onClick={() => setItems((current) => moveExercise(current, index, index + 1))}>↓</button>
            </div>}
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setPicking(true)} className="d2-add">
        <PlusIcon size={17} width={1.8} />
        Agregar ejercicio
      </button>

      <label className="d2-form-field">
        Nota de la rutina (opcional)
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000}
          className="d2-input d2-textarea" placeholder="Indicaciones para este entrenamiento" />
      </label>

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
          exercises={availableExercises}
          onCreated={(exercise) => setCreatedExercises((current) => [...current, exercise])}
          alreadyAdded={addedIds}
          onCancel={() => setPicking(false)}
          onConfirm={addChosen}
        />
      )}
    </>
  );
}
