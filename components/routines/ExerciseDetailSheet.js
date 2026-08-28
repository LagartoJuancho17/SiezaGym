"use client";

import Image from "next/image";
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  PATTERN_LABELS,
  REGISTRATION_TYPE_LABELS,
} from "@/lib/exercises/constants";
import ExerciseMuscleMap from "@/components/routines/ExerciseMuscleMap";
import MediaAttribution from "@/components/routines/MediaAttribution";

export default function ExerciseDetailSheet({ exercise, onClose }) {
  if (!exercise) return null;

  const muscleEntries = Object.entries(exercise.muscleWeights || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] border border-hair bg-deep sm:rounded-[28px]">
        <div className="flex items-center justify-between gap-3 border-b border-hair px-5 py-4">
          <h2 className="font-display min-w-0 truncate text-lg uppercase tracking-[0.01em] text-text">
            {exercise.nameEs}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint transition hover:text-text"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="flex justify-center">
            {exercise.mediaUrl ? (
              <Image
                src={exercise.mediaUrl}
                alt=""
                width={160}
                height={160}
                className="h-40 w-40 rounded-2xl object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-40 w-40 items-center justify-center rounded-2xl bg-glass2 text-faint">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <circle cx="12" cy="8.5" r="3.2" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
              </span>
            )}
          </div>
          {exercise.mediaUrl ? <MediaAttribution /> : null}

          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-hair px-3 py-1 text-xs text-muted">
              {EQUIPMENT_LABELS[exercise.equipment]}
            </span>
            {exercise.pattern ? (
              <span className="rounded-full border border-hair px-3 py-1 text-xs text-muted">
                {PATTERN_LABELS[exercise.pattern]}
              </span>
            ) : null}
            <span className="rounded-full border border-hair px-3 py-1 text-xs text-muted">
              {REGISTRATION_TYPE_LABELS[exercise.registrationType]}
            </span>
            {exercise.unilateral ? (
              <span className="rounded-full border border-hair px-3 py-1 text-xs text-muted">
                Unilateral
              </span>
            ) : null}
          </div>

          {exercise.descriptionEs ? (
            <p className="text-sm leading-relaxed text-muted">{exercise.descriptionEs}</p>
          ) : null}

          {muscleEntries.length ? (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-teal2">
                Grupos musculares
              </p>
              <ExerciseMuscleMap muscleWeights={exercise.muscleWeights} />
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {muscleEntries.map(([muscle, weight]) => (
                  <span key={muscle} className="text-xs text-faint">
                    {MUSCLE_GROUP_LABELS[muscle]}{" "}
                    <span className="font-mono-digit text-teal2">{Math.round(weight * 100)}%</span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
