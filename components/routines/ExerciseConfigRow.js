"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EQUIPMENT_LABELS, isTimeBasedRegistration } from "@/lib/exercises/constants";
import ExerciseDetailSheet from "@/components/routines/ExerciseDetailSheet";

export default function ExerciseConfigRow({ item, exercise, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.exerciseId,
  });
  const [showDetail, setShowDetail] = useState(false);
  const repsLabel = isTimeBasedRegistration(exercise?.registrationType) ? "Tiempo (seg)" : "Reps";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function update(field, value) {
    onChange({ ...item, [field]: value });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-hair bg-glass p-3.5"
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
          className="mt-1 flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-full text-faint active:cursor-grabbing"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <circle cx="9" cy="6" r="1.4" />
            <circle cx="15" cy="6" r="1.4" />
            <circle cx="9" cy="12" r="1.4" />
            <circle cx="15" cy="12" r="1.4" />
            <circle cx="9" cy="18" r="1.4" />
            <circle cx="15" cy="18" r="1.4" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => exercise && setShowDetail(true)}
              disabled={!exercise}
              className="min-w-0 truncate text-left text-sm font-semibold text-text underline decoration-hair decoration-dotted underline-offset-4 transition hover:decoration-teal2 disabled:no-underline"
            >
              {exercise?.nameEs || "Ejercicio"}
              {exercise?.unilateral ? (
                <span className="ml-1.5 text-[10px] font-normal text-faint">(unilateral)</span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Quitar"
              className="shrink-0 text-faint transition hover:text-destructive"
            >
              ✕
            </button>
          </div>
          {exercise ? (
            <span className="text-xs text-faint">{EQUIPMENT_LABELS[exercise.equipment]}</span>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <label className="grid min-w-0 gap-1 text-[10px] uppercase tracking-wide text-faint">
              Series
              <input
                type="number"
                min="1"
                value={item.targetSets}
                onChange={(e) => update("targetSets", e.target.value)}
                className="font-mono-digit h-9 w-full min-w-0 rounded-lg border border-hair bg-glass2 px-1 text-center text-sm text-text outline-none focus:border-teal2"
              />
            </label>
            <label className="grid min-w-0 gap-1 text-[10px] uppercase tracking-wide text-faint">
              {repsLabel}
              <input
                type="number"
                min="1"
                value={item.targetReps}
                onChange={(e) => update("targetReps", e.target.value)}
                className="font-mono-digit h-9 w-full min-w-0 rounded-lg border border-hair bg-glass2 px-1 text-center text-sm text-text outline-none focus:border-teal2"
              />
            </label>
            <label className="grid min-w-0 gap-1 text-[10px] uppercase tracking-wide text-faint">
              RIR obj.
              <input
                type="number"
                min="0"
                max="10"
                placeholder="—"
                value={item.targetRIR ?? ""}
                onChange={(e) => update("targetRIR", e.target.value)}
                className="font-mono-digit h-9 w-full min-w-0 rounded-lg border border-hair bg-glass2 px-1 text-center text-sm text-text outline-none placeholder:text-faint focus:border-teal2"
              />
            </label>
          </div>

          <div className="mt-2">
            <label className="grid min-w-0 gap-1 text-[10px] uppercase tracking-wide text-faint">
              Nota técnica
              <input
                type="text"
                value={item.techniqueNote}
                onChange={(e) => update("techniqueNote", e.target.value)}
                placeholder="Opcional"
                className="h-9 w-full min-w-0 rounded-lg border border-hair bg-glass2 px-2 text-sm text-text outline-none placeholder:text-faint focus:border-teal2"
              />
            </label>
          </div>
        </div>
      </div>

      {showDetail ? (
        <ExerciseDetailSheet exercise={exercise} onClose={() => setShowDetail(false)} />
      ) : null}
    </div>
  );
}
