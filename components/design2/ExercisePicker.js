"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { MUSCLE_REGIONS, filterExercises, primaryMuscleLabel } from "@/lib/exercises/browse";
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from "@/lib/exercises/constants";
import { CheckIcon, CloseIcon, SearchIcon, WeightIcon, ChevronDownIcon, InfoIcon, PlusIcon } from "./Icons";
import CustomExerciseForm from "@/components/routines/CustomExerciseForm";
import { chosenExercises } from "@/lib/routines/compose";

// ─────────────────────────────────────────────────────────────────────────────
// Equipment Vector Icons
// ─────────────────────────────────────────────────────────────────────────────
function BodyweightIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#2c2c2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="7" r="3.5" />
      <path d="M16 11v10M11 15l5-2 5 2M12 28l4-7 4 7" />
    </svg>
  );
}

function ResistanceBandIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
      <rect x="7" y="9" width="18" height="14" rx="7" stroke="#3b82f6" strokeWidth="3" />
      <rect x="10" y="11" width="12" height="10" rx="5" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

function SuspensionIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#2c2c2e" strokeWidth="2" strokeLinecap="round">
      <path d="M16 4v8M10 12l6-4 6 4M10 12v9a4 4 0 0 0 8 0v-9M14 28h8" />
    </svg>
  );
}

function BarbellIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
      <line x1="3" y1="16" x2="29" y2="16" stroke="#2c2c2e" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="6" y="9" width="4" height="14" rx="1.5" fill="#3a3a3c" />
      <rect x="22" y="9" width="4" height="14" rx="1.5" fill="#3a3a3c" />
      <rect x="4" y="12" width="2" height="8" rx="1" fill="#48484a" />
      <rect x="26" y="12" width="2" height="8" rx="1" fill="#48484a" />
    </svg>
  );
}

function PlateIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
      <circle cx="16" cy="16" r="12" fill="#2c2c2e" />
      <circle cx="16" cy="16" r="9" stroke="#48484a" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3.5" fill="#f2f3f4" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
      <rect x="11" y="14.5" width="10" height="3" rx="1.5" fill="#2c2c2e" />
      <rect x="7" y="10" width="4" height="12" rx="2" fill="#3a3a3c" />
      <rect x="21" y="10" width="4" height="12" rx="2" fill="#3a3a3c" />
      <rect x="4" y="12" width="3" height="8" rx="1.5" fill="#48484a" />
      <rect x="25" y="12" width="3" height="8" rx="1.5" fill="#48484a" />
    </svg>
  );
}

function MachineIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#2c2c2e" strokeWidth="2" strokeLinecap="round">
      <rect x="5" y="5" width="22" height="22" rx="3" strokeWidth="2" />
      <line x1="5" y1="13" x2="27" y2="13" />
      <circle cx="16" cy="20" r="3.5" />
    </svg>
  );
}

function KettlebellIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
      <circle cx="16" cy="20" r="9" fill="#2c2c2e" />
      <path d="M11 14V8a5 5 0 0 1 10 0v6" stroke="#2c2c2e" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function CableIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#2c2c2e" strokeWidth="2" strokeLinecap="round">
      <circle cx="16" cy="8" r="4.5" />
      <line x1="16" y1="12.5" x2="16" y2="28" strokeWidth="2.2" />
      <rect x="11" y="24" width="10" height="4" rx="2" fill="#3a3a3c" stroke="none" />
    </svg>
  );
}

function OtherEquipIcon() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
      <circle cx="9" cy="16" r="2.5" fill="#3a3a3c" />
      <circle cx="16" cy="16" r="2.5" fill="#3a3a3c" />
      <circle cx="23" cy="16" r="2.5" fill="#3a3a3c" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Equipment & Muscle filter configuration
// ─────────────────────────────────────────────────────────────────────────────
const EQUIPMENT_LIST = [
  { id: "peso_corporal", label: "Ninguno", IconComponent: BodyweightIcon },
  { id: "banda", label: "Banda de Resistencia", IconComponent: ResistanceBandIcon },
  { id: "suspension", label: "Banda de Suspensión", IconComponent: SuspensionIcon },
  { id: "barra", label: "Barra", IconComponent: BarbellIcon },
  { id: "disco", label: "Disco", IconComponent: PlateIcon },
  { id: "mancuerna", label: "Mancuerna", IconComponent: DumbbellIcon },
  { id: "maquina", label: "Máquina", IconComponent: MachineIcon },
  { id: "kettlebell", label: "Pesa Rusa", IconComponent: KettlebellIcon },
  { id: "polea", label: "Polea", IconComponent: CableIcon },
  { id: "otro", label: "Otro", IconComponent: OtherEquipIcon },
];

