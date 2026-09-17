"use client";

import { useMemo, useState } from "react";
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT,
  EQUIPMENT_LABELS,
  PATTERNS,
  PATTERN_LABELS,
  REGISTRATION_TYPES,
  REGISTRATION_TYPE_LABELS,
  muscleWeightsSum,
} from "@/lib/exercises/constants";
import { createCustomExercise } from "@/app/(app)/rutinas/actions";

const WEIGHT_EPSILON = 0.01;

export default function CustomExerciseForm({ onCreated, onCancel }) {
  const [nameEs, setNameEs] = useState("");
  const [equipment, setEquipment] = useState(EQUIPMENT[0]);
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [registrationType, setRegistrationType] = useState(REGISTRATION_TYPES[0]);
  const [unilateral, setUnilateral] = useState(false);
  const [descriptionEs, setDescriptionEs] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [weights, setWeights] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sum = useMemo(() => muscleWeightsSum(weights), [weights]);
  const sumOk = selectedMuscles.length > 0 && Math.abs(sum - 1) <= WEIGHT_EPSILON;

  function toggleMuscle(muscle) {
    setSelectedMuscles((prev) => {
      if (prev.includes(muscle)) {
        setWeights((w) => {
          const next = { ...w };
          delete next[muscle];
          return next;
        });
        return prev.filter((m) => m !== muscle);
      }
      const next = [...prev, muscle];
      setWeights((w) => ({ ...w, [muscle]: w[muscle] ?? 0 }));
      return next;
    });
  }

  function setWeight(muscle, value) {
    const parsed = Math.max(0, Math.min(1, Number(value) || 0));
    setWeights((w) => ({ ...w, [muscle]: parsed }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!nameEs.trim()) {
      setError("Ponele un nombre al ejercicio.");
      return;
    }
    if (!sumOk) {
      setError(`Los pesos musculares suman ${sum.toFixed(2)}, tienen que sumar 1.0.`);
      return;
    }

    setSaving(true);
    try {
      const id = await createCustomExercise({
        nameEs: nameEs.trim(),
        equipment,
        pattern,
        registrationType,
        unilateral,
        descriptionEs,
        muscleWeights: weights,
      });
      onCreated({
        id,
        nameEs: nameEs.trim(),
        nameEn: nameEs.trim(),
        equipment,
        pattern,
        registrationType,
        unilateral,
        descriptionEs,
        muscleWeights: weights,
        mediaUrl: null,
        source: "custom",
      });
    } catch (err) {
      setError(err.message || "No se pudo crear el ejercicio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="d2-panel d2-form d2-custom-form">
      <div>
        <p className="d2-setting-name">
          Ejercicio propio
        </p>
        <p className="d2-setting-hint">
          No lo encontrás en el catálogo. creá el tuyo. Es privado, solo lo ves vos.
        </p>
      </div>

      <label className="d2-form-field">
        <span>Nombre</span>
        <input
          className="d2-input"
          value={nameEs}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="Ej: Press en banco Smith a un brazo"
          required
        />
      </label>

      <div className="d2-pair">
        <label className="d2-form-field">
          <span>Equipamiento</span>
          <select
            className="d2-input"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            {EQUIPMENT.map((eq) => (
              <option key={eq} value={eq}>
                {EQUIPMENT_LABELS[eq]}
              </option>
            ))}
          </select>
        </label>
        <label className="d2-form-field">
          <span>Patrón</span>
          <select
            className="d2-input"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          >
            {PATTERNS.map((p) => (
              <option key={p} value={p}>
                {PATTERN_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="d2-pair">
        <label className="d2-form-field">
          <span>Tipo de registro</span>
          <select
            className="d2-input"
            value={registrationType}
            onChange={(e) => setRegistrationType(e.target.value)}
          >
            {REGISTRATION_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {REGISTRATION_TYPE_LABELS[rt]}
              </option>
            ))}
          </select>
        </label>
        <label className="d2-inline-actions">
          <input
            type="checkbox"
            checked={unilateral}
            onChange={(e) => setUnilateral(e.target.checked)}
            className="d2-checkbox"
          />
          Unilateral
        </label>
      </div>

      <label className="d2-form-field">
        <span>Descripción (opcional)</span>
        <textarea
          className="d2-input d2-textarea"
          value={descriptionEs}
          onChange={(e) => setDescriptionEs(e.target.value)}
          placeholder="2-3 líneas de técnica"
        />
      </label>

      <div>
        <div className="d2-inline-actions">
          <span className="d2-form-note">Músculos que trabaja</span>
          <span
            className="d2-form-note" role="status"
          >
            Total: {sum.toFixed(2)}
          </span>
        </div>
        <p className="d2-setting-hint">
          Elegí uno o más y repartí el peso entre todos hasta que sumen 1.0. así entra bien en
          las estadísticas de progreso.
        </p>
        <div className="d2-segs">
          {MUSCLE_GROUPS.map((muscle) => {
            const active = selectedMuscles.includes(muscle);
            return (
              <button
                key={muscle}
                type="button"
                onClick={() => toggleMuscle(muscle)}
                aria-pressed={active}
                className={active ? "d2-seg d2-seg-on" : "d2-seg"}
              >
                {MUSCLE_GROUP_LABELS[muscle]}
              </button>
            );
          })}
        </div>

        {selectedMuscles.length > 0 ? (
          <div className="d2-stack">
            {selectedMuscles.map((muscle) => (
              <div key={muscle} className="d2-range-row">
                <span className="d2-form-note">
                  {MUSCLE_GROUP_LABELS[muscle]}
                </span>
                <input
                  aria-label={`Participación de ${MUSCLE_GROUP_LABELS[muscle]}`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights[muscle] ?? 0}
                  onChange={(e) => setWeight(muscle, e.target.value)}
                  className="d2-range"
                />
                <span className="d2-form-note">
                  {(weights[muscle] ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="d2-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="d2-modal-actions">
        <button
          type="button"
          onClick={onCancel}
          className="d2-modal-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !sumOk || !nameEs.trim()}
          className="d2-form-save"
        >
          {saving ? "Creando..." : "Crear ejercicio"}
        </button>
      </div>
    </form>
  );
}
