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
import ExerciseDetailSheet from "@/components/routines/ExerciseDetailSheet";

// ─────────────────────────────────────────────────────────────────────────────
// Muscle → wger SVG path mapping (files in /public/muscles/)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Equipment SVGs
// ─────────────────────────────────────────────────────────────────────────────
const EQUIPMENT_SVG = {
  barra: (
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
      <rect x="1" y="17" width="38" height="6" rx="3" fill="#374151" />
      <rect x="1" y="10" width="7" height="20" rx="3" fill="#374151" />
      <rect x="32" y="10" width="7" height="20" rx="3" fill="#374151" />
      <rect x="8" y="13" width="4" height="14" rx="2" fill="#6b7280" />
      <rect x="28" y="13" width="4" height="14" rx="2" fill="#6b7280" />
    </svg>
  ),
  mancuerna: (
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
      <rect x="14" y="17" width="12" height="6" rx="3" fill="#374151" />
      <rect x="1" y="11" width="9" height="18" rx="4" fill="#374151" />
      <rect x="30" y="11" width="9" height="18" rx="4" fill="#374151" />
    </svg>
  ),
  maquina: (
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
      <rect x="4" y="4" width="32" height="32" rx="5" fill="#374151" />
      <rect x="9" y="10" width="22" height="20" rx="3" fill="#4b5563" />
      <circle cx="20" cy="20" r="5" fill="#374151" />
      <circle cx="20" cy="20" r="2" fill="#9ca3af" />
    </svg>
  ),
  polea: (
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
      <circle cx="20" cy="10" r="7" fill="#374151" />
      <circle cx="20" cy="10" r="3.5" fill="#6b7280" />
      <line x1="20" y1="17" x2="20" y2="36" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="14" y="33" width="12" height="5" rx="2.5" fill="#374151" />
    </svg>
  ),
  peso_corporal: (
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
      <circle cx="20" cy="5.5" r="4" fill="#374151" />
      <path d="M20 10 L16 24 L12 37" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 10 L24 24 L28 37" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="14.5" y1="18" x2="25.5" y2="18" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  banda: (
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
      <ellipse cx="20" cy="20" rx="14" ry="10" fill="none" stroke="#ef4444" strokeWidth="5" />
      <ellipse cx="20" cy="20" rx="14" ry="10" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8 4" />
    </svg>
  ),
  kettlebell: (
    <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
      <circle cx="20" cy="25" r="12" fill="#374151" />
      <path d="M13.5 16 Q20 4 26.5 16" stroke="#374151" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M15 17 Q20 7 25 17" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ),
};

function AllEquipSvg() {
  return (
    <svg viewBox="0 0 40 40" width="28" height="28" fill="none">
      <circle cx="20" cy="20" r="14" fill="#374151" />
      <text x="20" y="25" textAnchor="middle" fill="#9ca3af" fontSize="13" fontWeight="bold">···</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise image circle
// ─────────────────────────────────────────────────────────────────────────────
function ExerciseCircle({ src, name }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#ffffff",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name || ""}
          width={56}
          height={56}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise list item — mobile row (compact, unchanged from original design)
// ─────────────────────────────────────────────────────────────────────────────
function ExerciseRow({ exercise, subtitle, checked, onToggle, onInfo }) {
  return (
    <li style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="relative flex items-center">
        {checked && (
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: 3, background: "#2e93a6", borderRadius: "0 3px 3px 0" }}
          />
        )}
        <button
          type="button"
          onClick={() => onToggle(exercise.id)}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
        >
          <ExerciseCircle src={exercise.mediaUrl} name={exercise.nameEs} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="block truncate text-sm font-semibold leading-snug" style={{ color: "#fff" }}>
                {exercise.nameEs}
              </span>
              {exercise.source === "custom" && (
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
                  style={{ background: "rgba(10,132,255,0.2)", color: "#2e93a6" }}
                >
                  Tuyo
                </span>
              )}
            </div>
            {subtitle ? (
              <span className="mt-0.5 block truncate text-xs" style={{ color: "rgba(255,255,255,0.48)" }}>
                {subtitle}
              </span>
            ) : null}
          </div>
        </button>
        <button
          type="button"
          onClick={() => onInfo(exercise)}
          aria-label={`Ver detalle de ${exercise.nameEs}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="12" cy="12" r="9.5" />
            <line x1="12" y1="10.5" x2="12" y2="16.5" strokeWidth="1.6" />
            <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise list item — sm+ card (2-column grid, imagen grande)
// ─────────────────────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, subtitle, checked, onToggle, onInfo }) {
  return (
    <li
      className="relative overflow-hidden rounded-2xl transition"
      style={{
        background: "#1c1c1e",
        boxShadow: checked ? "0 0 0 2px #2e93a6" : "0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      <button type="button" onClick={() => onToggle(exercise.id)} className="flex w-full flex-col text-left">
        <div className="relative aspect-video w-full" style={{ background: "#ffffff" }}>
          {exercise.mediaUrl ? (
            <Image
              src={exercise.mediaUrl}
              alt={exercise.nameEs || ""}
              fill
              sizes="(min-width: 640px) 22vw, 100vw"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </div>
          )}
          {checked && (
            <div
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: "#2e93a6" }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="block truncate text-sm font-semibold leading-snug" style={{ color: "#fff" }}>
              {exercise.nameEs}
            </span>
            {exercise.source === "custom" && (
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
                style={{ background: "rgba(10,132,255,0.2)", color: "#2e93a6" }}
              >
                Tuyo
              </span>
            )}
          </div>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs" style={{ color: "rgba(255,255,255,0.48)" }}>
              {subtitle}
            </span>
          ) : null}
        </div>
      </button>
      <button
        type="button"
        onClick={() => onInfo(exercise)}
        aria-label={`Ver detalle de ${exercise.nameEs}`}
        className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="12" r="9.5" />
          <line x1="12" y1="10.5" x2="12" y2="16.5" strokeWidth="1.8" />
          <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic filter bottom-sheet
// ─────────────────────────────────────────────────────────────────────────────
function FilterSheet({ title, options, value, onChange, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative z-10 flex flex-col overflow-hidden"
        style={{
          background: "#1c1c1e",
          borderRadius: "20px 20px 0 0",
          maxHeight: "85vh",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.3)" }} />
        </div>
        {/* Sheet title */}
        <div className="px-5 pb-3 pt-2 text-center">
          <h3 style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{title}</h3>
        </div>
        {/* Options */}
        <ul className="flex-1 overflow-y-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {options.map((opt) => {
            const isSelected = opt.value === value || (opt.value === "" && !value);
            return (
              <li key={opt.value} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); onClose(); }}
                  className="flex w-full items-center gap-4 px-5"
                  style={{ paddingTop: 12, paddingBottom: 12 }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {opt.img ? (
                      /* wger anatomical SVG from /public */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.img}
                        alt={opt.label}
                        width={48}
                        height={48}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      opt.svg
                    )}
                  </div>
                  <span style={{ flex: 1, textAlign: "left", color: "#fff", fontWeight: 500, fontSize: 15 }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                      <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="1.5" />
                      <path d="M7.5 12l3 3.5 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ExercisePicker({ exercises, customExercises, onConfirm, onClose }) {
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [localCustom, setLocalCustom] = useState(customExercises);
  const [filterSheet, setFilterSheet] = useState(null); // null | "muscle" | "equipment"

  const allExercises = useMemo(() => [...localCustom, ...exercises], [localCustom, exercises]);
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

  // ── Filter option lists ────────────────────────────────────────────────────
  const muscleOptions = [
    {
      value: "",
      label: "Todos los Músculos",
      img: "/muscles/cuadriceps.svg", // full-body view — best wger option for "all"
    },
    ...MUSCLE_GROUPS.map((m) => ({
      value: m,
      label: MUSCLE_GROUP_LABELS[m],
      img: MUSCLE_IMG[m],
    })),
  ];

  const equipmentOptions = [
    { value: "", label: "Todo el Equipamiento", svg: <AllEquipSvg /> },
    ...EQUIPMENT.map((eq) => ({
      value: eq,
      label: EQUIPMENT_LABELS[eq],
      svg: EQUIPMENT_SVG[eq] ?? (
        <span style={{ color: "#374151", fontWeight: 700, fontSize: 14 }}>{EQUIPMENT_LABELS[eq][0]}</span>
      ),
    })),
  ];

  const isFiltering = query || muscleGroup || equipment;

  const filteredWithMeta = filtered.map((exercise) => {
    const muscle = primaryMuscle(exercise.muscleWeights);
    const muscleLabel = muscle ? MUSCLE_GROUP_LABELS[muscle] : "";
    const equipLabel = EQUIPMENT_LABELS[exercise.equipment] || "";
    const subtitle = [muscleLabel, equipLabel].filter(Boolean).join(", ");
    return { exercise, subtitle, checked: selectedIds.has(exercise.id) };
  });

  return (
    <>
      {/* ── Full-screen panel ───────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-20 flex flex-col"
        style={{ background: "#111114" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Volver"
            className="flex h-9 w-9 shrink-0 items-center justify-center"
            style={{ color: "#fff" }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2
            className="flex-1 text-center text-base font-semibold"
            style={{ color: "#fff" }}
          >
            {showCustomForm ? "Nuevo ejercicio" : "Añadir Ejercicio"}
          </h2>
          <button
            type="button"
            onClick={() => setShowCustomForm(true)}
            className="shrink-0 text-sm font-semibold"
            style={{ color: "#2e93a6", minWidth: 40 }}
          >
            Crear
          </button>
        </div>

        {showCustomForm ? (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <CustomExerciseForm
              onCreated={handleCustomCreated}
              onCancel={() => setShowCustomForm(false)}
            />
          </div>
        ) : (
          <>
            {/* ── Search + filter tabs ─────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5 px-4 py-3">
              {/* Search bar */}
              <div
                className="flex items-center gap-2 px-3.5"
                style={{ height: 44, borderRadius: 12, background: "#2c2c2e" }}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar ejercicio"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#fff" }}
                  aria-label="Buscar ejercicio"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="flex items-center justify-center"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    aria-label="Limpiar búsqueda"
                  >
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter tab buttons */}
              <div className="flex gap-2">
                {/* Músculos: tap active → clear; tap inactive → open sheet */}
                <button
                  id="filter-muscle-btn"
                  type="button"
                  onClick={() => muscleGroup ? setMuscleGroup("") : setFilterSheet("muscle")}
                  className="flex flex-1 items-center justify-center gap-1.5 text-sm font-medium transition-all"
                  style={{
                    height: 38,
                    borderRadius: 12,
                    background: muscleGroup ? "#3a3a3c" : "#2c2c2e",
                    color: muscleGroup ? "#fff" : "rgba(255,255,255,0.65)",
                    border: muscleGroup ? "1.5px solid rgba(255,255,255,0.22)" : "1.5px solid transparent",
                  }}
                >
                  <span className="truncate max-w-[120px]">
                    {muscleGroup ? MUSCLE_GROUP_LABELS[muscleGroup] : "Músculos"}
                  </span>
                  {muscleGroup && (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </button>
                {/* Equipamiento: tap active → clear; tap inactive → open sheet */}
                <button
                  id="filter-equipment-btn"
                  type="button"
                  onClick={() => equipment ? setEquipment("") : setFilterSheet("equipment")}
                  className="flex flex-1 items-center justify-center gap-1.5 text-sm font-medium transition-all"
                  style={{
                    height: 38,
                    borderRadius: 12,
                    background: equipment ? "#3a3a3c" : "#2c2c2e",
                    color: equipment ? "#fff" : "rgba(255,255,255,0.65)",
                    border: equipment ? "1.5px solid rgba(255,255,255,0.22)" : "1.5px solid transparent",
                  }}
                >
                  <span className="truncate max-w-[120px]">
                    {equipment ? EQUIPMENT_LABELS[equipment] : "Equipamiento"}
                  </span>
                  {equipment && (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ── Exercise list ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                  No encontramos ejercicios con esos filtros.
                </p>
              ) : (
                <>
                  {/* Section heading */}
                  <div className="px-5 pb-1 pt-3">
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {isFiltering ? "Resultados" : "Recientes"}
                    </span>
                  </div>

                  {/* Mobile: fila compacta (diseño original, sin cambios) */}
                  <ul className="sm:hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    {filteredWithMeta.map(({ exercise, subtitle, checked }) => (
                      <ExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        subtitle={subtitle}
                        checked={checked}
                        onToggle={toggle}
                        onInfo={setDetailExercise}
                      />
                    ))}
                  </ul>

                  {/* sm+: grid de 2 columnas, imagen grande */}
                  <ul className="hidden gap-3 px-4 pb-2 pt-1 sm:grid sm:grid-cols-2">
                    {filteredWithMeta.map(({ exercise, subtitle, checked }) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        subtitle={subtitle}
                        checked={checked}
                        onToggle={toggle}
                        onInfo={setDetailExercise}
                      />
                    ))}
                  </ul>

                  {/* Create custom exercise */}
                  <button
                    type="button"
                    id="create-custom-exercise-btn"
                    onClick={() => setShowCustomForm(true)}
                    className="mx-4 my-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium transition-opacity active:opacity-70"
                    style={{ background: "#2c2c2e", color: "rgba(255,255,255,0.55)" }}
                  >
                    + ¿No lo encontrás? Creá tu ejercicio
                  </button>
                </>
              )}
            </div>

            {/* ── Bottom confirm bar ───────────────────────────────────────── */}
            <div
              className="px-4 pb-6 pt-3 transition-all"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                background: "#111114",
                opacity: selectedIds.size > 0 ? 1 : 0,
                pointerEvents: selectedIds.size > 0 ? "auto" : "none",
                transform: selectedIds.size > 0 ? "translateY(0)" : "translateY(8px)",
                transitionProperty: "opacity, transform",
                transitionDuration: "180ms",
              }}
            >
              <button
                type="button"
                id="confirm-exercises-btn"
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                className="h-14 w-full rounded-2xl text-sm font-bold text-black transition active:opacity-80"
                style={{ background: "#ffffff" }}
              >
                Agregar {selectedIds.size} ejercicio{selectedIds.size !== 1 ? "s" : ""}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Muscle filter sheet ─────────────────────────────────────────────── */}
      {filterSheet === "muscle" && (
        <FilterSheet
          title="Grupo Muscular"
          options={muscleOptions}
          value={muscleGroup}
          onChange={setMuscleGroup}
          onClose={() => setFilterSheet(null)}
        />
      )}

      {/* ── Equipment filter sheet ──────────────────────────────────────────── */}
      {filterSheet === "equipment" && (
        <FilterSheet
          title="Equipamiento"
          options={equipmentOptions}
          value={equipment}
          onChange={setEquipment}
          onClose={() => setFilterSheet(null)}
        />
      )}

      {/* ── Exercise detail sheet ───────────────────────────────────────────── */}
      {detailExercise ? (
        <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} />
      ) : null}
    </>
  );
}