const UPPER_BODY_ITEMS = [
  { id: "abdomen", label: "Abdominales", img: "/muscles/abdomen.svg", keys: ["abdomen"] },
  { id: "antebrazo", label: "Antebrazos", img: "/muscles/brachialis.svg", keys: ["antebrazo"] },
  { id: "biceps", label: "Bíceps", img: "/muscles/biceps.svg", keys: ["biceps"] },
  { id: "cuello", label: "Cuello", img: "/muscles/deltoid-anterior.svg", keys: ["deltoideAnterior"] },
  { id: "dorsal", label: "Dorsales", img: "/muscles/dorsal.svg", keys: ["dorsal"] },
  { id: "lumbar", label: "Espalda Baja", img: "/muscles/serratus.svg", keys: ["lumbar"] },
  { id: "espaldaAltaTrapecio", label: "Espalda Superior", img: "/muscles/trapecio.svg", keys: ["espaldaAltaTrapecio"] },
  { id: "hombros", label: "Hombros", img: "/muscles/deltoid-anterior.svg", keys: ["deltoideAnterior", "deltoideLateral", "deltoidePosterior"] },
  { id: "pecho", label: "Pecho", img: "/muscles/pecho.svg", keys: ["pecho"] },
  { id: "trapecio", label: "Trapecio", img: "/muscles/trapecio.svg", keys: ["espaldaAltaTrapecio"] },
  { id: "triceps", label: "Tríceps", img: "/muscles/triceps.svg", keys: ["triceps"] },
];

