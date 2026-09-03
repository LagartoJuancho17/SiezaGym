"use client";

import Image from "next/image";
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  PATTERN_LABELS,
  REGISTRATION_TYPE_LABELS,
} from "@/lib/exercises/constants";
import MediaAttribution from "@/components/routines/MediaAttribution";

// Muscle → wger SVG (same map as ExercisePicker)
const MUSCLE_IMG = {
  pecho:               "/muscles/pecho.svg",
  dorsal:              "/muscles/dorsal.svg",
  espaldaAltaTrapecio: "/muscles/trapecio.svg",
  deltoideAnterior:    "/muscles/deltoid-anterior.svg",
  deltoideLateral:     "/muscles/deltoid-anterior.svg",
  deltoidePosterior:   "/muscles/deltoid-anterior.svg",
  biceps:              "/muscles/biceps.svg",
  triceps:             "/muscles/triceps.svg",
  antebrazo:           "/muscles/brachialis.svg",
  cuadriceps:          "/muscles/cuadriceps.svg",
  isquiotibiales:      "/muscles/isquiotibiales.svg",
  gluteo:              "/muscles/gluteo.svg",
  aductores:           "/muscles/oblicuos.svg",
  gemelo:              "/muscles/gemelo.svg",
  abdomen:             "/muscles/abdomen.svg",
  lumbar:              "/muscles/serratus.svg",
};

function Tag({ children }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
    >
      {children}
    </span>
  );
}

export default function ExerciseDetailSheet({ exercise, onClose }) {
  if (!exercise) return null;

  const muscleEntries = Object.entries(exercise.muscleWeights || {}).sort((a, b) => b[1] - a[1]);
  const primaryMuscle = muscleEntries[0]?.[0];

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-end sm:items-center sm:justify-center sm:p-6"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[20px] sm:max-w-2xl sm:rounded-[20px]"
        style={{ background: "#1c1c1e" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.28)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 pb-4 pt-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-base font-bold leading-snug"
              style={{ color: "#fff" }}
            >
              {exercise.nameEs}
            </h2>
            {exercise.nameEn && exercise.nameEn !== exercise.nameEs && (
              <p className="truncate text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                {exercise.nameEn}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5 sm:flex-row sm:gap-6">
          {/* Exercise image */}
          <div className="flex flex-col items-center gap-2 sm:w-64 sm:shrink-0">
            <div className="relative aspect-square w-40 overflow-hidden rounded-2xl sm:w-full" style={{ background: "#ffffff" }}>
              {exercise.mediaUrl ? (
                <Image
                  src={exercise.mediaUrl}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 256px, 160px"
                  className="p-3"
                  style={{ objectFit: "contain" }}
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="12" cy="8.5" r="3.2" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                </div>
              )}
            </div>
            {exercise.mediaUrl ? <MediaAttribution /> : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {exercise.equipment && <Tag>{EQUIPMENT_LABELS[exercise.equipment]}</Tag>}
              {exercise.pattern && <Tag>{PATTERN_LABELS[exercise.pattern]}</Tag>}
              {exercise.registrationType && <Tag>{REGISTRATION_TYPE_LABELS[exercise.registrationType]}</Tag>}
              {exercise.unilateral && <Tag>Unilateral</Tag>}
            </div>

            {/* Description */}
            {exercise.descriptionEs ? (
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {exercise.descriptionEs}
              </p>
            ) : null}

            {/* Muscle groups */}
            {muscleEntries.length ? (
            <section>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Grupos musculares
              </p>
              <div className="flex flex-col gap-2">
                {muscleEntries.map(([muscle, weight]) => {
                  const imgSrc = MUSCLE_IMG[muscle];
                  const pct = Math.round(weight * 100);
                  return (
                    <div key={muscle} className="flex items-center gap-3">
                      {/* Muscle icon */}
                      {imgSrc ? (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgSrc} alt={MUSCLE_GROUP_LABELS[muscle]} width={36} height={36} style={{ objectFit: "contain" }} />
                        </div>
                      ) : null}
                      {/* Label */}
                      <span className="flex-1 text-sm font-medium" style={{ color: "#fff" }}>
                        {MUSCLE_GROUP_LABELS[muscle]}
                      </span>
                      {/* Percentage bar */}
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 72,
                            height: 4,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.12)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              borderRadius: 2,
                              background: "#2e93a6",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-mono w-8 text-right"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
