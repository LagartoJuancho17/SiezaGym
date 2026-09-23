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

const PRESET_GROUPS = [
  { name: "Movilidad", color: "teal" },
  { name: "Fuerza", color: "amber" },
  { name: "Descanso", color: "blue" },
  { name: "Calentamiento", color: "emerald" },
  { name: "Core", color: "purple" },
  { name: "Cardio", color: "rose" },
];

const GROUP_COLORS = [
  { id: "teal", label: "Verde azulado" },
  { id: "amber", label: "Ámbar / Naranja" },
  { id: "blue", label: "Celeste / Azul" },
  { id: "purple", label: "Violeta" },
  { id: "rose", label: "Rosa / Carmín" },
  { id: "emerald", label: "Verde esmeralda" },
  { id: "indigo", label: "Índigo" },
];

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
            <button
              type="button"
              className="d2-quick-group-btn d2-grp-teal"
              onClick={() => openGroupModalForQuick("Movilidad", "teal")}
            >
              <span className="d2-group-dot" /> Movilidad
            </button>
            <button
              type="button"
              className="d2-quick-group-btn d2-grp-amber"
              onClick={() => openGroupModalForQuick("Fuerza", "amber")}
            >
              <span className="d2-group-dot" /> Fuerza
            </button>
            <button
              type="button"
              className="d2-quick-group-btn d2-grp-blue"
              onClick={() => openGroupModalForQuick("Descanso", "blue")}
            >
              <span className="d2-group-dot" /> Descanso
            </button>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <>
          {sections.map((section) => (
            <div
              key={section.id}
              className={`d2-panel ${section.groupName ? `d2-group-panel d2-grp-${section.groupColor || "teal"}` : ""}`}
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

            <div className="d2-group-presets">
              {PRESET_GROUPS.map((preset) => {
                const selected = groupModal.groupName === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    className={`d2-group-preset-btn d2-grp-${preset.color} ${selected ? "d2-group-preset-selected" : ""}`}
                    onClick={() =>
                      setGroupModal((curr) => ({
                        ...curr,
                        groupName: preset.name,
                        groupColor: preset.color,
                      }))
                    }
                  >
                    <span className="d2-group-dot" />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
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
              <div className="d2-group-colors">
                {GROUP_COLORS.map((col) => {
                  const selected = groupModal.groupColor === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      className={`d2-group-color-dot-btn d2-grp-${col.id} ${selected ? "d2-group-color-dot-selected" : ""}`}
                      title={col.label}
                      aria-label={col.label}
                      onClick={() =>
                        setGroupModal((curr) => ({ ...curr, groupColor: col.id }))
                      }
                    />
                  );
                })}
              </div>
            </div>

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
