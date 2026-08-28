"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import ExercisePicker from "@/components/routines/ExercisePicker";
import ExerciseConfigRow from "@/components/routines/ExerciseConfigRow";
import { createRoutine, updateRoutine } from "@/app/rutinas/actions";

function defaultItemFor(exercise) {
  return {
    exerciseId: exercise.id,
    exerciseSource: exercise.source === "custom" ? "custom" : "catalog",
    targetSets: 3,
    targetRepRangeLow: 8,
    targetRepRangeHigh: 12,
    targetRIR: null,
    restSeconds: 90,
    techniqueNote: "",
  };
}

export default function RoutineBuilder({ mode, routine, catalogExercises, customExercises }) {
  const router = useRouter();
  const [name, setName] = useState(routine?.name || "");
  const [note, setNote] = useState(routine?.note || "");
  const [items, setItems] = useState(routine?.exercises || []);
  const [exerciseLookup, setExerciseLookup] = useState(() => {
    const map = new Map();
    for (const exercise of [...catalogExercises, ...customExercises]) {
      map.set(exercise.id, exercise);
    }
    return map;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const itemIds = useMemo(() => items.map((item) => item.exerciseId), [items]);

  function handlePickerConfirm(chosenExercises) {
    setExerciseLookup((prev) => {
      const next = new Map(prev);
      chosenExercises.forEach((exercise) => next.set(exercise.id, exercise));
      return next;
    });
    setItems((prev) => {
      const existingIds = new Set(prev.map((item) => item.exerciseId));
      const additions = chosenExercises
        .filter((exercise) => !existingIds.has(exercise.id))
        .map(defaultItemFor);
      return [...prev, ...additions];
    });
    setShowPicker(false);
  }

  function updateItem(updated) {
    setItems((prev) => prev.map((item) => (item.exerciseId === updated.exerciseId ? updated : item)));
  }

  function removeItem(exerciseId) {
    setItems((prev) => prev.filter((item) => item.exerciseId !== exerciseId));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.exerciseId === active.id);
      const newIndex = prev.findIndex((item) => item.exerciseId === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) {
      setError("Ponele un nombre a la rutina.");
      return;
    }
    if (!items.length) {
      setError("Agregá al menos un ejercicio.");
      return;
    }

    setSaving(true);
    try {
      const payload = { name, note, exercises: items };
      if (mode === "edit") {
        await updateRoutine(routine.id, payload);
        router.push(`/rutinas/${routine.id}`);
      } else {
        const id = await createRoutine(payload);
        router.push(`/rutinas/${id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo guardar la rutina.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label className="grid gap-1.5 text-sm text-muted">
          <span>Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Empuje A"
            className="h-11 rounded-xl border border-hair bg-glass px-3 text-text outline-none focus:border-teal2"
          />
        </label>
        <label className="grid gap-1.5 text-sm text-muted">
          <span>Nota (opcional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-14 resize-y rounded-xl border border-hair bg-glass px-3 py-2.5 text-text outline-none focus:border-teal2"
          />
        </label>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
            Ejercicios
          </span>
          <span className="font-mono-digit text-xs text-faint">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hair p-6 text-center text-sm text-faint">
            Todavía no agregaste ningún ejercicio.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <ExerciseConfigRow
                    key={item.exerciseId}
                    item={item}
                    exercise={exerciseLookup.get(item.exerciseId)}
                    onChange={updateItem}
                    onRemove={() => removeItem(item.exerciseId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-hair text-sm font-semibold text-text transition hover:border-teal2"
        >
          + Agregar ejercicios
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="h-[52px] w-full rounded-full bg-white text-[15px] font-semibold text-onlight transition hover:opacity-90 disabled:opacity-40"
      >
        {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear rutina"}
      </button>

      {showPicker ? (
        <ExercisePicker
          exercises={catalogExercises}
          customExercises={customExercises}
          onConfirm={handlePickerConfirm}
          onClose={() => setShowPicker(false)}
        />
      ) : null}
    </div>
  );
}
