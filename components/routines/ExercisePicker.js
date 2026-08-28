"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT,
  EQUIPMENT_LABELS,
} from "@/lib/exercises/constants";
import { filterExercises, primaryMuscle } from "@/lib/exercises/filters";
import CustomExerciseForm from "@/components/routines/CustomExerciseForm";
import MediaAttribution from "@/components/routines/MediaAttribution";
import ExerciseDetailSheet from "@/components/routines/ExerciseDetailSheet";

export default function ExercisePicker({ exercises, customExercises, onConfirm, onClose }) {
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [localCustom, setLocalCustom] = useState(customExercises);

  const allExercises = useMemo(
    () => [...localCustom, ...exercises],
    [localCustom, exercises],
  );

  const filtered = useMemo(
    () => filterExercises(allExercises, { query, muscleGroup, equipment }),
    [allExercises, query, muscleGroup, equipment],
  );

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const chosen = allExercises.filter((e) => selectedIds.has(e.id));
    onConfirm(chosen);
  }

  function handleCustomCreated(exercise) {
    setLocalCustom((prev) => [exercise, ...prev]);
    setSelectedIds((prev) => new Set(prev).add(exercise.id));
    setShowCustomForm(false);
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-hair bg-deep sm:rounded-[28px]">
        <div className="flex items-center justify-between gap-3 border-b border-hair px-5 py-4">
          <h2 className="font-display text-lg uppercase tracking-[0.01em] text-text">
            {showCustomForm ? "Nuevo ejercicio" : "Agregar ejercicios"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-faint transition hover:text-text"
          >
            ✕
          </button>
        </div>

        {showCustomForm ? (
          <div className="overflow-y-auto px-5 py-4">
            <CustomExerciseForm
              onCreated={handleCustomCreated}
              onCancel={() => setShowCustomForm(false)}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 px-5 py-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ejercicio..."
                className="h-11 rounded-full border border-hair bg-glass2 px-4 text-sm text-text outline-none placeholder:text-faint focus:border-teal2"
              />
              <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="h-8 shrink-0 rounded-full border border-hair bg-glass2 px-3 text-xs text-muted outline-none"
                >
                  <option value="">Cualquier equipo</option>
                  {EQUIPMENT.map((eq) => (
                    <option key={eq} value={eq}>
                      {EQUIPMENT_LABELS[eq]}
                    </option>
                  ))}
                </select>
                <select
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                  className="h-8 shrink-0 rounded-full border border-hair bg-glass2 px-3 text-xs text-muted outline-none"
                >
                  <option value="">Cualquier músculo</option>
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m}>
                      {MUSCLE_GROUP_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-faint">
                  No encontramos nada con esos filtros.
                </p>
              ) : (
                <ul className="flex flex-col gap-1 pb-3">
                  {filtered.map((exercise) => {
                    const checked = selectedIds.has(exercise.id);
                    const muscle = primaryMuscle(exercise.muscleWeights);
                    return (
                      <li key={exercise.id}>
                        <div
                          className={`flex items-center gap-1 rounded-2xl border transition ${
                            checked ? "border-teal2 bg-glass2" : "border-transparent hover:bg-glass"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(exercise.id)}
                            className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3 text-left"
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                checked ? "border-teal2 bg-teal2 text-onlight" : "border-hair"
                              }`}
                            >
                              {checked ? "✓" : ""}
                            </span>
                            {exercise.mediaUrl ? (
                              <Image
                                src={exercise.mediaUrl}
                                alt=""
                                width={40}
                                height={40}
                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-glass2 text-faint">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                  <circle cx="12" cy="8.5" r="3.2" />
                                  <path d="M5 20a7 7 0 0 1 14 0" />
                                </svg>
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-text">
                                {exercise.nameEs}
                                {exercise.source === "custom" ? (
                                  <span className="ml-1.5 rounded-full bg-glass2 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-teal2">
                                    Tuyo
                                  </span>
                                ) : null}
                              </span>
                              <span className="block text-xs text-faint">
                                {EQUIPMENT_LABELS[exercise.equipment]}
                                {muscle ? ` · ${MUSCLE_GROUP_LABELS[muscle]}` : ""}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailExercise(exercise)}
                            aria-label={`Ver detalle de ${exercise.nameEs}`}
                            className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-faint transition hover:text-teal2"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                              <circle cx="12" cy="12" r="9" />
                              <line x1="12" y1="10.5" x2="12" y2="16" />
                              <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-hair py-3 text-sm font-medium text-muted transition hover:border-teal2 hover:text-text"
              >
                + No lo encontrás? Creá tu ejercicio
              </button>
            </div>

            <div className="flex flex-col gap-2 border-t border-hair px-5 py-4">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                className="h-12 w-full rounded-full bg-white text-sm font-semibold text-onlight transition hover:opacity-90 disabled:opacity-40"
              >
                Agregar {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </button>
              <MediaAttribution />
            </div>
          </>
        )}
      </div>

      {detailExercise ? (
        <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} />
      ) : null}
    </div>
  );
}