const LOWER_BODY_ITEMS = [
  { id: "abductores", label: "Abductores", img: "/muscles/oblicuos.svg", keys: ["gluteo", "aductores"] },
  { id: "aductores", label: "Aductores", img: "/muscles/oblicuos.svg", keys: ["aductores"] },
  { id: "cuadriceps", label: "Cuádriceps", img: "/muscles/cuadriceps.svg", keys: ["cuadriceps"] },
  { id: "gemelo", label: "Gemelos", img: "/muscles/gemelo.svg", keys: ["gemelo"] },
  { id: "gluteo", label: "Glúteos", img: "/muscles/gluteo.svg", keys: ["gluteo"] },
  { id: "isquiotibiales", label: "Isquiotibiales", img: "/muscles/isquiotibiales.svg", keys: ["isquiotibiales"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Muscle Bottom Sheet (Grupo Muscular)
// ─────────────────────────────────────────────────────────────────────────────
function MuscleSheet({ selectedId, onSelect, onClose, exercises, query, selectedEquipmentId }) {
  const [draftId, setDraftId] = useState(selectedId);

  // Compute live match count for draft selection
  const matchCount = useMemo(() => {
    return (exercises || []).filter((ex) => {
      if (query && !filterExercises([ex], { query }).length) return false;
      if (selectedEquipmentId) {
        const eq = ex.equipment || "peso_corporal";
        if (selectedEquipmentId === "peso_corporal") {
          if (eq !== "peso_corporal" && eq !== "ninguno") return false;
        } else if (eq !== selectedEquipmentId) {
          return false;
        }
      }
      if (draftId) {
        const item = [...UPPER_BODY_ITEMS, ...LOWER_BODY_ITEMS].find((m) => m.id === draftId);
        if (item) {
          const weights = ex.muscleWeights || {};
          const works = item.keys.some((k) => (weights[k] || 0) > 0);
          if (!works) return false;
        }
      }
      return true;
    }).length;
  }, [exercises, query, selectedEquipmentId, draftId]);

  function handleApply() {
    onSelect(draftId);
    onClose();
  }

  function handleClear() {
    setDraftId(null);
    onSelect(null);
    onClose();
  }

  return (
    <div className="d2-sheet-backdrop" role="dialog" aria-modal="true" aria-label="Filtrar por Grupo Muscular">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="d2-bottom-sheet">
        <div className="d2-sheet-handle" />
        <h3 className="d2-sheet-header-title">Grupo Muscular</h3>

        <div className="d2-sheet-content">
          <p className="d2-sheet-section-title">Upper Body</p>
          <div className="d2-filter-grid">
            {UPPER_BODY_ITEMS.map((item) => {
              const active = draftId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDraftId(active ? null : item.id)}
                  className={active ? "d2-filter-card d2-filter-card-active" : "d2-filter-card"}
                >
                  <div className="d2-filter-card-icon">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.img} alt="" width={34} height={34} />
                  </div>
                  <span className="d2-filter-card-label">{item.label}</span>
                </button>
              );
            })}
          </div>

          <p className="d2-sheet-section-title">Lower Body</p>
          <div className="d2-filter-grid">
            {LOWER_BODY_ITEMS.map((item) => {
              const active = draftId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDraftId(active ? null : item.id)}
                  className={active ? "d2-filter-card d2-filter-card-active" : "d2-filter-card"}
                >
                  <div className="d2-filter-card-icon">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.img} alt="" width={34} height={34} />
                  </div>
                  <span className="d2-filter-card-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="d2-sheet-footer">
          <button type="button" onClick={handleClear} className="d2-sheet-btn-clear">
            Eliminar filtros
          </button>
          <button type="button" onClick={handleApply} className="d2-sheet-btn-apply">
            Mostrar {matchCount} {matchCount === 1 ? "resultado" : "resultados"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Equipment Bottom Sheet (Equipamiento)
// ─────────────────────────────────────────────────────────────────────────────
function EquipmentSheet({ selectedId, onSelect, onClose, exercises, query, selectedMuscleId }) {
  const [draftId, setDraftId] = useState(selectedId);

  const matchCount = useMemo(() => {
    return (exercises || []).filter((ex) => {
      if (query && !filterExercises([ex], { query }).length) return false;
      if (selectedMuscleId) {
        const item = [...UPPER_BODY_ITEMS, ...LOWER_BODY_ITEMS].find((m) => m.id === selectedMuscleId);
        if (item) {
          const weights = ex.muscleWeights || {};
          const works = item.keys.some((k) => (weights[k] || 0) > 0);
          if (!works) return false;
        }
      }
      if (draftId) {
        const eq = ex.equipment || "peso_corporal";
        if (draftId === "peso_corporal") {
          if (eq !== "peso_corporal" && eq !== "ninguno") return false;
        } else if (eq !== draftId) {
          return false;
        }
      }
      return true;
    }).length;
  }, [exercises, query, selectedMuscleId, draftId]);

  function handleApply() {
    onSelect(draftId);
    onClose();
  }

  function handleClear() {
    setDraftId(null);
    onSelect(null);
    onClose();
  }

  return (
    <div className="d2-sheet-backdrop" role="dialog" aria-modal="true" aria-label="Filtrar por Equipamiento">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="d2-bottom-sheet">
        <div className="d2-sheet-handle" />
        <h3 className="d2-sheet-header-title">Equipamiento</h3>

        <div className="d2-sheet-content">
          <div className="d2-filter-grid" style={{ marginTop: "calc(8 * var(--d2-u))" }}>
            {EQUIPMENT_LIST.map((item) => {
              const active = draftId === item.id;
              const Icon = item.IconComponent;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDraftId(active ? null : item.id)}
                  className={active ? "d2-filter-card d2-filter-card-active" : "d2-filter-card"}
                >
                  <div className="d2-filter-card-icon">
                    <Icon />
                  </div>
                  <span className="d2-filter-card-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="d2-sheet-footer">
          <button type="button" onClick={handleClear} className="d2-sheet-btn-clear">
            Eliminar filtros
          </button>
          <button type="button" onClick={handleApply} className="d2-sheet-btn-apply">
            Mostrar {matchCount} {matchCount === 1 ? "resultado" : "resultados"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise Detail Modal (Info sheet)
// ─────────────────────────────────────────────────────────────────────────────
function DetailModal({ exercise, onClose }) {
  if (!exercise) return null;
  const entries = Object.entries(exercise.muscleWeights || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="d2-sheet-backdrop" role="dialog" aria-modal="true" aria-label="Detalle de ejercicio">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="d2-bottom-sheet" style={{ maxHeight: "88vh" }}>
        <div className="d2-sheet-handle" />
        <div className="flex items-center justify-between px-4 pb-2 pt-1" style={{ borderBottom: "1px solid var(--d2-border)" }}>
          <h3 className="text-base font-semibold text-center flex-1">{exercise.nameEs}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="d2-ex-info-btn">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="d2-sheet-content" style={{ paddingTop: "calc(14 * var(--d2-u))" }}>
          {exercise.mediaUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl mb-4" style={{ background: "#f2f3f4" }}>
              <Image src={exercise.mediaUrl} alt="" fill sizes="400px" style={{ objectFit: "contain" }} unoptimized />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {exercise.equipment && (
              <span className="d2-region">{EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}</span>
            )}
            {exercise.registrationType && (
              <span className="d2-region">{exercise.registrationType}</span>
            )}
          </div>

          {entries.length > 0 && (
            <div className="mb-4">
              <p className="d2-picker-section-title">Músculos que trabaja</p>
              <div className="d2-panel d2-muscles">
                {entries.map(([m, w]) => (
                  <div key={m} className="d2-muscle-row">
                    <p className="d2-muscle-head">
                      <span>{MUSCLE_GROUP_LABELS[m] || m}</span>
                      <span>{Math.round(w * 100)}%</span>
                    </p>
                    <span className="d2-muscle-bar">
                      <span style={{ width: `${Math.round(w * 100)}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ExercisePicker Component (Hevy UX + SiezaGym Theme UI)
// ─────────────────────────────────────────────────────────────────────────────
export default function ExercisePicker({
  exercises = [],
  alreadyAdded = new Set(),
  onCancel,
  onClose,
  onConfirm,
  onCreated,
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(null);
  const [selectedMuscleId, setSelectedMuscleId] = useState(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [chosen, setChosen] = useState(() => new Set());
  const [creating, setCreating] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null); // null | "muscle" | "equipment"
  const [detailExercise, setDetailExercise] = useState(null);

  const closePicker = onCancel || onClose;

  // Combined filtering: Text / browse regions + Equipment + Specific Muscle
  const results = useMemo(() => {
    // 1. Base filter via browse helper
    let list = filterExercises(exercises, { query, region });

    // 2. Equipment filter
    if (selectedEquipmentId) {
      list = list.filter((ex) => {
        const eq = ex.equipment || "peso_corporal";
        if (selectedEquipmentId === "peso_corporal") {
          return eq === "peso_corporal" || eq === "ninguno" || !ex.equipment;
        }
        if (selectedEquipmentId === "otro") {
          return !["barra", "mancuerna", "polea", "maquina", "peso_corporal", "kettlebell", "banda"].includes(eq);
        }
        return eq === selectedEquipmentId;
      });
    }

    // 3. Muscle filter
    if (selectedMuscleId) {
      const item = [...UPPER_BODY_ITEMS, ...LOWER_BODY_ITEMS].find((m) => m.id === selectedMuscleId);
      if (item) {
        list = list.filter((ex) => {
          const weights = ex.muscleWeights || {};
          return item.keys.some((k) => (weights[k] || 0) > 0);
        });
      }
    }

    return list;
  }, [exercises, query, region, selectedEquipmentId, selectedMuscleId]);

  function toggle(id) {
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Active labels for filter pills
  const activeEquipmentItem = EQUIPMENT_LIST.find((eq) => eq.id === selectedEquipmentId);
  const activeMuscleItem = [...UPPER_BODY_ITEMS, ...LOWER_BODY_ITEMS].find((m) => m.id === selectedMuscleId);

  const isFiltering = Boolean(query || selectedEquipmentId || selectedMuscleId || region);

  return (
    <div className="d2-sheet d2-backdrop" role="dialog" aria-modal="true" aria-label="Agregar Ejercicio">
      <div className="d2-sheet-inner">
        {/* ── Header: [Cancelar] "Agregar Ejercicio" [Crear] ── */}
        <div className="d2-sheet-head">
          <button type="button" onClick={closePicker} className="d2-picker-action-btn">
            Cancelar
          </button>
          <h2 className="d2-sheet-title">Agregar Ejercicio</h2>
          <button
            type="button"
            onClick={() => setCreating((prev) => !prev)}
            className="d2-picker-action-btn d2-picker-action-create"
          >
            Crear
          </button>
        </div>

        {creating ? (
          <div className="d2-picks" style={{ marginTop: "calc(14 * var(--d2-u))" }}>
            <CustomExerciseForm
              onCancel={() => setCreating(false)}
              onCreated={(exercise) => {
                if (onCreated) onCreated(exercise);
                setChosen((current) => new Set([...current, exercise.id]));
                setCreating(false);
                setQuery("");
                setRegion(null);
              }}
            />
          </div>
        ) : (
          <>
            {/* ── Search bar + Crear ejercicio propio al lado ── */}
            <div className="d2-picker-search-row">
              <div className="d2-glass d2-search d2-picker-search-bar">
                <SearchIcon size={20} width={1.5} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar ejercicio"
                  aria-label="Buscar ejercicio"
                  className="d2-search-input"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="d2-ex-remove"
                  >
                    <CloseIcon size={16} />
                  </button>
                )}
              </div>

              {onCreated && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="d2-create-own-btn"
                  aria-expanded={creating}
                >
                  <PlusIcon size={16} width={2} />
                  <span>Crear ejercicio propio</span>
                </button>
              )}
            </div>

            {/* ── Filter Pills: [Todo el Equipamiento ▾] [Todos los Músculos ▾] ── */}
            <div className="d2-picker-filters">
              <button
                type="button"
                id="filter-equipment-pill"
                onClick={() => setActiveSheet("equipment")}
                className={selectedEquipmentId ? "d2-filter-pill d2-filter-pill-active" : "d2-filter-pill"}
              >
                <span>{activeEquipmentItem ? activeEquipmentItem.label : "Todo el Equipamiento"}</span>
                <ChevronDownIcon size={14} width={2} />
              </button>

              <button
                type="button"
                id="filter-muscle-pill"
                onClick={() => setActiveSheet("muscle")}
                className={selectedMuscleId ? "d2-filter-pill d2-filter-pill-active" : "d2-filter-pill"}
              >
                <span>{activeMuscleItem ? activeMuscleItem.label : "Todos los Músculos"}</span>
                <ChevronDownIcon size={14} width={2} />
              </button>
            </div>

            {/* ── Section Title: "Ejercicios populares" o "Resultados" ── */}
            <p className="d2-picker-section-title">
              {isFiltering ? `Resultados (${results.length})` : "Ejercicios populares"}
            </p>

            {/* ── Exercise list ── */}
            <div className="d2-picks">
              {results.length === 0 ? (
                <p className="d2-glass d2-empty">Ningún ejercicio coincide con los filtros.</p>
              ) : (
                <div className="d2-panel">
                  {results.map((exercise) => {
                    const added = alreadyAdded.has(exercise.id);
                    const on = chosen.has(exercise.id);
                    return (
                      <div
                        key={exercise.id}
                        className={on ? "d2-pick d2-pick-on" : "d2-pick"}
                      >
                        <button
                          type="button"
                          onClick={() => !added && toggle(exercise.id)}
                          disabled={added}
                          aria-pressed={on}
                          className="d2-pick-btn"
                        >
                          <span className="d2-ex-thumb">
                            {exercise.mediaUrl ? (
                              <Image src={exercise.mediaUrl} alt="" width={54} height={54} unoptimized />
                            ) : (
                              <WeightIcon size={22} width={1.5} />
                            )}
                          </span>
                          <span className="d2-ex-body">
                            <span className="d2-ex-name">{exercise.nameEs}</span>
                            <span className="d2-ex-muscle">
                              {[primaryMuscleLabel(exercise), added ? "ya está en la rutina" : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          <span className="d2-pick-check">{on && <CheckIcon size={13} width={2.2} />}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDetailExercise(exercise)}
                          aria-label={`Detalle de ${exercise.nameEs}`}
                          className="d2-ex-info-btn"
                        >
                          <InfoIcon size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="d2-credit">
                Animaciones ©{" "}
                <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">
                  Gym visual
                </a>
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Sticky Bottom Confirm Button ── */}
      {!creating && (
        <div className="d2-sheet-foot">
          <button
            type="button"
            disabled={chosen.size === 0}
            onClick={() => onConfirm(chosenExercises(exercises, chosen))}
            className="d2-sheet-confirm"
          >
            {chosen.size === 0
              ? "Elegí al menos uno"
              : `Agregar ${chosen.size} ${chosen.size === 1 ? "ejercicio" : "ejercicios"}`}
          </button>
        </div>
      )}

      {/* ── Grupo Muscular Modal Sheet ── */}
      {activeSheet === "muscle" && (
        <MuscleSheet
          selectedId={selectedMuscleId}
          onSelect={setSelectedMuscleId}
          onClose={() => setActiveSheet(null)}
          exercises={exercises}
          query={query}
          selectedEquipmentId={selectedEquipmentId}
        />
      )}

      {/* ── Equipamiento Modal Sheet ── */}
      {activeSheet === "equipment" && (
        <EquipmentSheet
          selectedId={selectedEquipmentId}
          onSelect={setSelectedEquipmentId}
          onClose={() => setActiveSheet(null)}
          exercises={exercises}
          query={query}
          selectedMuscleId={selectedMuscleId}
        />
      )}

      {/* ── Exercise Detail Modal ── */}
      {detailExercise && (
        <DetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} />
      )}
    </div>
  );
}

