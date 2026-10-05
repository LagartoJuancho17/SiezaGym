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
import {
  DEFAULT_GROUP_COLOR,
  GROUP_COLORS,
  PRESET_GROUPS,
  groupColorHex,
  groupTone,
  isCustomColor,
} from "@/lib/routines/groupColors";

/** Los atajos de la barra de arriba: los tuyos primero, después los fijos. */
function quickGroups(savedGroups) {
  const seen = new Set();
  return [...savedGroups, ...PRESET_GROUPS.filter((preset) => ["Calentamiento", "Fuerza", "Movilidad"].includes(preset.name))]
    .filter((group) => {
      const key = group.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

/** Pastilla o botón pintado con el color del grupo, sea de la paleta o libre. */
function tonedProps(color, extraClass = "") {
  const tone = groupTone(color);
  return { className: `${extraClass} ${tone.className}`.trim(), style: tone.style };
}

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
    group: "",
    groupColor: "",
  };
}

/**
 * Armar una rutina, nueva o existente.
 *
 * Con `routine` entra en modo edición: arranca con lo que ya estaba cargado y
 * guarda sobre la misma rutina. Es la misma pantalla a propósito, porque editar
 * es agregar, sacar y volver a prescribir, exactamente lo mismo que crear.
 */
export default function RoutineComposer({ exercises, routine = null, savedGroups = [] }) {
  const router = useRouter();
  const editing = !!routine;
  const [name, setName] = useState(routine?.name || "");
  const [note, setNote] = useState(routine?.note || "");
  const [createdExercises, setCreatedExercises] = useState([]);
  const [items, setItems] = useState(routine?.exercises || []);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal para asignar y editar grupos de ejercicios
  const [groupModal, setGroupModal] = useState({
    open: false,
    targetIndices: [],
    groupName: "",
    groupColor: "teal",
    batchCount: 0,
    applyBatch: false,
    hasExisting: false,
  });

  const availableExercises = useMemo(() => [...exercises, ...createdExercises], [exercises, createdExercises]);
  const lookup = useMemo(() => new Map(availableExercises.map((item) => [item.id, item])), [availableExercises]);
  const addedIds = useMemo(() => new Set(items.map((item) => item.exerciseId)), [items]);

  // El reparto sale de muscleWeights del catalogo, no de una estimacion.
  const muscles = useMemo(
    () => muscleDistribution({ exercises: items }, lookup).slice(0, 5),
    [items, lookup],
  );

  // Agrupamiento consecutivo de ejercicios en bloques con color
  const sections = useMemo(() => {
    if (!items.length) return [];
    const result = [];
    let current = null;

    items.forEach((item, index) => {
      const groupName = item.group?.trim() || "";
      const groupColor = item.groupColor || (groupName ? "teal" : "");

      if (!current || current.groupName !== groupName || current.groupColor !== groupColor) {
        current = {
          id: `${groupName || "sin-grupo"}-${index}`,
          groupName,
          groupColor,
          items: [{ item, index }],
        };
        result.push(current);
      } else {
        current.items.push({ item, index });
      }
    });

    return result;
  }, [items]);

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

  function openGroupModalForIndex(index) {
    const item = items[index];
    const currentGroup = item.group || "";
    const currentColor = item.groupColor || "teal";

    // Contar cuántos ejercicios siguientes no tienen grupo
    let followingUnassigned = 0;
    for (let i = index + 1; i < items.length; i++) {
      if (!items[i].group) {
        followingUnassigned++;
      } else {
        break;
      }
    }

    setGroupModal({
      open: true,
      targetIndices: [index],
      groupName: currentGroup,
      groupColor: currentColor,
      batchCount: followingUnassigned,
      applyBatch: followingUnassigned > 0,
      hasExisting: !!currentGroup,
    });
  }

  function openGroupModalForSection(section) {
    const sectionIndices = section.items.map((it) => it.index);
    setGroupModal({
      open: true,
      targetIndices: sectionIndices,
      groupName: section.groupName,
      groupColor: section.groupColor || "teal",
      batchCount: 0,
      applyBatch: false,
      hasExisting: true,
    });
  }

  function openGroupModalForQuick(presetName, presetColor) {
    // Buscar ejercicios sin grupo
    const unassignedIndices = [];
    items.forEach((item, index) => {
      if (!item.group) unassignedIndices.push(index);
    });

    const target = unassignedIndices.length > 0 ? [unassignedIndices[0]] : [0];
    const following = unassignedIndices.length > 1 ? unassignedIndices.length - 1 : 0;

    setGroupModal({
      open: true,
      targetIndices: unassignedIndices.length > 0 ? unassignedIndices : target,
      groupName: presetName,
      groupColor: presetColor,
      batchCount: following,
      applyBatch: false,
      hasExisting: false,
    });
  }

  function saveGroupModal() {
    const groupName = groupModal.groupName.trim();
    const groupColor = groupModal.groupColor || "teal";

    if (!groupName) {
      removeGroupFromModal();
      return;
    }

    setItems((current) => {
      const targets = new Set(groupModal.targetIndices);
      if (groupModal.applyBatch && groupModal.targetIndices.length === 1) {
        const start = groupModal.targetIndices[0];
        for (let i = start + 1; i <= start + groupModal.batchCount && i < current.length; i++) {
          targets.add(i);
        }
      }

      return current.map((item, idx) => {
        if (targets.has(idx)) {
          return { ...item, group: groupName, groupColor };
        }
        return item;
      });
    });

    setGroupModal((curr) => ({ ...curr, open: false }));
  }

  function removeGroupFromModal() {
    setItems((current) => {
      const targets = new Set(groupModal.targetIndices);
      return current.map((item, idx) => {
        if (targets.has(idx)) {
          return { ...item, group: "", groupColor: "" };
        }
        return item;
      });
    });

    setGroupModal((curr) => ({ ...curr, open: false }));
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
    <div className="d2-compose-container">
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

      <div className="d2-compose-subhead">
        <p className="d2-label">{items.length === 0 ? "Ejercicios" : `Ejercicios · ${items.length}`}</p>
        {items.length > 0 && (
          <div className="d2-quick-group-bar">
            <span className="d2-quick-group-label">Agrupar:</span>
            {quickGroups(savedGroups).map((group) => (
              <button
                key={`${group.name}-${group.color}`}
                type="button"
                {...tonedProps(group.color, "d2-quick-group-btn")}
                onClick={() => openGroupModalForQuick(group.name, group.color)}
              >
                <span className="d2-group-dot" /> {group.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          {sections.map((section) => (
            <div
              key={section.id}
              className={`d2-panel ${section.groupName ? `d2-group-panel ${groupTone(section.groupColor).className}` : ""}`}
              style={section.groupName ? groupTone(section.groupColor).style : undefined}
            >
              {section.groupName && (
                <div className="d2-group-header">
                  <div className="d2-group-header-info">
                    <span className="d2-group-dot" />
                    <span className="d2-group-header-title">{section.groupName}</span>
                    <span className="d2-group-header-count">
                      {section.items.length} {section.items.length === 1 ? "ejercicio" : "ejercicios"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openGroupModalForSection(section)}
                    className="d2-group-edit-btn"
                  >
                    Editar grupo
                  </button>
                </div>
              )}

              {section.items.map(({ item, index }) => (
                <ExerciseItem
                  key={item.exerciseId}
                  item={item}
                  exercise={lookup.get(item.exerciseId)}
                  onChange={(next) => replace(item.exerciseId, next)}
                  onRemove={() =>
                    setItems((current) => current.filter((row) => row.exerciseId !== item.exerciseId))
                  }
                  onOpenGroup={() => openGroupModalForIndex(index)}
                  reorder={
                    items.length > 1
                      ? {
                          isFirst: index === 0,
                          isLast: index === items.length - 1,
                          onUp: () => setItems((current) => moveExercise(current, index, index - 1)),
                          onDown: () => setItems((current) => moveExercise(current, index, index + 1)),
                        }
                      : null
                  }
                />
              ))}
            </div>
          ))}
        </>
      )}

      <button type="button" onClick={() => setPicking(true)} className="d2-add">
        <PlusIcon size={17} width={1.8} />
        Agregar ejercicio
      </button>

      <label className="d2-form-field">
        Nota de la rutina (opcional)
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={2000}
          className="d2-input d2-textarea"
          placeholder="Indicaciones para este entrenamiento"
        />
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

      {/* Modal interactivo de asignación de grupo */}
      {groupModal.open && (
        <div className="d2-modal" role="dialog" aria-modal="true" aria-labelledby="d2-group-modal-title">
          <div className="d2-panel d2-modal-card d2-group-dialog">
            <h2 id="d2-group-modal-title" className="d2-modal-title">
              {groupModal.hasExisting ? "Editar grupo" : "Agrupar ejercicios"}
            </h2>
            <p className="d2-modal-text">
              Organizá tu rutina en bloques como Movilidad, Fuerza o Descanso.
            </p>

            {savedGroups.length > 0 && (
              <>
                <p className="d2-group-subtitle">Tus grupos</p>
                <div className="d2-group-presets">
                  {savedGroups.map((preset) => (
                    <PresetButton
                      key={`${preset.name}-${preset.color}`}
                      preset={preset}
                      selected={groupModal.groupName === preset.name && groupModal.groupColor === preset.color}
                      onPick={() =>
                        setGroupModal((curr) => ({ ...curr, groupName: preset.name, groupColor: preset.color }))
                      }
                    />
                  ))}
                </div>
                <p className="d2-group-subtitle">Categorías</p>
              </>
            )}
            <div className="d2-group-presets">
              {PRESET_GROUPS.map((preset) => (
                <PresetButton
                  key={preset.name}
                  preset={preset}
                  selected={groupModal.groupName === preset.name}
                  onPick={() =>
                    setGroupModal((curr) => ({ ...curr, groupName: preset.name, groupColor: preset.color }))
                  }
                />
              ))}
            </div>

            <label className="d2-form-field">
              <span>Nombre personalizado</span>
              <input
                type="text"
                value={groupModal.groupName}
                onChange={(e) =>
                  setGroupModal((curr) => ({ ...curr, groupName: e.target.value }))
                }
                placeholder="Ej: Movilidad, Fuerza, Descanso..."
                className="d2-input"
                maxLength={30}
              />
            </label>

            <div>
              <p className="d2-modal-text" style={{ margin: "10px 0 6px" }}>Color del bloque</p>
              <div className="d2-group-colors" role="radiogroup" aria-label="Color del bloque">
                {GROUP_COLORS.map((col) => {
                  const selected = groupModal.groupColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      {...tonedProps(col.id, `d2-group-color-dot-btn ${selected ? "d2-group-color-dot-selected" : ""}`)}
                      title={col.label}
                      aria-label={col.label}
                      onClick={() => setGroupModal((curr) => ({ ...curr, groupColor: col.id }))}
                    />
                  );
                })}
                {/* Cualquier color, no solo los de la paleta: se guarda como #rrggbb. */}
                <label
                  {...tonedProps(
                    isCustomColor(groupModal.groupColor) ? groupModal.groupColor : DEFAULT_GROUP_COLOR,
                    `d2-group-color-dot-btn d2-group-color-custom ${
                      isCustomColor(groupModal.groupColor) ? "d2-group-color-dot-selected" : ""
                    }`,
                  )}
                  title="Elegir otro color"
                >
                  <input
                    type="color"
                    aria-label="Elegir otro color"
                    value={groupColorHex(groupModal.groupColor)}
                    onChange={(e) => setGroupModal((curr) => ({ ...curr, groupColor: e.target.value.toLowerCase() }))}
                  />
                </label>
              </div>
            </div>

            {groupModal.groupName.trim() && (
              <p className="d2-group-preview">
                <span className="d2-group-preview-label">Así se ve:</span>
                <span {...tonedProps(groupModal.groupColor, "d2-group-pill d2-group-pill-active")}>
                  <span className="d2-group-dot" />
                  <span>{groupModal.groupName.trim()}</span>
                </span>
              </p>
            )}

            {groupModal.batchCount > 0 && (
              <label className="d2-group-batch-toggle">
                <input
                  type="checkbox"
                  className="d2-checkbox"
                  checked={groupModal.applyBatch}
                  onChange={(e) =>
                    setGroupModal((curr) => ({ ...curr, applyBatch: e.target.checked }))
                  }
                />
                <span>Aplicar a los siguientes {groupModal.batchCount} ejercicios</span>
              </label>
            )}

            <div className="d2-modal-actions">
              <button type="button" className="d2-modal-primary" onClick={saveGroupModal}>
                Aplicar grupo
              </button>
              {groupModal.hasExisting && (
                <button type="button" className="d2-modal-secondary" onClick={removeGroupFromModal}>
                  Quitar del grupo
                </button>
              )}
              <button
                type="button"
                className="d2-modal-secondary"
                onClick={() => setGroupModal((curr) => ({ ...curr, open: false }))}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {picking && (
        <ExercisePicker
          exercises={availableExercises}
          onCreated={(exercise) => setCreatedExercises((current) => [...current, exercise])}
          alreadyAdded={addedIds}
          onCancel={() => setPicking(false)}
          onConfirm={addChosen}
        />
      )}
    </div>
  );
}

/** Un atajo de categoría dentro del diálogo de grupo. */
function PresetButton({ preset, selected, onPick }) {
  return (
    <button
      type="button"
      {...tonedProps(preset.color, `d2-group-preset-btn ${selected ? "d2-group-preset-selected" : ""}`)}
      onClick={onPick}
    >
      <span className="d2-group-dot" />
      <span>{preset.name}</span>
    </button>
  );
}
